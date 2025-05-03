import { Schema, model } from 'mongoose';

const PortfolioSchema = new Schema({
    student: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
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

export default model('Portfolio', PortfolioSchema);