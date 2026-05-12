import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface TransactionItem extends Document {
    userId: string;
    symbol: string;
    company: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    totalValue: number;
    executedAt: Date;
}

const TransactionSchema = new Schema<TransactionItem>(
    {
        userId:     { type: String, required: true, index: true },
        symbol:     { type: String, required: true, uppercase: true, trim: true },
        company:    { type: String, required: true, trim: true },
        side:       { type: String, required: true, enum: ['buy', 'sell'] },
        quantity:   { type: Number, required: true, min: 0 },
        price:      { type: Number, required: true, min: 0 },
        totalValue: { type: Number, required: true, min: 0 },
        executedAt: { type: Date,   default: Date.now },
    },
    { timestamps: false }
);

TransactionSchema.index({ userId: 1, executedAt: -1 });

export const TransactionModel: Model<TransactionItem> =
    (models?.Transaction as Model<TransactionItem>) || model<TransactionItem>('Transaction', TransactionSchema);
