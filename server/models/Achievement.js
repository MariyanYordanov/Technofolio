// server/models/Achievement.js - Updated
import { Schema, model } from 'mongoose';

const AchievementSchema = new Schema({
    user: {  // Променено от 'student' на 'user'
        type: Schema.Types.ObjectId,
        ref: 'User',
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

// Индекс за по-бързо търсене
AchievementSchema.index({ user: 1, date: -1 });

export default model('Achievement', AchievementSchema);