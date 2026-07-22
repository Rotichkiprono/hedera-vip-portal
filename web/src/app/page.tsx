import { VipCheckoutCard } from "@/components/vip-checkout-card"

export default function Page() {
  return (
    <main
      className="flex-1 flex flex-col items-center justify-center pt-16"
      aria-label="Main content"
    >
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-24 flex flex-col items-center justify-center gap-12">

        {/* Eyebrow tag */}
        <span
          className="inline-flex items-center gap-2 rounded-sm border px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.25em]"
          style={{
            borderColor: "oklch(0.82 0.18 196 / 30%)",
            color: "var(--neon)",
            background: "oklch(0.82 0.18 196 / 6%)",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: "var(--neon)" }}
            aria-hidden="true"
          />
          Access Portal — Online
        </span>

        {/* Heading placeholder */}
        <h1
          className="font-sans text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-balance leading-none"
          style={{ color: "var(--foreground)" }}
        >
          Your Content
          <br />
          <span className="neon-glow">Goes Here</span>
        </h1>

        {/* Subheading placeholder */}
        <p className="text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed font-sans font-medium">
          This main content area is intentionally empty and ready for your exclusive sections — drops, media, tour dates, and more.
        </p>

        {/* Decorative divider */}
        <div
          className="h-px w-32"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, oklch(0.82 0.18 196 / 60%) 50%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* ── VIP Checkout Card ── */}
        <VipCheckoutCard />

      </div>
    </main>
  )
}
