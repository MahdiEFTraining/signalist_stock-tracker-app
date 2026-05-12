"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownCircle } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import TradeModal from "@/components/TradeModal";

const fmtUSD = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const fmtSigned = (n: number) => `${n >= 0 ? "+" : ""}${fmtUSD(n)}`;

export default function HoldingsTable({ holdings }: { holdings: HoldingWithLivePrice[] }) {
    const [sellTarget, setSellTarget] = useState<{ symbol: string; company: string } | null>(null);

    if (holdings.length === 0) {
        return (
            <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-10 text-center">
                <p className="text-gray-300 text-lg">No positions yet</p>
                <p className="text-gray-500 text-sm mt-1">
                    Search a stock and click <span className="text-yellow-400">Trade</span> to open
                    your first position.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-block mt-4 px-4 py-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                    Browse stocks
                </Link>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800/40 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-gray-700">
                        <TableHead className="text-gray-400 px-4">Symbol</TableHead>
                        <TableHead className="text-gray-400">Qty</TableHead>
                        <TableHead className="text-gray-400 text-right">Avg Cost</TableHead>
                        <TableHead className="text-gray-400 text-right">Price</TableHead>
                        <TableHead className="text-gray-400 text-right">Market Value</TableHead>
                        <TableHead className="text-gray-400 text-right">Unrealized P&L</TableHead>
                        <TableHead className="text-gray-400 text-right pr-4">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {holdings.map((h) => {
                        const positive = h.unrealizedPnL >= 0;
                        return (
                            <TableRow
                                key={h.symbol}
                                className="border-gray-700 hover:bg-gray-800/60"
                            >
                                <TableCell className="px-4">
                                    <Link
                                        href={`/stocks/${h.symbol}`}
                                        className="flex flex-col"
                                    >
                                        <span className="text-gray-100 font-medium">
                                            {h.symbol}
                                        </span>
                                        <span className="text-xs text-gray-500 truncate max-w-[180px]">
                                            {h.company}
                                        </span>
                                    </Link>
                                </TableCell>
                                <TableCell className="text-gray-200">{h.quantity}</TableCell>
                                <TableCell className="text-right text-gray-300">
                                    {fmtUSD(h.avgCostBasis)}
                                </TableCell>
                                <TableCell className="text-right text-gray-200">
                                    {h.currentPrice > 0 ? (
                                        fmtUSD(h.currentPrice)
                                    ) : (
                                        <span className="text-gray-500 text-xs">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right text-gray-100 font-medium">
                                    {fmtUSD(h.marketValue)}
                                </TableCell>
                                <TableCell
                                    className={`text-right font-medium ${
                                        positive ? "text-green-400" : "text-red-400"
                                    }`}
                                >
                                    <div>{fmtSigned(h.unrealizedPnL)}</div>
                                    <div className="text-xs font-normal opacity-80">
                                        {fmtPct(h.unrealizedPnLPercent)}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSellTarget({ symbol: h.symbol, company: h.company })
                                        }
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-red-500/40 text-red-400 hover:bg-red-500/10 cursor-pointer text-sm"
                                    >
                                        <ArrowDownCircle className="w-3.5 h-3.5" />
                                        Sell
                                    </button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {sellTarget && (
                <TradeModal
                    symbol={sellTarget.symbol}
                    company={sellTarget.company}
                    open={true}
                    setOpen={(o) => {
                        if (!o) setSellTarget(null);
                    }}
                    defaultSide="sell"
                />
            )}
        </div>
    );
}
