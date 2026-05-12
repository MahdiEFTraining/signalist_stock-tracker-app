import { ImageOff } from "lucide-react";

// Slot definitions — render real screenshots when present in /public/landing/
// Until then, render labelled placeholders so the section is still complete.
const SHOTS = [
    {
        src: "/landing/portfolio.png",
        alt: "WealthFlow portfolio dashboard with summary cards, equity curve, and sector allocation",
        caption: "Portfolio dashboard",
        sub: "Summary cards · 30-day equity curve · sector donut · holdings · transactions",
    },
    {
        src: "/landing/chat.png",
        alt: "Per-stock chat panel mid-conversation with the Gemini-powered assistant",
        caption: "Per-stock AI assistant",
        sub: "Grounded in live quote, profile, and recent news. No buy/sell recommendations.",
    },
    {
        src: "/landing/sentiment.png",
        alt: "Daily news sentiment timeline with stacked positive/neutral/negative bars",
        caption: "News sentiment timeline",
        sub: "Daily AI-scored articles. Stacked bars per day. 7-day rolling badge.",
    },
];

function ShotPlaceholder({ caption }: { caption: string }) {
    return (
        <div className="aspect-[16/10] rounded-t-lg border-b border-gray-600 bg-gray-700 flex flex-col items-center justify-center gap-2 text-gray-500">
            <ImageOff className="w-6 h-6" />
            <p className="text-xs">{caption}</p>
            <p className="text-[10px] text-gray-600">drop a PNG into /public/landing/</p>
        </div>
    );
}

export default function Showcase() {
    return (
        <section className="relative bg-gradient-to-b from-gray-800/30 via-gray-800/50 to-gray-800/30 border-y border-gray-600/60">
            <div className="container py-20 md:py-24">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-100 tracking-tight">
                        Built for the way real investors learn
                    </h2>
                    <p className="mt-4 text-gray-400">
                        Watch the markets, ask questions, place trades, see what happens.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {SHOTS.map((s) => (
                        <figure
                            key={s.src}
                            className="rounded-lg border border-gray-600 bg-gray-800 overflow-hidden"
                        >
                            {/* Once a real PNG lands at /public/landing/<file>.png, replace
                                ShotPlaceholder with <Image src={s.src} alt={s.alt} ... /> */}
                            <ShotPlaceholder caption={s.caption} />
                            <figcaption className="p-4">
                                <h3 className="text-base font-semibold text-gray-100">{s.caption}</h3>
                                <p className="text-sm text-gray-500 mt-1">{s.sub}</p>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    );
}
