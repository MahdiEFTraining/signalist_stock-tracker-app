import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, ArrowDownRight, Sparkles, Bot } from "lucide-react";

function FloatingCard({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`absolute rounded-lg border border-gray-600 bg-gray-800/95 backdrop-blur p-3 shadow-2xl shadow-black/40 ${className ?? ""}`}
        >
            {children}
        </div>
    );
}

export default function Hero() {
    return (
        <section className="relative overflow-hidden">
            {/* SVG-style grid background, masked at the edges */}
            <div className="absolute inset-0 -z-10 hero-grid-bg" />

            {/* Ambient brand glow */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[900px] rounded-full bg-yellow-400/[0.10] blur-3xl" />
                <div className="absolute top-40 -left-32 h-72 w-72 rounded-full bg-teal-400/[0.06] blur-3xl" />
                <div className="absolute top-40 -right-32 h-72 w-72 rounded-full bg-purple-500/[0.06] blur-3xl" />
            </div>

            <div className="container pt-16 pb-24 md:pt-20 md:pb-28 lg:pt-24 lg:pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                    {/* Left: copy */}
                    <div className="lg:col-span-6 flex flex-col gap-6 text-center lg:text-left items-center lg:items-start">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500/40 bg-yellow-400/10 text-yellow-400 text-xs font-medium">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI-augmented stock research
                        </span>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-100 leading-[1.05]">
                            Practice the markets.
                            <br />
                            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent">
                                Let AI handle the noise.
                            </span>
                        </h1>

                        <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                            Trade real markets with $100,000 of virtual cash. Ask any stock anything.
                            Get AI-scored sentiment on the news that moves your watchlist —
                            delivered to your inbox every Monday.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href="/sign-up"
                                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 text-base font-medium shadow-lg shadow-yellow-500/20 transition-colors"
                            >
                                Start with $100k virtual
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/sign-in"
                                className="inline-flex items-center justify-center h-12 px-6 rounded-lg border border-gray-600 bg-gray-800 text-gray-400 text-base font-medium hover:text-gray-100 hover:border-gray-500 hover:bg-gray-700 transition-colors"
                            >
                                Sign in
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2">
                            <span className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-60 animate-ping" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
                                </span>
                                Live market data
                            </span>
                            <span className="text-gray-700">·</span>
                            <span>No real money</span>
                            <span className="text-gray-700">·</span>
                            <span>No credit card</span>
                        </div>
                    </div>

                    {/* Right: dashboard preview + floating mock cards */}
                    <div className="lg:col-span-6 relative">
                        <div className="relative aspect-[4/3] w-full rounded-xl border border-gray-600 bg-gray-800 overflow-hidden shadow-2xl shadow-black/50">
                            {/* Subtle gradient overlay so floating cards stay readable */}
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-900/10 to-gray-900/40 z-10 pointer-events-none" />
                            <Image
                                src="/assets/images/dashboard.png"
                                alt="WealthFlow dashboard"
                                width={1440}
                                height={1080}
                                priority
                                className="absolute inset-0 w-full h-full object-cover object-left-top"
                            />
                        </div>

                        {/* Floating stock card — top-left */}
                        <FloatingCard className="hidden md:block -top-4 -left-4 w-44 animate-float-soft z-20">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-semibold text-gray-100">AAPL</span>
                                <span className="flex items-center gap-1 text-xs text-teal-400 font-medium">
                                    <ArrowUpRight className="w-3 h-3" />
                                    +1.24%
                                </span>
                            </div>
                            <div className="text-xl font-bold text-gray-100">$187.45</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">Apple Inc.</div>
                        </FloatingCard>

                        {/* Floating sentiment badge — top-right */}
                        <FloatingCard className="hidden md:block top-12 -right-4 w-52 animate-float-soft-2 z-20">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                                <span className="text-xs font-medium text-gray-100">News sentiment</span>
                            </div>
                            <div className="flex items-end gap-1 h-8">
                                <div className="flex-1 bg-teal-400/80 rounded-sm" style={{ height: "60%" }} />
                                <div className="flex-1 bg-teal-400/80 rounded-sm" style={{ height: "75%" }} />
                                <div className="flex-1 bg-gray-500/60 rounded-sm" style={{ height: "40%" }} />
                                <div className="flex-1 bg-teal-400/80 rounded-sm" style={{ height: "85%" }} />
                                <div className="flex-1 bg-teal-400/80 rounded-sm" style={{ height: "70%" }} />
                                <div className="flex-1 bg-red-500/70 rounded-sm" style={{ height: "30%" }} />
                                <div className="flex-1 bg-teal-400/80 rounded-sm" style={{ height: "90%" }} />
                            </div>
                            <div className="text-[11px] text-teal-400 font-medium mt-2">Positive (+0.42)</div>
                        </FloatingCard>

                        {/* Floating P&L card — bottom-left */}
                        <FloatingCard className="hidden md:block -bottom-4 left-12 w-48 animate-float-soft-3 z-20">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] uppercase tracking-wider text-gray-500">Today's P&L</span>
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-70 animate-pulse-dot" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
                                </span>
                            </div>
                            <div className="text-xl font-bold text-teal-400">+$1,247.50</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">+1.18% · 6 positions</div>
                        </FloatingCard>

                        {/* Floating chat card — bottom-right */}
                        <FloatingCard className="hidden lg:block bottom-8 -right-6 w-56 animate-float-soft z-20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400/15 border border-yellow-500/40">
                                    <Bot className="w-3.5 h-3.5 text-yellow-400" />
                                </span>
                                <span className="text-xs font-medium text-gray-100">Ask about TSLA</span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Recent news points to delivery beats and a softening EV price war —
                                grounded in 5 articles from the last 48h.
                            </p>
                        </FloatingCard>

                        {/* Floating ArrowDown ghost — purely decorative */}
                        <ArrowDownRight className="hidden lg:block absolute -top-8 right-1/3 w-5 h-5 text-red-500/30 animate-float-soft-2" />
                    </div>
                </div>
            </div>
        </section>
    );
}
