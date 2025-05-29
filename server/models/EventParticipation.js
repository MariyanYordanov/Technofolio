// server/models/EventParticipation.js - Updated
import { Schema, model } from 'mongoose';

const EventParticipationSchema = new Schema({
    event: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user: {  // Променено от 'student' на 'user'
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['registered', 'confirmed', 'attended', 'cancelled'],
        default: 'registered'
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    confirmedAt: {
        type: Date
    },
    attendedAt: {
        type: Date
    },
    feedback: {
        type: String
    },
    feedbackDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Индекс за уникалност на комбинацията събитие+потребител
EventParticipationSchema.index({ event: 1, user: 1 }, { unique: true });

// Виртуално поле за проверка дали участието е активно
EventParticipationSchema.virtual('isActive').get(function () {
    return this.status === 'registered' || this.status === 'confirmed';
});

export default model('EventParticipation', EventParticipationSchema);