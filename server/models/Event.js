
// ===================================================================
// server/models/Event.js - Остава непроменен
import { Schema, model } from 'mongoose';

const EventSchema = new Schema({
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    location: {
        type: String,
        required: true,
        maxlength: 200
    },
    organizer: {
        type: String,
        required: true,
        maxlength: 200
    },
    feedbackUrl: {
        type: String,
        maxlength: 500
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Индекси
EventSchema.index({ startDate: 1 });
EventSchema.index({ createdBy: 1 });

// Виртуално поле за проверка дали събитието е минало
EventSchema.virtual('isPast').get(function () {
    return this.startDate < new Date();
});

// Виртуално поле за проверка дали събитието е активно
EventSchema.virtual('isActive').get(function () {
    const now = new Date();
    return this.startDate <= now && (!this.endDate || this.endDate >= now);
});

export default model('Event', EventSchema);
