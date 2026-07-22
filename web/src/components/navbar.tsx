"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

const NAV_LINKS = [
    { label: "The Vault", href: "/vault" },
    { label: "Verify Pass", href: "/verify" },
]

export function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <header
            className="fixed top-0 inset-x-0 z-50"
            role="banner"
        >
            {/* Backdrop blur bar */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md neon-border border-b" />

            <nav
                className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-10"
                aria-label="Main navigation"
            >
                {/* ── Logo ── */}
                <Link
                    href="/"
                    className="flex items-center gap-2.5 group focus-visible:outline-none"
                    aria-label="VIP Portal home"
                >
                    {/* Geometric diamond mark */}
                    <span className="relative flex h-8 w-8 items-center justify-center" aria-hidden="true">
                        <span className="absolute inset-0 rotate-45 rounded-sm border neon-border bg-accent transition-transform duration-300 group-hover:rotate-[50deg]" />
                        <span
                            className="relative z-10 h-2.5 w-2.5 rounded-[1px] rotate-45 neon-glow"
                            style={{ background: "var(--neon)" }}
                        />
                    </span>

                    {/* Wordmark */}
                    <span className="font-sans text-lg font-black uppercase tracking-[0.18em] neon-glow select-none">
                        ARTIST
                        <span
                            className="ml-1 text-xs align-top font-bold tracking-widest"
                            style={{ color: "var(--muted-foreground)" }}
                        >
                            VIP
                        </span>
                    </span>
                </Link>

                {/* ── Desktop nav links ── */}
                <ul className="hidden md:flex items-center gap-8" role="list">
                    {NAV_LINKS.map(({ label, href }) => (
                        <li key={href}>
                            <Link
                                href={href}
                                className="relative font-sans text-sm font-semibold uppercase tracking-widest text-muted-foreground transition-colors duration-200 hover:text-foreground group focus-visible:outline-none focus-visible:text-foreground"
                            >
                                {label}
                                {/* Neon underline on hover */}
                                <span
                                    className="absolute -bottom-0.5 left-0 h-px w-0 transition-all duration-300 group-hover:w-full"
                                    style={{ background: "var(--neon)" }}
                                    aria-hidden="true"
                                />
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* ── Verify Pass CTA (desktop) ── */}
                <div className="hidden md:flex items-center">
                    <Link
                        href="/verify"
                        className="inline-flex items-center gap-2 rounded-sm border px-5 py-2 font-sans text-xs font-bold uppercase tracking-[0.16em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        style={{
                            borderColor: "var(--neon)",
                            color: "var(--neon)",
                            boxShadow: "0 0 12px oklch(0.82 0.18 196 / 20%)",
                        }}
                        onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLAnchorElement
                            el.style.background = "oklch(0.82 0.18 196 / 10%)"
                            el.style.boxShadow = "0 0 24px oklch(0.82 0.18 196 / 35%)"
                        }}
                        onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLAnchorElement
                            el.style.background = "transparent"
                            el.style.boxShadow = "0 0 12px oklch(0.82 0.18 196 / 20%)"
                        }}
                    >
                        Verify Pass
                    </Link>
                </div>

                {/* ── Mobile menu toggle ── */}
                <button
                    className="md:hidden flex items-center justify-center rounded-sm p-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setMobileOpen((prev) => !prev)}
                    aria-expanded={mobileOpen}
                    aria-controls="mobile-menu"
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </nav>

            {/* ── Mobile drawer ── */}
            <div
                id="mobile-menu"
                className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                    }`}
                aria-hidden={!mobileOpen}
            >
                <div className="relative bg-surface/95 backdrop-blur-md border-b neon-border px-6 py-6">
                    <ul className="flex flex-col gap-6" role="list">
                        {NAV_LINKS.map(({ label, href }) => (
                            <li key={href}>
                                <Link
                                    href={href}
                                    onClick={() => setMobileOpen(false)}
                                    className="font-sans text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6 pt-6 border-t border-border">
                        <Link
                            href="/verify"
                            className="inline-flex items-center gap-2 rounded-sm border px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.16em] transition-colors"
                            style={{ borderColor: "var(--neon)", color: "var(--neon)" }}
                            onClick={() => setMobileOpen(false)}
                        >
                            Verify Pass
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}
