const mongoose = require('mongoose');

const CreditSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
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
        type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('Credit', CreditSchema);