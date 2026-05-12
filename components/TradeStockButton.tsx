"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import TradeModal from "@/components/TradeModal";

export default function TradeStockButton({
    symbol,
    company,
}: {
    symbol: string;
    company: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="watchlist-btn flex items-center justify-center bg-yellow-500/10 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/20"
            >
                <TrendingUp className="w-4 h-4 mr-2" />
                Trade
            </button>

            <TradeModal
                symbol={symbol}
                company={company}
                open={open}
                setOpen={setOpen}
            />
        </>
    );
}
