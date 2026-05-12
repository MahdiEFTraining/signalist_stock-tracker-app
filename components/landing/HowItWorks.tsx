import { UserPlus, Search, TrendingUp } from "lucide-react";

const STEPS = [
    {
        n: "01",
        icon: UserPlus,
        title: "Sign up in 30 seconds",
        body: "Tell us your country, risk tolerance, and preferred industry. We use this to personalize your welcome email and weekly recap.",
    },
    {
        n: "02",
        icon: Search,
        title: "Build your watchlist",
        body: "Search 10,000+ tickers, follow what interests you, and start receiving daily AI-summarized news for your stocks.",
    },
    {
        n: "03",
        icon: TrendingUp,
        title: "Trade & learn",
        body: "Execute paper trades atomically, watch your equity curve grow, set price or AI-sentiment alerts, and chat with the per-stock assistant.",
    },
];

export default function HowItWorks() {
    return (
        <section className="relative">
            {/* Local accent — soft teal wash, opposite corner from Pillars for rhythm */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-10 left-1/4 h-72 w-[600px] rounded-full bg-teal-400/[0.08] blur-3xl" />
            </div>
            <div className="container py-20 md:py-24">
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-600 bg-gray-800 text-xs font-medium text-gray-400 mb-4">
                        How it works
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-100 tracking-tight">
                        From sign-up to first trade in minutes
                    </h2>
                </div>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-7 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent -z-10" />

                    {STEPS.map((s) => {
                        const Icon = s.icon;
                        return (
                            <div
                                key={s.n}
                                className="relative rounded-lg border border-gray-600 bg-gray-800 p-6 hover:border-gray-500 transition-colors"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-900 border border-gray-600">
                                        <Icon className="w-6 h-6 text-yellow-400" />
                                    </span>
                                    <span className="text-3xl font-bold text-gray-700">{s.n}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-100 mb-2">{s.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
