// server/models/Portfolio.js - Updated
import { Schema, model } from 'mongoose';

const PortfolioSchema = new Schema({
    user: {  // Променено от 'student' на 'user'
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    experience: {
        type: String,
        default: ''
    },
    projects: {
        type: String,
        default: ''
    },
    mentorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    recommendations: [
        {
            text: {
                type: String,
                required: true
            },
            author: {
                type: String,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Индекс за уникалност
PortfolioSchema.index({ user: 1 }, { unique: true });

export default model('Portfolio', PortfolioSchema);