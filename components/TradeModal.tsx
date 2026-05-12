"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { executeTrade, getTradeContext } from "@/lib/actions/portfolio.actions";

const fmtUSD = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function TradeModal({
    symbol,
    company,
    open,
    setOpen,
    defaultSide = "buy",
}: TradeModalProps) {
    const router = useRouter();
    const [side, setSide] = useState<"buy" | "sell">(defaultSide);
    const [quantity, setQuantity] = useState<string>("1");
    const [pending, startTransition] = useTransition();

    const [loadingCtx, setLoadingCtx] = useState(false);
    const [ctx, setCtx] = useState<{
        cashBalance: number;
        sharesOwned: number;
        avgCostBasis: number;
        livePrice: number;
    } | null>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoadingCtx(true);
        setCtx(null);
        getTradeContext(symbol)
            .then((data) => {
                if (!cancelled) setCtx(data);
            })
            .finally(() => {
                if (!cancelled) setLoadingCtx(false);
            });
        return () => {
            cancelled = true;
        };
    }, [open, symbol]);

    useEffect(() => {
        if (open) {
            setSide(defaultSide);
            setQuantity("1");
        }
    }, [open, defaultSide]);

    const qtyNum = Number(quantity);
    const qtyValid = Number.isFinite(qtyNum) && qtyNum > 0 && Number.isInteger(qtyNum);
    const price = ctx?.livePrice ?? 0;
    const total = qtyValid ? qtyNum * price : 0;

    let validationError: string | null = null;
    if (ctx) {
        if (!qtyValid) validationError = "Enter a positive whole number";
        else if (price <= 0) validationError = "Live price unavailable — try again later";
        else if (side === "buy" && total > ctx.cashBalance)
            validationError = `Need ${fmtUSD(total)}, have ${fmtUSD(ctx.cashBalance)}`;
        else if (side === "sell" && qtyNum > ctx.sharesOwned)
            validationError = `Trying to sell ${qtyNum}, own ${ctx.sharesOwned}`;
    }

    const canSubmit = !pending && !loadingCtx && !validationError && ctx !== null && price > 0;

    const handleSubmit = () => {
        if (!canSubmit) return;
        startTransition(async () => {
            const result = await executeTrade({
                symbol,
                company,
                side,
                quantity: qtyNum,
            });

            if (result.success) {
                toast.success(
                    `${side === "buy" ? "Bought" : "Sold"} ${qtyNum} ${symbol}`,
                    {
                        description: `at ${fmtUSD(result.executedPrice ?? 0)} • total ${fmtUSD(result.totalValue ?? 0)}`,
                    }
                );
                setOpen(false);
                router.refresh();
            } else {
                toast.error("Trade failed", { description: result.error });
            }
        });
    };

    const unrealized =
        ctx && ctx.sharesOwned > 0 && price > 0
            ? (price - ctx.avgCostBasis) * ctx.sharesOwned
            : 0;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="alert-dialog sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="alert-title">
                        Trade {symbol}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 mt-2">
                    {/* Buy / Sell toggle */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setSide("buy")}
                            className={`flex items-center justify-center gap-2 py-2 rounded-md border transition-colors cursor-pointer ${
                                side === "buy"
                                    ? "bg-green-600/20 border-green-500 text-green-400"
                                    : "border-gray-600 text-gray-400 hover:bg-gray-800"
                            }`}
                        >
                            <ArrowUpCircle className="w-4 h-4" />
                            Buy
                        </button>
                        <button
                            type="button"
                            onClick={() => setSide("sell")}
                            className={`flex items-center justify-center gap-2 py-2 rounded-md border transition-colors cursor-pointer ${
                                side === "sell"
                                    ? "bg-red-600/20 border-red-500 text-red-400"
                                    : "border-gray-600 text-gray-400 hover:bg-gray-800"
                            }`}
                        >
                            <ArrowDownCircle className="w-4 h-4" />
                            Sell
                        </button>
                    </div>

                    {/* Live price */}
                    <div className="flex items-center justify-between rounded-md border border-gray-700 px-3 py-2 bg-gray-800/40">
                        <span className="text-sm text-gray-400">Live price</span>
                        <span className="text-base font-semibold text-gray-100">
                            {loadingCtx ? (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                            ) : price > 0 ? (
                                fmtUSD(price)
                            ) : (
                                <span className="text-red-400 text-sm">unavailable</span>
                            )}
                        </span>
                    </div>

                    {/* Quantity input */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="form-label">Quantity (shares)</Label>
                        <Input
                            type="number"
                            min="1"
                            step="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="form-input"
                            placeholder="e.g. 10"
                        />
                    </div>

                    {/* Total preview */}
                    <div className="flex items-center justify-between rounded-md border border-gray-700 px-3 py-2 bg-gray-800/40">
                        <span className="text-sm text-gray-400">
                            {side === "buy" ? "Total cost" : "Proceeds"}
                        </span>
                        <span className="text-base font-semibold text-gray-100">
                            {qtyValid && price > 0 ? fmtUSD(total) : "—"}
                        </span>
                    </div>

                    {/* Account context */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-md border border-gray-700 px-3 py-2 bg-gray-800/20">
                            <div className="text-gray-500 text-xs uppercase tracking-wide">Cash</div>
                            <div className="text-gray-200 font-medium mt-0.5">
                                {ctx ? fmtUSD(ctx.cashBalance) : "—"}
                            </div>
                        </div>
                        <div className="rounded-md border border-gray-700 px-3 py-2 bg-gray-800/20">
                            <div className="text-gray-500 text-xs uppercase tracking-wide">Shares owned</div>
                            <div className="text-gray-200 font-medium mt-0.5">
                                {ctx ? ctx.sharesOwned : "—"}
                            </div>
                            {ctx && ctx.sharesOwned > 0 && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                    avg {fmtUSD(ctx.avgCostBasis)} ·{" "}
                                    <span className={unrealized >= 0 ? "text-green-400" : "text-red-400"}>
                                        {unrealized >= 0 ? "+" : ""}
                                        {fmtUSD(unrealized)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {validationError && (
                        <p className="text-red-400 text-sm">{validationError}</p>
                    )}
                </div>

                <DialogFooter className="mt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="border-gray-600 text-gray-400 hover:bg-gray-700"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                        className={`px-6 ${
                            side === "buy"
                                ? "bg-green-600 hover:bg-green-500 text-white"
                                : "bg-red-600 hover:bg-red-500 text-white"
                        }`}
                    >
                        {pending
                            ? "Executing…"
                            : side === "buy"
                              ? `Buy ${qtyValid ? qtyNum : ""} ${symbol}`.trim()
                              : `Sell ${qtyValid ? qtyNum : ""} ${symbol}`.trim()}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
