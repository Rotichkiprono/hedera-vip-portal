"use client"
import { useState, useId, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ── Types ──────────────────────────────────────────────────────────────────
type CheckoutState = "idle" | "loading" | "success" | "error"

// ── Constants ──────────────────────────────────────────────────────────────
const TICKET_LABEL = "VIP Access Pass"
const TICKET_PRICE = "KES 1,000"
const EVENT_NAME = "ARTIST — NAIROBI NIGHT DROP"
const EVENT_DATE = "SAT 02 AUG 2025  ·  DOORS 20:00 EAT"

// ── Placeholder payment handler (wire up your own backend here) ────────────
// async function handlePaymentSubmit(phone: string): Promise<void> {
//   // 1. POST to /api/payments/mpesa/stk-push with { phone, amount: 1000 }
//   // 2. Start polling /api/payments/status?checkoutRequestId=... via Supabase
//   //    Realtime or a setInterval until status === "SUCCESS" | "FAILED"
//   // 3. On SUCCESS → setCheckoutState("success")
//   //    On FAILED  → setCheckoutState("error"), setErrorMsg(reason)
// }

// ── Helpers ────────────────────────────────────────────────────────────────
function formatKenyanPhone(raw: string): string {
    // Normalise leading 0 → 254 for display; keep raw value for submission
    return raw.replace(/^0/, "254")
}

function isValidKenyanPhone(value: string): boolean {
    // Accept 07XXXXXXXX (10 digits) or 2547XXXXXXXX (12 digits)
    return /^(07\d{8}|2547\d{8})$/.test(value.replace(/\s/g, ""))
}

// ── Sub-components ─────────────────────────────────────────────────────────

function PassStrip() {
    return (
        /* Decorative perforated strip at the top of the card */
        <div className="relative flex items-center gap-0 px-6" aria-hidden="true">
            {/* Left half-circle notch */}
            <div
                className="absolute -left-3.5 h-7 w-7 rounded-full"
                style={{ background: "oklch(0.10 0.002 285)" }}
            />
            {/* Dashed perforation line */}
            <div
                className="flex-1 border-t-2 border-dashed"
                style={{ borderColor: "oklch(1 0 0 / 10%)" }}
            />
            {/* Right half-circle notch */}
            <div
                className="absolute -right-3.5 h-7 w-7 rounded-full"
                style={{ background: "oklch(0.10 0.002 285)" }}
            />
        </div>
    )
}

function SpinnerIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
    )
}

function CheckIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-14 w-14"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M7.5 12.5l3 3 6-6" />
        </svg>
    )
}

function MpesaLogo() {
    /* Simple inline wordmark — avoids external image dependency */
    return (
        <span
            className="font-black tracking-tight text-sm"
            style={{ color: "#4CAF50", letterSpacing: "0.02em" }}
        >
            M<span style={{ color: "#fff" }}>-</span>PESA
        </span>
    )
}

// ── Main component ──────────────────────────────────────────────────────────
export function VipCheckoutCard() {
    const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle")
    const [phone, setPhone] = useState("")
    const [errorMsg, setErrorMsg] = useState("")
    const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null) // NEW
    const inputId = useId()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErrorMsg("")

        if (!isValidKenyanPhone(phone)) {
            setErrorMsg("Enter a valid Kenyan number — e.g. 0712 345 678 or 254712345678.")
            return
        }

        setCheckoutState("loading")

        try {
            // CRITICAL: Because your Supabase 'transactions' table requires a valid user_id 
            // that references 'auth.users', you MUST paste a real UUID from your database here for testing.
            const TEST_USER_ID = "2f0e1848-c02e-493d-b648-3a78ca4feaef"

            const res = await fetch("/api/webhooks/mpesa/stkpush", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phoneNumber: formatKenyanPhone(phone),
                    userId: TEST_USER_ID,
                    amount: 1 // Ensure this matches the price you want to test
                })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || "STK Push failed to initiate")

            // This triggers the useEffect polling hook below
            setCheckoutRequestId(data.checkoutRequestId)

        } catch (err: any) {
            console.error("Payment initiation error:", err)
            setErrorMsg(err.message || "Failed to connect to M-Pesa.")
            setCheckoutState("error")
        }
    }
    useEffect(() => {
        if (!checkoutRequestId) return

        // Initialize standard client-side Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const pollInterval = setInterval(async () => {
            const { data, error } = await supabase
                .from('transactions')
                .select('status, hedera_tx_hash')
                .eq('checkout_request_id', checkoutRequestId)
                .single()

            if (data) {
                if (data.status === 'COMPLETED') {
                    setCheckoutState("success")
                    clearInterval(pollInterval)
                } else if (data.status === 'FAILED') {
                    setErrorMsg("Payment failed, timed out, or was cancelled on your phone.")
                    setCheckoutState("error")
                    clearInterval(pollInterval)
                }
            }
        }, 3000) // Poll every 3 seconds

        return () => clearInterval(pollInterval) // Cleanup if component unmounts
    }, [checkoutRequestId])

    function handleReset() {
        setCheckoutState("idle")
        setPhone("")
        setErrorMsg("")
    }

    // ── Inline style maps for the neon accent color ─────────────────────────
    const neonCyan = "oklch(0.82 0.18 196)"
    const neonPurple = "oklch(0.72 0.22 300)"

    // Card outer glow changes per state
    const cardGlow =
        checkoutState === "success"
            ? `0 0 0 1px ${neonCyan}30, 0 0 40px ${neonCyan}25, 0 20px 60px ${neonCyan}10`
            : checkoutState === "error"
                ? "0 0 0 1px oklch(0.65 0.22 27 / 40%), 0 0 40px oklch(0.65 0.22 27 / 20%)"
                : `0 0 0 1px ${neonPurple}30, 0 0 40px ${neonPurple}20, 0 20px 60px oklch(0 0 0 / 60%)`

    return (
        <div className="w-full max-w-sm mx-auto">
            <Card
                className="relative overflow-visible rounded-2xl border-0"
                style={{
                    background: "oklch(0.14 0.006 285)",
                    boxShadow: cardGlow,
                    transition: "box-shadow 0.6s ease",
                }}
            >
                {/* ── Top accent bar ─────────────────────────────────────────────── */}
                <div
                    className="h-1.5 w-full rounded-t-2xl"
                    style={{
                        background: `linear-gradient(90deg, ${neonPurple}, ${neonCyan})`,
                    }}
                    aria-hidden="true"
                />

                <CardContent className="p-0">

                    {/* ── Pass header ─────────────────────────────────────────────── */}
                    <div className="px-6 pt-6 pb-5 flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                            {/* Eyebrow */}
                            <span
                                className="font-sans text-[10px] font-bold uppercase tracking-[0.22em]"
                                style={{ color: neonPurple }}
                            >
                                Exclusive · Limited
                            </span>
                            {/* Ticket type */}
                            <h2
                                className="font-sans text-2xl font-black uppercase tracking-tight leading-none text-balance"
                                style={{ color: "var(--foreground)" }}
                            >
                                {TICKET_LABEL}
                            </h2>
                            <p
                                className="mt-1.5 font-sans text-[11px] font-semibold uppercase tracking-widest"
                                style={{ color: "oklch(0.55 0.005 285)" }}
                            >
                                {EVENT_NAME}
                            </p>
                            <p
                                className="font-sans text-[10px] font-medium"
                                style={{ color: "oklch(0.45 0.004 285)" }}
                            >
                                {EVENT_DATE}
                            </p>
                        </div>

                        {/* Price badge */}
                        <div
                            className="shrink-0 flex flex-col items-end gap-0.5"
                        >
                            <span
                                className="font-sans text-[9px] font-bold uppercase tracking-widest"
                                style={{ color: "oklch(0.50 0.005 285)" }}
                            >
                                Price
                            </span>
                            <span
                                className="font-sans text-xl font-black leading-none"
                                style={{ color: "var(--foreground)" }}
                            >
                                {TICKET_PRICE}
                            </span>
                            <span
                                className="font-sans text-[9px]"
                                style={{ color: "oklch(0.45 0.004 285)" }}
                            >
                                incl. fees
                            </span>
                        </div>
                    </div>

                    {/* ── Perforated divider ──────────────────────────────────────── */}
                    <PassStrip />

                    {/* ── Dynamic content area ────────────────────────────────────── */}
                    <div className="px-6 pt-5 pb-6 min-h-[220px] flex flex-col justify-center">

                        {/* ── IDLE / ERROR state ──────────────────────────────────── */}
                        {(checkoutState === "idle" || checkoutState === "error") && (
                            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label
                                        htmlFor={inputId}
                                        className="font-sans text-xs font-bold uppercase tracking-widest"
                                        style={{ color: "oklch(0.60 0.005 285)" }}
                                    >
                                        M-Pesa Phone Number
                                    </Label>
                                    <div className="relative">
                                        {/* Country flag chip */}
                                        <span
                                            className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 font-sans text-xs font-semibold select-none"
                                            style={{ color: "oklch(0.55 0.005 285)" }}
                                            aria-hidden="true"
                                        >
                                            🇰🇪
                                            <span
                                                className="h-3.5 w-px"
                                                style={{ background: "oklch(1 0 0 / 12%)" }}
                                            />
                                        </span>
                                        <Input
                                            id={inputId}
                                            type="tel"
                                            inputMode="numeric"
                                            autoComplete="tel"
                                            placeholder="07XX XXX XXX"
                                            value={phone}
                                            onChange={(e) => {
                                                setErrorMsg("")
                                                setPhone(e.target.value)
                                            }}
                                            maxLength={15}
                                            className="pl-12 font-sans font-medium tracking-wider h-11 rounded-lg border-0 focus-visible:ring-1"
                                            style={{
                                                background: "oklch(0.18 0.004 285)",
                                                color: "var(--foreground)",
                                                "--tw-ring-color": neonPurple,
                                            } as React.CSSProperties}
                                            aria-invalid={checkoutState === "error" && !!errorMsg}
                                            aria-describedby={errorMsg ? `${inputId}-error` : undefined}
                                        />
                                    </div>

                                    {/* Error message */}
                                    {errorMsg && (
                                        <p
                                            id={`${inputId}-error`}
                                            role="alert"
                                            className="font-sans text-[11px] font-medium leading-relaxed"
                                            style={{ color: "oklch(0.75 0.20 27)" }}
                                        >
                                            {errorMsg}
                                        </p>
                                    )}
                                </div>

                                {/* Pay button */}
                                <Button
                                    type="submit"
                                    className="h-12 w-full rounded-lg font-sans font-black uppercase tracking-widest text-sm border-0 cursor-pointer transition-all duration-200"
                                    style={{
                                        background: `linear-gradient(135deg, ${neonPurple}, ${neonCyan})`,
                                        color: "oklch(0.10 0.002 285)",
                                        boxShadow: `0 0 24px ${neonPurple}40`,
                                    }}
                                >
                                    <MpesaLogo />
                                    <span className="ml-2">Pay with M-Pesa</span>
                                </Button>

                                <p
                                    className="text-center font-sans text-[10px]"
                                    style={{ color: "oklch(0.40 0.004 285)" }}
                                >
                                    You will receive an STK Push to {phone ? formatKenyanPhone(phone) : "your phone"}.
                                    <br />
                                    Enter your M-Pesa PIN to confirm.
                                </p>
                            </form>
                        )}

                        {/* ── LOADING state ───────────────────────────────────────── */}
                        {checkoutState === "loading" && (
                            <div
                                role="status"
                                aria-live="polite"
                                aria-label="Payment processing"
                                className="flex flex-col items-center gap-5 text-center"
                            >
                                {/* Animated spinner ring */}
                                <div className="relative flex items-center justify-center">
                                    <SpinnerIcon
                                        className="h-12 w-12 animate-spin"
                                        style={{ color: neonPurple } as React.CSSProperties}
                                    />
                                    {/* Inner pulsing dot */}
                                    <span
                                        className="absolute h-3 w-3 rounded-full animate-pulse"
                                        style={{ background: neonCyan }}
                                        aria-hidden="true"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <p
                                        className="font-sans font-black uppercase tracking-widest text-sm"
                                        style={{ color: "var(--foreground)" }}
                                    >
                                        Awaiting PIN
                                    </p>
                                    <p
                                        className="font-sans text-[12px] leading-relaxed"
                                        style={{ color: "oklch(0.60 0.005 285)" }}
                                    >
                                        Check your phone. Enter your M-Pesa PIN
                                        <br />
                                        to complete the purchase.
                                    </p>
                                    <p
                                        className="font-sans text-[10px] font-medium"
                                        style={{ color: "oklch(0.45 0.004 285)" }}
                                    >
                                        Sending to {formatKenyanPhone(phone)}
                                    </p>
                                </div>

                                {/* Progress bar */}
                                <div
                                    className="w-full h-px overflow-hidden rounded-full"
                                    style={{ background: "oklch(1 0 0 / 8%)" }}
                                    aria-hidden="true"
                                >
                                    <div
                                        className="h-full rounded-full animate-pulse"
                                        style={{
                                            width: "60%",
                                            background: `linear-gradient(90deg, ${neonPurple}, ${neonCyan})`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── SUCCESS state ────────────────────────────────────────── */}
                        {checkoutState === "success" && (
                            <div
                                role="status"
                                aria-live="polite"
                                aria-label="Payment successful"
                                className="flex flex-col items-center gap-4 text-center"
                            >
                                {/* Glowing checkmark */}
                                <div
                                    style={{
                                        color: neonCyan,
                                        filter: `drop-shadow(0 0 12px ${neonCyan}) drop-shadow(0 0 28px ${neonCyan}60)`,
                                    }}
                                >
                                    <CheckIcon />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <p
                                        className="font-sans font-black uppercase tracking-widest text-sm"
                                        style={{ color: "var(--foreground)" }}
                                    >
                                        Payment Successful
                                    </p>
                                    <p
                                        className="font-sans text-[12px] leading-relaxed"
                                        style={{ color: "oklch(0.60 0.005 285)" }}
                                    >
                                        VIP Pass minted to your wallet.
                                        <br />
                                        Welcome to the inner circle.
                                    </p>
                                </div>

                                {/* Access code pill */}
                                <div
                                    className="flex items-center gap-2 rounded-md px-3 py-1.5"
                                    style={{ background: `${neonCyan}12`, border: `1px solid ${neonCyan}30` }}
                                >
                                    <span
                                        className="h-1.5 w-1.5 rounded-full animate-pulse"
                                        style={{ background: neonCyan }}
                                        aria-hidden="true"
                                    />
                                    <span
                                        className="font-mono text-[11px] font-semibold tracking-widest uppercase"
                                        style={{ color: neonCyan }}
                                    >
                                        VIP-{Math.random().toString(36).slice(2, 8).toUpperCase()}
                                    </span>
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleReset}
                                    variant="ghost"
                                    className="mt-1 h-8 font-sans text-[11px] font-semibold uppercase tracking-widest"
                                    style={{ color: "oklch(0.40 0.004 285)" }}
                                >
                                    Start Over
                                </Button>
                            </div>
                        )}

                    </div>

                    {/* ── Bottom meta bar ─────────────────────────────────────────── */}
                    <div
                        className="mx-6 mb-6 flex items-center justify-between rounded-lg px-3 py-2"
                        style={{ background: "oklch(0.11 0.003 285)" }}
                    >
                        <span
                            className="font-sans text-[9px] font-bold uppercase tracking-[0.2em]"
                            style={{ color: "oklch(0.35 0.004 285)" }}
                        >
                            Secured · Non-Refundable
                        </span>
                        <span
                            className="font-sans text-[9px] font-bold uppercase tracking-[0.2em]"
                            style={{ color: "oklch(0.35 0.004 285)" }}
                        >
                            1 of 50 Remaining
                        </span>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}
