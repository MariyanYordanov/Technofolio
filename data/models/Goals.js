const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['personalDevelopment', 'academicDevelopment', 'profession', 'extracurricular', 'community', 'internship']
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    activities: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Goal', GoalSchema);