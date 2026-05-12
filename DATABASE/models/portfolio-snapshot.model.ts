import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface PortfolioSnapshotItem extends Document {
    userId: string;
    date: string;
    totalValue: number;
    cashBalance: number;
    holdingsValue: number;
    createdAt: Date;
}

const PortfolioSnapshotSchema = new Schema<PortfolioSnapshotItem>(
    {
        userId:        { type: String, required: true, index: true },
        date:          { type: String, required: true, trim: true },
        totalValue:    { type: Number, required: true },
        cashBalance:   { type: Number, required: true },
        holdingsValue: { type: Number, required: true },
        createdAt:     { type: Date,   default: Date.now },
    },
    { timestamps: false }
);

PortfolioSnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });
PortfolioSnapshotSchema.index({ userId: 1, date: -1 });

export const PortfolioSnapshotModel: Model<PortfolioSnapshotItem> =
    (models?.PortfolioSnapshot as Model<PortfolioSnapshotItem>) || model<PortfolioSnapshotItem>('PortfolioSnapshot', PortfolioSnapshotSchema);
