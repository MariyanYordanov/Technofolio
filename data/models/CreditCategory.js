const mongoose = require('mongoose');

const CreditCategorySchema = new mongoose.Schema({
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

module.exports = mongoose.model('CreditCategory', CreditCategorySchema);