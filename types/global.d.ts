import { Control, FieldError, UseFormRegister, RegisterOptions, FieldValues, Path } from "react-hook-form";

declare global {
    type SignInFormData = {
        email: string;
        password: string;
    };

    type ForgotPasswordFormData = {
        email: string;
    };

    type ResetPasswordFormData = {
        password: string;
        confirmPassword: string;
    };

    type SignUpFormData = {
        fullName: string;
        email: string;
        password: string;
        country: string;
        investmentGoals: string;
        riskTolerance: string;
        preferredIndustry: string;
    };

    type CountrySelectProps<T extends FieldValues> = {
        name: Path<T>;
        label: string;
        control: Control<T>;
        error?: FieldError;
        required?: boolean;
    };

    type FormInputProps<T extends FieldValues> = {
        name: Path<T>;
        label: string;
        placeholder: string;
        type?: string;
        register: UseFormRegister<T>;
        error?: FieldError;
        validation?: RegisterOptions<T>;
        disabled?: boolean;
        value?: string;
    };

    type Option = {
        value: string;
        label: string;
    };

    type SelectFieldProps<T extends FieldValues> = {
        name: Path<T>;
        label: string;
        placeholder: string;
        options: readonly Option[];
        control: Control<T>;
        error?: FieldError;
        required?: boolean;
    };

    type FooterLinkProps = {
        text: string;
        linkText: string;
        href: string;
    };

    type WelcomeEmailData = {
        email: string;
        name: string;
        intro: string;
    };

    type User = {
        id: string;
        name: string;
        email: string;
    };

    type Stock = {
        symbol: string;
        name: string;
        exchange: string;
        type: string;
    };

    type StockWithWatchlistStatus = Stock & {
        isInWatchlist: boolean;
    };

    type FinnhubSearchResult = {
        symbol: string;
        description: string;
        displaySymbol?: string;
        type: string;
    };

    type FinnhubSearchResponse = {
        count: number;
        result: FinnhubSearchResult[];
    };

    type StockDetailsPageProps = {
        params: Promise<{
            symbol: string;
        }>;
    };

    type WatchlistButtonProps = {
        symbol: string;
        company: string;
        isInWatchlist: boolean;
        showTrashIcon?: boolean;
        type?: 'button' | 'icon';
        onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
    };

    type QuoteData = {
        c?: number;
        d?: number;
        dp?: number;
        pc?: number;
    };

    type ProfileData = {
        name?: string;
        marketCapitalization?: number;
    };

    type FinancialsData = {
        metric?: { [key: string]: number };
    };

    type SelectedStock = {
        symbol: string;
        company: string;
        currentPrice?: number;
    };

    type WatchlistTableProps = {
        watchlist: StockWithData[];
    };

    type StockWithData = {
        userId: string;
        symbol: string;
        company: string;
        addedAt: Date;
        currentPrice?: number;
        changePercent?: number;
        priceFormatted?: string;
        changeFormatted?: string;
        marketCap?: string;
        peRatio?: string;
    };

    type AlertsListProps = {
        alertData: Alert[] | undefined;
        logos?: Record<string, string>;
    };

    type MarketNewsArticle = {
        id: number;
        headline: string;
        summary: string;
        source: string;
        url: string;
        datetime: number;
        category: string;
        related: string;
        image?: string;
    };

    type WatchlistNewsProps = {
        news?: MarketNewsArticle[];
    };

    type SearchCommandProps = {
        open?: boolean;
        setOpen?: (open: boolean) => void;
        renderAs?: 'button' | 'text';
        buttonLabel?: string;
        buttonVariant?: 'primary' | 'secondary';
        className?: string;
        initialStocks: StockWithWatchlistStatus[];
        label?: string;
    };

    type AlertCategory = 'price' | 'sentiment';

    type AlertData = {
        symbol: string;
        company: string;
        alertName: string;
        alertCategory: AlertCategory;
        alertType: 'upper' | 'lower';
        threshold: string;
    };

    type AlertModalProps = {
        alertId?: string;
        alertData?: AlertData;
        action?: string;
        open: boolean;
        setOpen: (open: boolean) => void;
    };

    type RawNewsArticle = {
        id: number;
        headline?: string;
        summary?: string;
        source?: string;
        url?: string;
        datetime?: number;
        image?: string;
        category?: string;
        related?: string;
    };

    type Alert = {
        id: string;
        symbol: string;
        company: string;
        alertName: string;
        currentPrice: number;
        alertCategory: AlertCategory;
        alertType: 'upper' | 'lower';
        threshold: number;
        changePercent?: number;
    };

    type UserForNewsEmail = {
        id: string;
        email: string;
        name: string;
    };

    type WatchlistStock = {
        symbol: string;
        company: string;
        addedAt: Date;
    };

    type Portfolio = {
        userId: string;
        cashBalance: number;
        initialCash: number;
        currency: string;
        createdAt: Date;
    };

    type Transaction = {
        id: string;
        symbol: string;
        company: string;
        side: 'buy' | 'sell';
        quantity: number;
        price: number;
        totalValue: number;
        executedAt: Date;
    };

    type Holding = {
        symbol: string;
        company: string;
        quantity: number;
        avgCostBasis: number;
        realizedPnL: number;
        updatedAt: Date;
    };

    type HoldingWithLivePrice = Holding & {
        currentPrice: number;
        marketValue: number;
        unrealizedPnL: number;
        unrealizedPnLPercent: number;
        sector?: string;
    };

    type PortfolioSnapshot = {
        date: string;
        totalValue: number;
        cashBalance: number;
        holdingsValue: number;
    };

    type PortfolioSummary = {
        totalValue: number;
        cashBalance: number;
        holdingsValue: number;
        initialCash: number;
        totalReturn: number;
        totalReturnPercent: number;
        todayPnL: number;
        todayPnLPercent: number;
    };

    type SectorAllocation = {
        sector: string;
        value: number;
        percent: number;
    };

    type LeaderboardEntry = {
        rank: number;
        userName: string;
        totalValue: number;
        totalReturn: number;
        totalReturnPercent: number;
        isCurrentUser?: boolean;
    };

    type TradeData = {
        symbol: string;
        company: string;
        side: 'buy' | 'sell';
        quantity: number;
    };

    type TradeResult = {
        success: boolean;
        error?: string;
        executedPrice?: number;
        totalValue?: number;
    };

    type TradeModalProps = {
        symbol: string;
        company: string;
        open: boolean;
        setOpen: (open: boolean) => void;
        maxSellQuantity?: number;
        defaultSide?: 'buy' | 'sell';
    };

    type ChatMessage = {
        role: 'user' | 'model';
        text: string;
    };

    type AskStockQuestionResult = {
        success: boolean;
        answer?: string;
        error?: string;
    };

    type SentimentLabel = 'negative' | 'neutral' | 'positive';

    type NewsSentiment = {
        symbol: string;
        articleId: number;
        headline: string;
        summary?: string;
        source: string;
        url: string;
        articleDatetime: Date;
        sentiment: number;
        sentimentLabel: SentimentLabel;
        confidence?: number;
        processedAt: Date;
    };

    type SentimentTimelinePoint = {
        date: string;
        avgSentiment: number;
        articleCount: number;
        positiveCount: number;
        neutralCount: number;
        negativeCount: number;
    };

    type SentimentSummary = {
        symbol: string;
        avgSentiment: number;
        articleCount: number;
        windowDays: number;
        label: SentimentLabel;
    };
}