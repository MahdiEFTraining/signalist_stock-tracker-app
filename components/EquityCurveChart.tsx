"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const fmtUSD = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtUSDFull = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const fmtDateShort = (s: string) => {
    const d = new Date(s + "T00:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
};

type Point = { date: string; totalValue: number };

export default function EquityCurveChart({
    snapshots,
    liveTotalValue,
    initialCash,
    portfolioCreatedAt,
}: {
    snapshots: PortfolioSnapshot[];
    liveTotalValue: number;
    initialCash: number;
    portfolioCreatedAt: Date;
}) {
    const today = new Date().toISOString().slice(0, 10);
    const createdDate = new Date(portfolioCreatedAt).toISOString().slice(0, 10);

    const points: Point[] = [];

    // Synthetic starting point (portfolio creation date, initial cash)
    if (snapshots.length === 0 || snapshots[0].date > createdDate) {
        points.push({ date: createdDate, totalValue: initialCash });
    }

    for (const s of snapshots) {
        points.push({ date: s.date, totalValue: s.totalValue });
    }

    // Append today's live value if not already snapshotted today
    const last = points[points.length - 1];
    if (!last || last.date !== today) {
        points.push({ date: today, totalValue: liveTotalValue });
    } else {
        // Replace today's stale snapshot with the live value for accuracy
        points[points.length - 1] = { date: today, totalValue: liveTotalValue };
    }

    const positive = liveTotalValue >= initialCash;
    const stroke = positive ? "#22c55e" : "#ef4444";
    const gradientId = positive ? "equity-gradient-pos" : "equity-gradient-neg";

    const minVal = Math.min(...points.map((p) => p.totalValue), initialCash);
    const maxVal = Math.max(...points.map((p) => p.totalValue), initialCash);
    const padding = (maxVal - minVal) * 0.1 || initialCash * 0.02;

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-gray-200 font-medium">Equity curve</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Last {Math.max(points.length - 1, 0)} day{points.length - 1 === 1 ? "" : "s"} ·
                        baseline {fmtUSDFull(initialCash)}
                    </p>
                </div>
            </div>

            <div className="w-full h-64 min-w-0">
                <ResponsiveContainer width="100%" height={256}>
                    <AreaChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={stroke} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={stroke} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#374151" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={fmtDateShort}
                            stroke="#6b7280"
                            tick={{ fill: "#9ca3af", fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            domain={[minVal - padding, maxVal + padding]}
                            tickFormatter={fmtUSD}
                            stroke="#6b7280"
                            tick={{ fill: "#9ca3af", fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            width={70}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                                borderRadius: "8px",
                                color: "#e5e7eb",
                            }}
                            labelFormatter={(label) => fmtDateShort(String(label))}
                            formatter={(value) => [fmtUSDFull(Number(value)), "Total Value"]}
                        />
                        <Area
                            type="monotone"
                            dataKey="totalValue"
                            stroke={stroke}
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            activeDot={{ r: 4, stroke: stroke, fill: "#1f2937", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
