"use client";

import { useEffect, useState } from "react";
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command";
import { Loader2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { searchStocks } from "@/lib/actions/finnhub.action";
import { useDebounce } from "@/hooks/useDebounce";
import WatchlistButton from "@/components/WatchlistButton";

export default function SearchCommand({
    renderAs = "button",
    label = "Add stock",
    initialStocks,
    className,
}: SearchCommandProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);

    const isSearchMode = !!searchTerm.trim();
    const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const handleSearch = async () => {
        if (!isSearchMode) return setStocks(initialStocks);
        setLoading(true);
        try {
            const results = await searchStocks(searchTerm.trim());
            setStocks(results);
        } catch {
            setStocks([]);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useDebounce(handleSearch, 300);

    useEffect(() => {
        debouncedSearch();
    }, [searchTerm]);

    const handleSelectStock = () => {
        setOpen(false);
        setSearchTerm("");
        setStocks(initialStocks);
    };

    const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
        setStocks((prev) =>
            prev.map((s) => (s.symbol === symbol ? { ...s, isInWatchlist: isAdded } : s))
        );
    };

    return (
        <>
            {renderAs === "text" ? (
                <span onClick={() => setOpen(true)} className="search-text">
                    {label}
                </span>
            ) : (
                <button onClick={() => setOpen(true)} className={className || "yellow-btn"}>
                    {label}
                </button>
            )}

            <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
                <div className="search-field">
                    <CommandInput
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        placeholder="Search by symbol or company name"
                        className="search-input"
                    />
                    {loading && <Loader2 className="search-loader" />}
                </div>

                <CommandList className="search-list">
                    {loading ? (
                        <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
                    ) : displayStocks?.length === 0 ? (
                        <div className="search-list-indicator text-sm text-gray-500 py-6 text-center">
                            {isSearchMode ? "No results found" : "No stocks found"}
                        </div>
                    ) : (
                        <div>
                            <div className="search-count">
                                {isSearchMode ? "Search results" : "Popular Stocks"}
                                {` `}({displayStocks?.length || 0})
                            </div>

                            <ul>
                                {displayStocks?.map((stock) => (
                                    <li
                                        key={stock.symbol}
                                        className="border-b border-gray-700 last:border-b-0"
                                    >
                                        <div className="flex items-center w-full px-3 py-3 hover:bg-gray-700/40 transition-colors group">
                                            <TrendingUp className="w-4 h-4 text-gray-500 shrink-0 mr-3" />

                                            <Link
                                                href={`/stocks/${stock.symbol}`}
                                                onClick={handleSelectStock}
                                                className="flex-1 min-w-0"
                                            >
                                                <div className="search-item-name">{stock.name}</div>
                                                <div className="text-sm text-gray-500 mt-0.5">
                                                    {stock.symbol} • {stock.exchange} • {stock.type}
                                                </div>
                                            </Link>

                                            <WatchlistButton
                                                symbol={stock.symbol}
                                                company={stock.name}
                                                isInWatchlist={stock.isInWatchlist}
                                                type="icon"
                                                onWatchlistChange={handleWatchlistChange}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
