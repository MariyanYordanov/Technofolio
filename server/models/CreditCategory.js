import { Schema, model } from 'mongoose';

const CreditCategorySchema = new Schema({
    pillar: {
        type: String,
        required: true,
        enum: ['Аз и другите', 'Мислене', 'Професия']
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default model('CreditCategory', CreditCategorySchema);