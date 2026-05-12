const STATS = [
    { value: "$100k", label: "Virtual starting balance" },
    { value: "10,000+", label: "Tickers searchable" },
    { value: "7", label: "Background AI jobs" },
    { value: "24/7", label: "Sentiment monitoring" },
];

export default function Stats() {
    return (
        <section className="relative bg-gradient-to-r from-gray-800/30 via-gray-800/50 to-gray-800/30 border-y border-gray-600/60">
            <div className="container py-12 md:py-14">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {STATS.map((s) => (
                        <div
                            key={s.label}
                            className="text-center md:border-r md:last:border-r-0 md:border-gray-600 md:px-4"
                        >
                            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                                {s.value}
                            </div>
                            <div className="text-xs md:text-sm text-gray-500 mt-2 tracking-wide">
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
