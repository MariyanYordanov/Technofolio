
// ===================================================================
// server/models/EventParticipation.js - Updated to reference User
import { Schema, model } from 'mongoose';

const EventParticipationSchema = new Schema({
    event: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user: {
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
        type: String,
        maxlength: 1000
    },
    feedbackDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Индекс за уникалност на комбинацията събитие+потребител
EventParticipationSchema.index({ event: 1, user: 1 }, { unique: true });
EventParticipationSchema.index({ user: 1, status: 1 });
EventParticipationSchema.index({ event: 1, status: 1 });

// Виртуално поле за проверка дали участието е активно
EventParticipationSchema.virtual('isActive').get(function () {
    return this.status === 'registered' || this.status === 'confirmed';
});

// Pre-save middleware за актуализиране на дати
EventParticipationSchema.pre('save', function (next) {
    if (this.isModified('status')) {
        switch (this.status) {
            case 'confirmed':
                this.confirmedAt = new Date();
                break;
            case 'attended':
                this.attendedAt = new Date();
                break;
        }
    }
    next();
});

export default model('EventParticipation', EventParticipationSchema);
