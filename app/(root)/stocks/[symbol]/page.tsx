import TradingViewWidget from "@/components/TradingViewWidget";
import {
    SYMBOL_INFO_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    BASELINE_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import WatchlistButton from "@/components/WatchlistButton";
import TradeStockButton from "@/components/TradeStockButton";
import StockChatPanel from "@/components/StockChatPanel";
import SentimentTimelineChart from "@/components/SentimentTimelineChart";
import { getWatchlistSymbols } from "@/lib/actions/watchlist.actions";
import { searchStocks } from "@/lib/actions/finnhub.action";
import { getSentimentTimeline, getSentimentSummary } from "@/lib/actions/sentiment.actions";

export default async function StockDetails({ params }: StockDetailsPageProps) {
    const { symbol } = await params;
    const upper = symbol.toUpperCase();
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    const SENTIMENT_DAYS = 30;
    const [watchlistSymbols, searchResults, sentimentTimeline, sentimentSummary] = await Promise.all([
        getWatchlistSymbols(),
        searchStocks(symbol),
        getSentimentTimeline(upper, SENTIMENT_DAYS),
        getSentimentSummary(upper, 7),
    ]);

    const isInWatchlist = watchlistSymbols.includes(upper);
    const companyName = searchResults.find(s => s.symbol === upper)?.name ?? upper;

    return (
        <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Left column */}
                <div className="flex flex-col gap-6">
                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}symbol-info.js`}
                        config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
                        height={170}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}advanced-chart.js`}
                        config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
                        className="custom-chart"
                        height={600}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}advanced-chart.js`}
                        config={BASELINE_WIDGET_CONFIG(symbol)}
                        className="custom-chart"
                        height={600}
                    />

                    <SentimentTimelineChart
                        symbol={upper}
                        timeline={sentimentTimeline}
                        summary={sentimentSummary}
                        days={SENTIMENT_DAYS}
                    />
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-3">
                        <WatchlistButton
                            symbol={upper}
                            company={companyName}
                            isInWatchlist={isInWatchlist}
                        />
                        <TradeStockButton
                            symbol={upper}
                            company={companyName}
                        />
                    </div>

                    <StockChatPanel symbol={upper} company={companyName} />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}technical-analysis.js`}
                        config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
                        height={400}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}company-profile.js`}
                        config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
                        height={440}
                    />

                    <TradingViewWidget
                        scriptUrl={`${scriptUrl}financials.js`}
                        config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
                        height={464}
                    />
                </div>
            </section>
        </div>
    );
}