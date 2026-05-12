"use client";

import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

const fmtUSD = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Distinct, dark-theme-friendly palette
const PALETTE = [
    "#facc15", // yellow-400
    "#60a5fa", // blue-400
    "#34d399", // emerald-400
    "#f87171", // red-400
    "#a78bfa", // violet-400
    "#fb923c", // orange-400
    "#22d3ee", // cyan-400
    "#f472b6", // pink-400
    "#a3e635", // lime-400
    "#94a3b8", // slate-400
];

export default function SectorAllocationChart({
    sectors,
}: {
    sectors: SectorAllocation[];
}) {
    if (sectors.length === 0) {
        return (
            <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-5 flex flex-col h-full">
                <h3 className="text-gray-200 font-medium">Sector allocation</h3>
                <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                    Buy stocks to see your sector mix.
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-5 flex flex-col h-full">
            <h3 className="text-gray-200 font-medium mb-4">Sector allocation</h3>

            <div className="w-full h-48 min-w-0">
                <ResponsiveContainer width="100%" height={192}>
                    <PieChart>
                        <Pie
                            data={sectors}
                            dataKey="value"
                            nameKey="sector"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={80}
                            paddingAngle={2}
                            stroke="#1f2937"
                            strokeWidth={2}
                        >
                            {sectors.map((_, i) => (
                                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                                borderRadius: "8px",
                                color: "#e5e7eb",
                            }}
                            formatter={(value, _name, item) => {
                                const v = Number(value);
                                const payload = item?.payload as SectorAllocation | undefined;
                                const pct = payload?.percent ?? 0;
                                const sector = payload?.sector ?? "";
                                return [`${fmtUSD(v)} (${pct.toFixed(1)}%)`, sector];
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <ul className="flex flex-col gap-1.5 mt-4 text-sm">
                {sectors.map((s, i) => (
                    <li
                        key={s.sector}
                        className="flex items-center justify-between gap-3"
                    >
                        <span className="flex items-center gap-2 min-w-0">
                            <span
                                className="w-2.5 h-2.5 rounded-sm shrink-0"
                                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                            />
                            <span className="text-gray-300 truncate">{s.sector}</span>
                        </span>
                        <span className="text-gray-400 text-xs shrink-0">
                            {s.percent.toFixed(1)}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
