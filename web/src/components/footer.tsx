"use client"

import Link from "next/link"

// ── Social icon SVG paths ──────────────────────────────────────────────────
const SOCIAL_LINKS: { label: string; href: string; icon: React.ReactNode }[] = [
    {
        label: "Instagram",
        href: "https://instagram.com",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className="h-5 w-5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
        ),
    },
    {
        label: "X / Twitter",
        href: "https://x.com",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L2 2.25h6.912l4.263 5.633 5.069-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        label: "Spotify",
        href: "https://spotify.com",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 01-.277-1.215c3.809-.87 7.077-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.785-2.13-9.965-1.165a.78.78 0 01-.453-1.492c3.633-1.103 8.147-.568 11.233 1.328a.78.78 0 01.257 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.938.938 0 11-.543-1.794c3.527-1.07 9.396-.863 13.104 1.338a.938.938 0 01-.944 1.613z" />
            </svg>
        ),
    },
    {
        label: "YouTube",
        href: "https://youtube.com",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
    },
    {
        label: "TikTok",
        href: "https://tiktok.com",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.18 8.18 0 004.78 1.52V6.94a4.85 4.85 0 01-1.01-.25z" />
            </svg>
        ),
    },
]

const FOOTER_LINKS = [
    { label: "The Vault", href: "/vault" },
    { label: "Verify Pass", href: "/verify" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
]

const CURRENT_YEAR = new Date().getFullYear()

export function Footer() {
    return (
        <footer
            className="relative mt-auto border-t neon-border"
            style={{ background: "var(--surface)" }}
            role="contentinfo"
        >
            {/* Subtle top neon line */}
            <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                    background:
                        "linear-gradient(90deg, transparent 0%, oklch(0.82 0.18 196 / 40%) 50%, transparent 100%)",
                }}
                aria-hidden="true"
            />

            <div className="mx-auto max-w-7xl px-6 md:px-10 py-12 md:py-16">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:items-start">

                    {/* ── Brand block ── */}
                    <div className="flex flex-col gap-4">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2.5 group focus-visible:outline-none w-fit"
                            aria-label="VIP Portal home"
                        >
                            <span className="relative flex h-7 w-7 items-center justify-center" aria-hidden="true">
                                <span className="absolute inset-0 rotate-45 rounded-sm border neon-border bg-accent" />
                                <span
                                    className="relative z-10 h-2 w-2 rounded-[1px] rotate-45"
                                    style={{ background: "var(--neon)" }}
                                />
                            </span>
                            <span className="font-sans text-base font-black uppercase tracking-[0.18em] neon-glow">
                                ARTIST
                                <span
                                    className="ml-1 text-[10px] align-top font-bold tracking-widest"
                                    style={{ color: "var(--muted-foreground)" }}
                                >
                                    VIP
                                </span>
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
                            Exclusive access for verified fans. Your pass unlocks everything behind the curtain.
                        </p>
                    </div>

                    {/* ── Nav links ── */}
                    <nav aria-label="Footer navigation">
                        <p className="mb-4 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Navigate
                        </p>
                        <ul className="flex flex-col gap-3" role="list">
                            {FOOTER_LINKS.map(({ label, href }) => (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        className="font-sans text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* ── Social icons ── */}
                    <div>
                        <p className="mb-4 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Follow
                        </p>
                        <ul className="flex items-center gap-4" role="list">
                            {SOCIAL_LINKS.map(({ label, href, icon }) => (
                                <li key={label}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={label}
                                        className="flex items-center justify-center rounded-sm p-2 text-muted-foreground transition-all duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        style={{ border: "1px solid oklch(1 0 0 / 8%)" }}
                                        onMouseEnter={(e) => {
                                            const el = e.currentTarget as HTMLAnchorElement
                                            el.style.borderColor = "oklch(0.82 0.18 196 / 40%)"
                                            el.style.color = "var(--neon)"
                                            el.style.boxShadow = "0 0 10px oklch(0.82 0.18 196 / 20%)"
                                        }}
                                        onMouseLeave={(e) => {
                                            const el = e.currentTarget as HTMLAnchorElement
                                            el.style.borderColor = "oklch(1 0 0 / 8%)"
                                            el.style.color = ""
                                            el.style.boxShadow = ""
                                        }}
                                    >
                                        {icon}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ── Bottom bar ── */}
                <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="font-sans text-xs text-muted-foreground tracking-wide">
                        &copy; {CURRENT_YEAR} Artist VIP Portal. All rights reserved.
                    </p>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                        Authorized Access Only
                    </p>
                </div>
            </div>
        </footer>
    )
}
