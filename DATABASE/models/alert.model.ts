import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface AlertItem extends Document {
    userId: string;
    symbol: string;
    company: string;
    alertName: string;
    alertCategory: 'price' | 'sentiment';
    alertType: 'upper' | 'lower';
    threshold: number;
    createdAt: Date;
}

const AlertSchema = new Schema<AlertItem>(
    {
        userId:        { type: String, required: true, index: true },
        symbol:        { type: String, required: true, uppercase: true, trim: true },
        company:       { type: String, required: true, trim: true },
        alertName:     { type: String, required: true, trim: true },
        alertCategory: { type: String, required: true, enum: ['price', 'sentiment'], default: 'price' },
        alertType:     { type: String, required: true, enum: ['upper', 'lower'] },
        threshold:     { type: Number, required: true },
        createdAt:     { type: Date,   default: Date.now },
    },
    { timestamps: false }
);

AlertSchema.index({ userId: 1, symbol: 1 });

export const AlertModel: Model<AlertItem> =
    (models?.Alert as Model<AlertItem>) || model<AlertItem>('Alert', AlertSchema);