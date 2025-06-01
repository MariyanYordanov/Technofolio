// server/models/Achievement.js - Updated to reference User
import { Schema, model } from 'mongoose';

const AchievementSchema = new Schema({
    user: {
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
        required: true,
        maxlength: 200
    },
    description: {
        type: String,
        maxlength: 1000
    },
    date: {
        type: Date,
        required: true
    },
    place: {
        type: String,
        maxlength: 100
    },
    issuer: {
        type: String,
        maxlength: 200
    }
}, {
    timestamps: true
});

// Индекси за по-бързо търсене
AchievementSchema.index({ user: 1, date: -1 });
AchievementSchema.index({ category: 1 });

// Виртуално поле за година
AchievementSchema.virtual('year').get(function () {
    return this.date.getFullYear();
});

export default model('Achievement', AchievementSchema);
