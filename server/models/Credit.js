
// ===================================================================
// server/models/Credit.js - Updated to reference User
import { Schema, model } from 'mongoose';

const CreditSchema = new Schema({
    user: {
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
        required: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
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
    validationNote: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Индекси за по-бързо търсене
CreditSchema.index({ user: 1, status: 1 });
CreditSchema.index({ pillar: 1, status: 1 });
CreditSchema.index({ status: 1, createdAt: -1 });

// Виртуално поле за проверка дали е в процес на валидиране
CreditSchema.virtual('isPending').get(function () {
    return this.status === 'pending';
});

export default model('Credit', CreditSchema);
