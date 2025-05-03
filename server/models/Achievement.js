import { Schema, model } from 'mongoose';

const AchievementSchema = new Schema({
    student: {
        type: Schema.Types.ObjectId,
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

export default model('Achievement', AchievementSchema);