import { Schema, model } from 'mongoose';

const GoalSchema = new Schema({
    student: {
        type: Schema.Types.ObjectId,
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
        type: [String],  // Променено от String на масив от String
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

// Добавен уникален индекс за student+category
GoalSchema.index({ student: 1, category: 1 }, { unique: true });

export default model('Goals', GoalSchema);  // Променено от 'Goal' на 'Goals'