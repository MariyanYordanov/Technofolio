// server/models/Credit.js - Updated
import { Schema, model } from 'mongoose';

const CreditSchema = new Schema({
    user: {  // Променено от 'student' на 'user'
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pillar: {
        type: String,
        required: true,
        enum: ['Аз и другите', 'Мислене', 'Професия']
    },
    activity: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'validated', 'rejected'],
        default: 'pending'
    },
    validatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    validationDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Индекс за по-бързо търсене
CreditSchema.index({ user: 1, status: 1 });
CreditSchema.index({ pillar: 1, status: 1 });

export default model('Credit', CreditSchema);