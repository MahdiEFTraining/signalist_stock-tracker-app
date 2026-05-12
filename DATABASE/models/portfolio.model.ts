import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface PortfolioItem extends Document {
    userId: string;
    cashBalance: number;
    initialCash: number;
    currency: string;
    createdAt: Date;
}

const PortfolioSchema = new Schema<PortfolioItem>(
    {
        userId:      { type: String, required: true, unique: true, index: true },
        cashBalance: { type: Number, required: true, default: 100000 },
        initialCash: { type: Number, required: true, default: 100000 },
        currency:    { type: String, required: true, default: 'USD', trim: true },
        createdAt:   { type: Date,   default: Date.now },
    },
    { timestamps: false }
);

export const PortfolioModel: Model<PortfolioItem> =
    (models?.Portfolio as Model<PortfolioItem>) || model<PortfolioItem>('Portfolio', PortfolioSchema);
