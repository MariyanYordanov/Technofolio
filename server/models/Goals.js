// server/models/Goals.js - Updated
import { Schema, model } from 'mongoose';

const GoalSchema = new Schema({
    user: {  // Променено от 'student' на 'user'
        type: Schema.Types.ObjectId,
        ref: 'User',
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
        type: [String],
        default: []
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

// Обновен уникален индекс
GoalSchema.index({ user: 1, category: 1 }, { unique: true });

export default model('Goals', GoalSchema);