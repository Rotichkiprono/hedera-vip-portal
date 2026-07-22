import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Helper to acquire Daraja OAuth Access Token
 */
async function getDarajaToken(): Promise<string> {
    const consumerKey = process.env.DARAJA_CONSUMER_KEY!;
    const consumerSecret = process.env.DARAJA_CONSUMER_SECRET!;
    const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const response = await fetch(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
            headers: {
                Authorization: `Basic ${authHeader}`,
            },
        }
    );

    const data = await response.json();
    return data.access_token;
}

export async function POST(request: Request) {
    try {
        const { phoneNumber, userId, amount = 10 } = await request.json();

        if (!phoneNumber || !userId) {
            return NextResponse.json(
                { error: 'Phone number and User ID are required.' },
                { status: 400 }
            );
        }

        // 1. Sanitize Phone Number to 254XXXXXXXXX format
        let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = `254${formattedPhone.substring(1)}`;
        } else if (formattedPhone.startsWith('+254')) {
            formattedPhone = formattedPhone.substring(1);
        }

        // 2. Generate Daraja Password & Timestamp
        const shortcode = process.env.DARAJA_BUSINESS_SHORTCODE!;
        const passkey = process.env.DARAJA_PASSKEY!;

        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');

        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

        // 3. Get OAuth Token and Dispatch STK Push Request
        const accessToken = await getDarajaToken();

        const stkPayload = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: process.env.DARAJA_CALLBACK_URL!,
            AccountReference: 'HederaVIPPortal',
            TransactionDesc: 'Hedera VIP Access Pass',
        };

        const stkResponse = await fetch(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(stkPayload),
            }
        );

        const stkData = await stkResponse.json();

        if (stkData.ResponseCode !== '0') {
            return NextResponse.json(
                { error: stkData.CustomerMessage || 'Failed to initiate STK Push' },
                { status: 500 }
            );
        }

        // 4. Record Pending Transaction in Supabase
        const { error: dbError } = await supabase.from('transactions').insert({
            user_id: userId,
            checkout_request_id: stkData.CheckoutRequestID,
            amount_kes: amount,
            status: 'PENDING',
        });

        if (dbError) {
            console.error('Supabase Transaction Recording Error:', dbError);
        }

        return NextResponse.json({
            message: 'STK Push initiated successfully',
            checkoutRequestId: stkData.CheckoutRequestID,
        });
    } catch (error) {
        console.error('STK Push Initiation Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}