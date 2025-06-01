
// ===================================================================
// server/models/CreditCategory.js - Остава непроменен
import { Schema, model } from 'mongoose';

const CreditCategorySchema = new Schema({
    pillar: {
        type: String,
        required: true,
        enum: ['Аз и другите', 'Мислене', 'Професия']
    },
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Уникален индекс за име в рамките на стълб
CreditCategorySchema.index({ pillar: 1, name: 1 }, { unique: true });

export default model('CreditCategory', CreditCategorySchema);
