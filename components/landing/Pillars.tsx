import { LineChart, Wallet, Bot, Bell } from "lucide-react";

const PILLARS = [
    {
        icon: LineChart,
        title: "Markets & research",
        body: "Live quotes from Finnhub, embedded TradingView charts, fuzzy search across 10,000+ tickers, watchlist, daily AI-summarized news email.",
        accent: "text-blue-600 bg-blue-600/10 border-blue-600/30",
    },
    {
        icon: Wallet,
        title: "Paper trading",
        body: "$100k virtual portfolio. Atomic trades via MongoDB transactions. Equity curve, sector allocation, multi-user leaderboard ranked by return %.",
        accent: "text-yellow-400 bg-yellow-400/10 border-yellow-500/40",
    },
    {
        icon: Bot,
        title: "AI investment assistant",
        body: "Per-stock chatbot grounded in live quote + news. AI-scored sentiment timeline. Sentiment-shift alerts. Personalized weekly recap email.",
        accent: "text-purple-500 bg-purple-500/10 border-purple-500/30",
    },
    {
        icon: Bell,
        title: "Alerts that don't shout",
        body: "Price thresholds and AI sentiment crossings. Hourly cron checks. One-shot delivery — alerts auto-clear after firing.",
        accent: "text-teal-400 bg-teal-400/10 border-teal-400/30",
    },
];

export default function Pillars() {
    return (
        <section className="relative">
            {/* Local accent — soft purple wash to add scroll variety */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 right-1/4 h-72 w-[600px] rounded-full bg-purple-500/[0.08] blur-3xl" />
            </div>
            <div className="container py-20 md:py-24">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-100 tracking-tight">
                        Four pillars, one workspace
                    </h2>
                    <p className="mt-4 text-gray-400">
                        Everything a self-directed investor needs to learn the markets — without
                        the cost of being wrong.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {PILLARS.map((p) => {
                        const Icon = p.icon;
                        return (
                            <div
                                key={p.title}
                                className="rounded-lg border border-gray-600 bg-gray-800 p-6 hover:border-gray-500 transition-colors"
                            >
                                <div
                                    className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border ${p.accent} mb-4`}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-100 mb-2">
                                    {p.title}
                                </h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    {p.body}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
