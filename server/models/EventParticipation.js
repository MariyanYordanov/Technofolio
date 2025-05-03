import { Schema, model } from 'mongoose';

const EventParticipationSchema = new Schema({
    event: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    student: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
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
    timestamps: true // Автоматично добавя createdAt и updatedAt
});

// Индекс за уникалност на комбинацията събитие+студент
// Това предотвратява дублирани регистрации на студент за едно и също събитие
EventParticipationSchema.index({ event: 1, student: 1 }, { unique: true });

// Виртуално поле за проверка дали участието е активно
EventParticipationSchema.virtual('isActive').get(function () {
    return this.status === 'registered' || this.status === 'confirmed';
});

// Pre-save middleware за актуализиране на updatedAt при всяка промяна
EventParticipationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default model('EventParticipation', EventParticipationSchema);