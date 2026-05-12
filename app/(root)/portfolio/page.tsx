import Link from "next/link";
import {
    getPortfolioPageData,
    getTransactionHistory,
    getEquityCurve,
    getOrCreatePortfolio,
} from "@/lib/actions/portfolio.actions";
import PortfolioSummaryCards from "@/components/PortfolioSummaryCards";
import HoldingsTable from "@/components/HoldingsTable";
import TransactionsTable from "@/components/TransactionsTable";
import EquityCurveChart from "@/components/EquityCurveChart";
import SectorAllocationChart from "@/components/SectorAllocationChart";

export default async function PortfolioPage() {
    const [data, transactions, snapshots, portfolio] = await Promise.all([
        getPortfolioPageData(),
        getTransactionHistory(25),
        getEquityCurve(30),
        getOrCreatePortfolio(),
    ]);

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <p>Could not load your portfolio.</p>
                <Link href="/sign-in" className="mt-4 underline text-yellow-400">
                    Sign in
                </Link>
            </div>
        );
    }

    const { summary, holdings, sectors } = data;

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:p-8">
            <header className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-100">
                    Portfolio
                </h1>
                <p className="text-sm text-gray-500">
                    Paper-trading account · starting balance{" "}
                    {summary.initialCash.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                    })}
                </p>
            </header>

            <PortfolioSummaryCards summary={summary} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 min-w-0">
                    {portfolio && (
                        <EquityCurveChart
                            snapshots={snapshots}
                            liveTotalValue={summary.totalValue}
                            initialCash={summary.initialCash}
                            portfolioCreatedAt={portfolio.createdAt}
                        />
                    )}
                </div>
                <div className="lg:col-span-1 min-w-0">
                    <SectorAllocationChart sectors={sectors} />
                </div>
            </div>

            <section className="flex flex-col gap-3">
                <h2 className="text-lg font-medium text-gray-200">Holdings</h2>
                <HoldingsTable holdings={holdings} />
            </section>

            <section className="flex flex-col gap-3">
                <h2 className="text-lg font-medium text-gray-200">Recent Transactions</h2>
                <TransactionsTable transactions={transactions} />
            </section>
        </div>
    );
}
