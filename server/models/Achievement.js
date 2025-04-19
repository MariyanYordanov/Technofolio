const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['competition', 'olympiad', 'tournament', 'certificate', 'award', 'other']
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        required: true
    },
    place: {
        type: String
    },
    issuer: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Achievement', AchievementSchema);