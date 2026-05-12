"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react";

const POS_COLOR = "#22c55e";
const NEU_COLOR = "#6b7280";
const NEG_COLOR = "#ef4444";

const fmtDateShort = (s: string) => {
    const d = new Date(s + "T00:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
};

function labelColor(label: SentimentLabel): string {
    if (label === "positive") return "text-green-400 border-green-500/40 bg-green-500/10";
    if (label === "negative") return "text-red-400 border-red-500/40 bg-red-500/10";
    return "text-gray-300 border-gray-600 bg-gray-700/30";
}

function LabelIcon({ label }: { label: SentimentLabel }) {
    if (label === "positive") return <TrendingUp className="w-3.5 h-3.5" />;
    if (label === "negative") return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
}

export default function SentimentTimelineChart({
    symbol,
    timeline,
    summary,
    days,
}: {
    symbol: string;
    timeline: SentimentTimelinePoint[];
    summary: SentimentSummary | null;
    days: number;
}) {
    const empty = timeline.length === 0;

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <h3 className="text-gray-100 font-medium">News sentiment — {symbol}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Last {days} days · AI-scored from Finnhub headlines
                    </p>
                </div>

                {summary && (
                    <div
                        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border ${labelColor(summary.label)}`}
                        title={`${summary.articleCount} article(s) in last ${summary.windowDays} days`}
                    >
                        <LabelIcon label={summary.label} />
                        <span className="font-medium capitalize">{summary.label}</span>
                        <span className="opacity-70">
                            ({summary.avgSentiment >= 0 ? "+" : ""}
                            {summary.avgSentiment.toFixed(2)})
                        </span>
                    </div>
                )}
            </div>

            {empty ? (
                <div className="rounded-md border border-dashed border-gray-700 px-4 py-10 text-center text-sm text-gray-500">
                    No sentiment data yet. Once the daily cron runs, this chart will populate.
                </div>
            ) : (
                <div className="w-full h-56 min-w-0">
                    <ResponsiveContainer width="100%" height={224}>
                        <BarChart
                            data={timeline}
                            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                            barGap={2}
                        >
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
                                stroke="#6b7280"
                                tick={{ fill: "#9ca3af", fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1f2937",
                                    border: "1px solid #374151",
                                    borderRadius: "8px",
                                    color: "#e5e7eb",
                                }}
                                labelFormatter={(label) => fmtDateShort(String(label))}
                                formatter={(value, name, item) => {
                                    const point = item?.payload as SentimentTimelinePoint | undefined;
                                    if (name === "positiveCount")
                                        return [`${value} positive`, " "];
                                    if (name === "neutralCount")
                                        return [`${value} neutral`, " "];
                                    if (name === "negativeCount") {
                                        const avg = point?.avgSentiment ?? 0;
                                        return [
                                            `${value} negative · avg ${avg >= 0 ? "+" : ""}${avg.toFixed(2)}`,
                                            " ",
                                        ];
                                    }
                                    return [String(value), String(name)];
                                }}
                            />
                            <Bar dataKey="positiveCount" stackId="s" fill={POS_COLOR} radius={[0, 0, 0, 0]}>
                                {timeline.map((_, i) => (
                                    <Cell key={`p-${i}`} fill={POS_COLOR} />
                                ))}
                            </Bar>
                            <Bar dataKey="neutralCount" stackId="s" fill={NEU_COLOR}>
                                {timeline.map((_, i) => (
                                    <Cell key={`n-${i}`} fill={NEU_COLOR} />
                                ))}
                            </Bar>
                            <Bar dataKey="negativeCount" stackId="s" fill={NEG_COLOR}>
                                {timeline.map((_, i) => (
                                    <Cell key={`g-${i}`} fill={NEG_COLOR} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: POS_COLOR }} />
                            Positive
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: NEU_COLOR }} />
                            Neutral
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: NEG_COLOR }} />
                            Negative
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
