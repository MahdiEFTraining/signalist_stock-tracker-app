import { getWatchlistForUser } from "@/lib/actions/watchlist.actions";
import { getUserAlerts } from "@/lib/actions/alert.actions";
import { searchStocks, getCompanyLogos } from "@/lib/actions/finnhub.action";
import SearchCommand from "@/components/SearchCommand";
import AlertModal from "@/components/AlertModal";
import AlertsList from "@/components/AlertsList";
import WatchlistButton from "@/components/WatchlistButton";
import { StockLogo } from "@/components/StockLogo";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Star } from "lucide-react";
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants";

export default async function WatchlistPage() {
    const [watchlistItems, userAlerts, popularStocks] = await Promise.all([
        getWatchlistForUser(),
        getUserAlerts(),
        searchStocks(),
    ]);

    const watchlistSymbols = watchlistItems.map((i) => i.symbol);
    const logoMap = watchlistSymbols.length > 0
        ? await getCompanyLogos(watchlistSymbols)
        : {};

    const watchlistStocks = watchlistItems.map((item) => {
        const found = popularStocks.find((s) => s.symbol === item.symbol);
        return {
            symbol: item.symbol,
            name: found?.name ?? item.company,
            exchange: found?.exchange ?? "",
            type: found?.type ?? "",
        };
    });

    const initialStocks: StockWithWatchlistStatus[] = popularStocks.map((s) => ({
        ...s,
        isInWatchlist: watchlistSymbols.includes(s.symbol),
    }));

    const isEmpty = watchlistStocks.length === 0;

    return (
        <main className="container py-8 md:py-10">
            {isEmpty ? (
                <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <h1 className="watchlist-title">Watchlist</h1>
                        <SearchCommand renderAs="button" label="+ Add Stock" initialStocks={initialStocks} />
                    </div>
                    <div className="watchlist-empty-container flex">
                        <div className="watchlist-empty">
                            <Star className="watchlist-star" />
                            <h2 className="empty-title">Your watchlist is empty</h2>
                            <p className="empty-description">
                                Search for stocks and click the star icon to add them to your watchlist.
                                You&#39;ll receive personalized news summaries based on the stocks you follow.
                            </p>
                            <SearchCommand renderAs="button" label="Search Stocks" initialStocks={initialStocks} />
                        </div>
                    </div>
                </>
            ) : (
                <div
                    className="flex flex-col gap-5 lg:grid lg:gap-5"
                    style={{ gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 0.8fr)" }}
                >
                    <div className="min-w-0">
                        <div className="flex items-center justify-between mb-3">
                            <span className="watchlist-title">Watchlist</span>
                            <SearchCommand
                                renderAs="button"
                                label="Add Stock"
                                initialStocks={initialStocks}
                                className="yellow-btn-sm"
                            />
                        </div>

                        <Table className="watchlist-table">
                            <TableHeader>
                                <TableRow className="table-header-row">
                                    {WATCHLIST_TABLE_HEADER.map((header) => (
                                        <TableHead key={header}>{header}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {watchlistStocks.map((stock) => (
                                    <TableRow key={stock.symbol} className="table-row">
                                        <TableCell className="table-cell">
                                            <div className="flex items-center gap-3">
                                                <StockLogo
                                                    symbol={stock.symbol}
                                                    logo={logoMap[stock.symbol]}
                                                    size={30}
                                                />
                                                <Link
                                                    href={`/stocks/${stock.symbol}`}
                                                    className="text-gray-200 hover:text-yellow-400 truncate transition-colors"
                                                >
                                                    {stock.name}
                                                </Link>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-400">{stock.symbol}</TableCell>
                                        <TableCell className="text-white">—</TableCell>
                                        <TableCell className="text-gray-500">—</TableCell>
                                        <TableCell className="text-gray-200">—</TableCell>
                                        <TableCell className="text-gray-200">—</TableCell>
                                        <TableCell>
                                            <AlertModal symbol={stock.symbol} company={stock.name} />
                                        </TableCell>
                                        <TableCell>
                                            <WatchlistButton
                                                symbol={stock.symbol}
                                                company={stock.name}
                                                isInWatchlist
                                                type="icon"
                                                showTrashIcon
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-medium text-white">Alerts</span>
                            {userAlerts.length > 0 && (
                                <span className="text-sm text-gray-500">
                                    {userAlerts.length} active
                                </span>
                            )}
                        </div>

                        <AlertsList alertData={userAlerts} logos={logoMap} />
                    </div>
                </div>
            )}
        </main>
    );
}
