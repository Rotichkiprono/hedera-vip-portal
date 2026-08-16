import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";

export const runtime = "nodejs";

const artifactPath = path.join(
    process.cwd(),
    "../contracts/ignition/deployments/chain-296/artifacts/RoyaltySplitterModule#RoyaltySplitter.json"
);

const artifact = JSON.parse(
    readFileSync(artifactPath, "utf8")
) as { abi: ethers.InterfaceAbi };

// Initialize Supabase with the Service Role Key to bypass RLS
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // --------------------------------------------------
        // 1. Parse Safaricom Daraja Callback
        // --------------------------------------------------
        const callbackData = data?.Body?.stkCallback;

        if (!callbackData) {
            return NextResponse.json(
                { error: "Invalid callback format" },
                { status: 400 }
            );
        }

        const { ResultCode, CheckoutRequestID } = callbackData;

        // --------------------------------------------------
        // 2. Handle failed STK Push
        // --------------------------------------------------
        if (ResultCode !== 0) {
            await supabase
                .from("transactions")
                .update({
                    status: "FAILED",
                })
                .eq("checkout_request_id", CheckoutRequestID);

            return NextResponse.json({
                ResultCode: 0,
                ResultDesc: "STK Push Failed",
            });
        }

        // --------------------------------------------------
        // 3. Mark Fiat Payment as Cleared
        // --------------------------------------------------
        const { error: fiatUpdateError } = await supabase
            .from("transactions")
            .update({
                status: "FIAT_CLEARED",
                mpesa_receipt_number: "TEST_RECEIPT_15", // Replace with actual receipt from callback
            })
            .eq("checkout_request_id", CheckoutRequestID);

        if (fiatUpdateError) {
            console.error("Failed updating fiat status:", fiatUpdateError);
        }

        // --------------------------------------------------
        // 4. Fetch Transaction + User Wallet
        // --------------------------------------------------
        const { data: txData, error: txError } = await supabase
            .from("transactions")
            .select("id, users(evm_address)")
            .eq("checkout_request_id", CheckoutRequestID)
            .single();

        if (txError || !txData) {
            console.error(txError);

            return NextResponse.json({
                ResultCode: 0,
                ResultDesc: "Transaction not found",
            });
        }

        const txUsers = (txData as {
            users?:
                | { evm_address?: string | null }
                | Array<{ evm_address?: string | null }>
                | null;
        }).users;

        const recipientEvmAddress = Array.isArray(txUsers)
            ? txUsers[0]?.evm_address
            : txUsers?.evm_address;

        if (!recipientEvmAddress) {
            console.error("No EVM Address found.");

            await supabase
                .from("transactions")
                .update({
                    status: "FAILED",
                })
                .eq("checkout_request_id", CheckoutRequestID);

            return NextResponse.json({
                ResultCode: 0,
                ResultDesc: "Missing EVM Address",
            });
        }

        // --------------------------------------------------
        // 5. Initialize Hedera Relayer
        // --------------------------------------------------
        const provider = new ethers.JsonRpcProvider(
            process.env.HEDERA_JSON_RPC_URL
        );

        const wallet = new ethers.Wallet(
            process.env.TREASURY_PRIVATE_KEY_ECDSA!,
            provider
        );

        const splitterAddress = process.env.NEXT_PUBLIC_ROYALTY_SPLITTER_ADDRESS!;

        const abi = artifact.abi;

        const splitterContract = new ethers.Contract(
            splitterAddress,
            abi,
            wallet
        );

        // --------------------------------------------------
        // 6. Execute Smart Contract (Isolated Try/Catch)
        // --------------------------------------------------
        try {
            const ticketPriceInWei = ethers.parseEther("10.0");
            const recipientEvmAddress = wallet.address;

            const tx = await splitterContract.purchaseTicket(
                recipientEvmAddress,
                {
                    value: ticketPriceInWei,
                    gasLimit: 3000000,
                }
            );

            const receipt = await tx.wait();

            // Blockchain transaction successful
            await supabase
                .from("transactions")
                .update({
                    status: "COMPLETED",
                    hedera_tx_hash: receipt.hash,
                })
                .eq("checkout_request_id", CheckoutRequestID);

            console.log(
                "Hedera transaction successful:",
                receipt.hash
            );
        } catch (contractError) {
            console.error(
                "Hedera Smart Contract Execution Failed:",
                contractError
            );

            // Mark transaction as failed
            await supabase
                .from("transactions")
                .update({
                    status: "FAILED",
                })
                .eq("checkout_request_id", CheckoutRequestID);
        }

        // --------------------------------------------------
        // 7. Always acknowledge Safaricom
        // --------------------------------------------------
        return NextResponse.json({
            ResultCode: 0,
            ResultDesc: "Success",
        });
    } catch (error) {
        console.error("M-Pesa Webhook Error:", error);

        // Always acknowledge callback to prevent retries
        return NextResponse.json({
            ResultCode: 0,
            ResultDesc: "Server Error during blockchain execution",
        });
    }
}
