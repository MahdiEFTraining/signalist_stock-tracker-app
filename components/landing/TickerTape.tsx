// Decorative scrolling ticker — fake but plausible quotes for visual texture.
// Real quotes would require a Finnhub call on every landing page render — overkill.
const TICKERS = [
    { symbol: "AAPL",  price: "187.45", change: "+1.24",  pct: "+0.67%",  up: true  },
    { symbol: "MSFT",  price: "412.18", change: "+3.05",  pct: "+0.74%",  up: true  },
    { symbol: "GOOGL", price: "164.92", change: "-0.83",  pct: "-0.50%",  up: false },
    { symbol: "TSLA",  price: "248.31", change: "+5.62",  pct: "+2.31%",  up: true  },
    { symbol: "NVDA",  price: "892.40", change: "-12.15", pct: "-1.34%",  up: false },
    { symbol: "META",  price: "511.27", change: "+2.81",  pct: "+0.55%",  up: true  },
    { symbol: "AMZN",  price: "183.94", change: "+1.62",  pct: "+0.89%",  up: true  },
    { symbol: "JPM",   price: "208.55", change: "-1.04",  pct: "-0.50%",  up: false },
    { symbol: "BRK.B", price: "418.27", change: "+0.95",  pct: "+0.23%",  up: true  },
    { symbol: "V",     price: "278.91", change: "+1.47",  pct: "+0.53%",  up: true  },
    { symbol: "JNJ",   price: "152.34", change: "-0.71",  pct: "-0.46%",  up: false },
    { symbol: "WMT",   price: "84.62",  change: "+0.38",  pct: "+0.45%",  up: true  },
];

function Item({ t }: { t: typeof TICKERS[number] }) {
    return (
        <span className="inline-flex items-center gap-2 px-5 text-sm whitespace-nowrap shrink-0">
            <span className="font-semibold text-gray-100">{t.symbol}</span>
            <span className="text-gray-400">${t.price}</span>
            <span className={t.up ? "text-teal-400" : "text-red-500"}>
                {t.change} ({t.pct})
            </span>
        </span>
    );
}

export default function TickerTape() {
    return (
        <div className="border-y border-gray-600 bg-gray-800/80 overflow-hidden">
            <div className="flex animate-ticker py-3">
                {/* Render the list twice back-to-back for a seamless loop */}
                {[...TICKERS, ...TICKERS].map((t, i) => (
                    <Item key={`${t.symbol}-${i}`} t={t} />
                ))}
            </div>
        </div>
    );
}
