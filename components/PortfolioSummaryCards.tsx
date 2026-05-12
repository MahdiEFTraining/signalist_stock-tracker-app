import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet, Briefcase, TrendingUp } from "lucide-react";

const fmtUSD = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const fmtPct = (n: number) =>
    `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const fmtSigned = (n: number) =>
    `${n >= 0 ? "+" : ""}${fmtUSD(n)}`;

function Card({
    label,
    value,
    sub,
    icon,
    tone = "neutral",
}: {
    label: string;
    value: string;
    sub?: { text: string; positive?: boolean };
    icon: React.ReactNode;
    tone?: "neutral" | "positive" | "negative";
}) {
    const valueColor =
        tone === "positive"
            ? "text-green-400"
            : tone === "negative"
              ? "text-red-400"
              : "text-gray-100";

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-gray-500">
                    {label}
                </span>
                <span className="text-gray-500">{icon}</span>
            </div>
            <div className={`text-2xl font-semibold ${valueColor}`}>{value}</div>
            {sub && (
                <div
                    className={`text-sm flex items-center gap-1 ${
                        sub.positive ? "text-green-400" : "text-red-400"
                    }`}
                >
                    {sub.positive ? (
                        <ArrowUpRight className="w-4 h-4" />
                    ) : (
                        <ArrowDownRight className="w-4 h-4" />
                    )}
                    {sub.text}
                </div>
            )}
        </div>
    );
}

export default function PortfolioSummaryCards({ summary }: { summary: PortfolioSummary }) {
    const totalReturnPositive = summary.totalReturn >= 0;
    const todayPositive = summary.todayPnL >= 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
                label="Total Value"
                value={fmtUSD(summary.totalValue)}
                sub={{
                    text: `${fmtSigned(summary.totalReturn)} (${fmtPct(summary.totalReturnPercent)}) all-time`,
                    positive: totalReturnPositive,
                }}
                icon={<TrendingUp className="w-4 h-4" />}
                tone={totalReturnPositive ? "positive" : "negative"}
            />
            <Card
                label="Cash"
                value={fmtUSD(summary.cashBalance)}
                icon={<Wallet className="w-4 h-4" />}
            />
            <Card
                label="Holdings"
                value={fmtUSD(summary.holdingsValue)}
                icon={<Briefcase className="w-4 h-4" />}
            />
            <Card
                label="Today's P&L"
                value={fmtSigned(summary.todayPnL)}
                sub={{
                    text: `${fmtPct(summary.todayPnLPercent)} today`,
                    positive: todayPositive,
                }}
                icon={<DollarSign className="w-4 h-4" />}
                tone={todayPositive ? "positive" : "negative"}
            />
        </div>
    );
}
