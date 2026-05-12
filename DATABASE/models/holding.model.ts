import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface HoldingItem extends Document {
    userId: string;
    symbol: string;
    company: string;
    quantity: number;
    avgCostBasis: number;
    realizedPnL: number;
    updatedAt: Date;
}

const HoldingSchema = new Schema<HoldingItem>(
    {
        userId:       { type: String, required: true, index: true },
        symbol:       { type: String, required: true, uppercase: true, trim: true },
        company:      { type: String, required: true, trim: true },
        quantity:     { type: Number, required: true, default: 0, min: 0 },
        avgCostBasis: { type: Number, required: true, default: 0, min: 0 },
        realizedPnL:  { type: Number, required: true, default: 0 },
        updatedAt:    { type: Date,   default: Date.now },
    },
    { timestamps: false }
);

HoldingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const HoldingModel: Model<HoldingItem> =
    (models?.Holding as Model<HoldingItem>) || model<HoldingItem>('Holding', HoldingSchema);
