import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface NewsSentimentItem extends Document {
    symbol: string;
    articleId: number;
    headline: string;
    summary?: string;
    source: string;
    url: string;
    articleDatetime: Date;
    sentiment: number;
    sentimentLabel: 'negative' | 'neutral' | 'positive';
    confidence?: number;
    processedAt: Date;
}

const NewsSentimentSchema = new Schema<NewsSentimentItem>(
    {
        symbol:          { type: String, required: true, uppercase: true, trim: true },
        articleId:       { type: Number, required: true },
        headline:        { type: String, required: true, trim: true },
        summary:         { type: String, trim: true },
        source:          { type: String, required: true, trim: true },
        url:             { type: String, required: true, trim: true },
        articleDatetime: { type: Date,   required: true },
        sentiment:       { type: Number, required: true, min: -1, max: 1 },
        sentimentLabel:  { type: String, required: true, enum: ['negative', 'neutral', 'positive'] },
        confidence:      { type: Number, min: 0, max: 1 },
        processedAt:     { type: Date,   default: Date.now },
    },
    { timestamps: false }
);

// Idempotency: re-running the cron on the same article won't duplicate
NewsSentimentSchema.index({ symbol: 1, articleId: 1 }, { unique: true });
// Timeline queries: most recent articles per symbol
NewsSentimentSchema.index({ symbol: 1, articleDatetime: -1 });

export const NewsSentimentModel: Model<NewsSentimentItem> =
    (models?.NewsSentiment as Model<NewsSentimentItem>) ||
    model<NewsSentimentItem>('NewsSentiment', NewsSentimentSchema);
