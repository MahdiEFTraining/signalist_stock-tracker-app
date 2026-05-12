import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
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

const fmtDate = (d: Date) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
    if (transactions.length === 0) {
        return (
            <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-8 text-center text-gray-500 text-sm">
                No trades yet — your transaction history will appear here.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800/40 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-gray-700">
                        <TableHead className="text-gray-400 px-4">Date</TableHead>
                        <TableHead className="text-gray-400">Side</TableHead>
                        <TableHead className="text-gray-400">Symbol</TableHead>
                        <TableHead className="text-gray-400 text-right">Qty</TableHead>
                        <TableHead className="text-gray-400 text-right">Price</TableHead>
                        <TableHead className="text-gray-400 text-right pr-4">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((t) => {
                        const isBuy = t.side === "buy";
                        return (
                            <TableRow key={t.id} className="border-gray-700 hover:bg-gray-800/60">
                                <TableCell className="px-4 text-gray-400 text-sm">
                                    {fmtDate(t.executedAt)}
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                                            isBuy
                                                ? "bg-green-600/15 text-green-400 border border-green-500/30"
                                                : "bg-red-600/15 text-red-400 border border-red-500/30"
                                        }`}
                                    >
                                        {isBuy ? (
                                            <ArrowUpCircle className="w-3 h-3" />
                                        ) : (
                                            <ArrowDownCircle className="w-3 h-3" />
                                        )}
                                        {isBuy ? "Buy" : "Sell"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Link href={`/stocks/${t.symbol}`} className="flex flex-col">
                                        <span className="text-gray-100 font-medium">{t.symbol}</span>
                                        <span className="text-xs text-gray-500 truncate max-w-[180px]">
                                            {t.company}
                                        </span>
                                    </Link>
                                </TableCell>
                                <TableCell className="text-right text-gray-200">{t.quantity}</TableCell>
                                <TableCell className="text-right text-gray-300">
                                    {fmtUSD(t.price)}
                                </TableCell>
                                <TableCell className="text-right text-gray-100 font-medium pr-4">
                                    {fmtUSD(t.totalValue)}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
