import { Trophy, Medal, Award } from "lucide-react";
import { getLeaderboard } from "@/lib/actions/portfolio.actions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const fmtUSD = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
const fmtSigned = (n: number) => `${n >= 0 ? "+" : ""}${fmtUSD(n)}`;

function RankBadge({ rank }: { rank: number }) {
    if (rank === 1)
        return (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-400/40 text-yellow-300">
                <Trophy className="w-4 h-4" />
            </span>
        );
    if (rank === 2)
        return (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-400/20 border border-gray-300/40 text-gray-200">
                <Medal className="w-4 h-4" />
            </span>
        );
    if (rank === 3)
        return (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300">
                <Award className="w-4 h-4" />
            </span>
        );
    return (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-sm">
            {rank}
        </span>
    );
}

export default async function LeaderboardPage() {
    const entries = await getLeaderboard(20);

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
            <header className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-100">
                    Leaderboard
                </h1>
                <p className="text-sm text-gray-500">
                    Top players ranked by all-time return on a $100,000 paper portfolio.
                </p>
            </header>

            {entries.length === 0 ? (
                <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-10 text-center text-gray-500">
                    No portfolios yet — be the first to trade!
                </div>
            ) : (
                <div className="rounded-xl border border-gray-700 bg-gray-800/40 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-gray-700">
                                <TableHead className="text-gray-400 px-4 w-20">Rank</TableHead>
                                <TableHead className="text-gray-400">Player</TableHead>
                                <TableHead className="text-gray-400 text-right">Total Value</TableHead>
                                <TableHead className="text-gray-400 text-right">Return</TableHead>
                                <TableHead className="text-gray-400 text-right pr-4">Return %</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((e) => {
                                const positive = e.totalReturn >= 0;
                                return (
                                    <TableRow
                                        key={`${e.rank}-${e.userName}`}
                                        className={`border-gray-700 hover:bg-gray-800/60 ${
                                            e.isCurrentUser ? "bg-yellow-500/5" : ""
                                        }`}
                                    >
                                        <TableCell className="px-4">
                                            <RankBadge rank={e.rank} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-100 font-medium">
                                                    {e.userName}
                                                </span>
                                                {e.isCurrentUser && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-gray-100 font-medium">
                                            {fmtUSD(e.totalValue)}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right font-medium ${
                                                positive ? "text-green-400" : "text-red-400"
                                            }`}
                                        >
                                            {fmtSigned(e.totalReturn)}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right font-semibold pr-4 ${
                                                positive ? "text-green-400" : "text-red-400"
                                            }`}
                                        >
                                            {fmtPct(e.totalReturnPercent)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
