import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// Initialize Supabase with the Service Role Key to bypass RLS for admin webhook updates
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // 1. Parse Safaricom Daraja STK Push Callback
        const callbackData = data?.Body?.stkCallback;
        if (!callbackData) {
            return NextResponse.json({ error: "Invalid callback format" }, { status: 400 });
        }

        const { ResultCode, CheckoutRequestID } = callbackData;

        // 2. Handle Failed Fiat Payments (Insufficient funds, user cancelled, etc.)
        if (ResultCode !== 0) {
            await supabase
                .from('transactions')
                .update({ status: 'FAILED' })
                .eq('checkout_request_id', CheckoutRequestID);

            // Always return ResultCode: 0 to Daraja so it stops retrying the webhook
            return NextResponse.json({ ResultCode: 0, ResultDesc: "Failed payment acknowledged" });
        }

        // 3. Fetch the pending transaction & user details
        const { data: txData, error: txError } = await supabase
            .from('transactions')
            .select('id, users(evm_address)')
            .eq('checkout_request_id', CheckoutRequestID)
            .single();

        if (txError || !txData) {
            return NextResponse.json({ ResultCode: 0, ResultDesc: "Transaction not found" });
        }

        // Lock the transaction status
        await supabase.from('transactions').update({ status: 'FIAT_CLEARED' }).eq('id', txData.id);

        // 4. Relayer Execution: Trigger Smart Contract via Ethers.js
        const provider = new ethers.JsonRpcProvider(process.env.HEDERA_JSON_RPC_URL);
        const wallet = new ethers.Wallet(process.env.TREASURY_PRIVATE_KEY_ECDSA!, provider);

        const splitterAddress = process.env.NEXT_PUBLIC_ROYALTY_SPLITTER_ADDRESS!;
        const abi = ["function purchaseTicket(address recipient) external payable"];
        const splitterContract = new ethers.Contract(splitterAddress, abi, wallet);

        // Convert ticket price to Wei (Assuming 10 HBAR for this example. 1 HBAR = 10^18 Wei on JSON-RPC)
        const ticketPriceInWei = ethers.parseEther("10.0");
        const recipientEvmAddress = txData.users[0].evm_address;

        // Execute the transaction on Hedera
        const tx = await splitterContract.purchaseTicket(recipientEvmAddress, {
            value: ticketPriceInWei
        });

        const receipt = await tx.wait();

        // 5. Finalize Transaction State
        await supabase
            .from('transactions')
            .update({
                status: 'COMPLETED',
                hedera_tx_hash: receipt.hash
            })
            .eq('id', txData.id);

        // Safaricom requires exactly this response format for success
        return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });

    } catch (error) {
        console.error("M-Pesa Webhook Error:", error);
        // Return success to Safaricom even on our internal failure to prevent callback spam
        return NextResponse.json({ ResultCode: 0, ResultDesc: "Server Error during blockchain execution" });
    }
}