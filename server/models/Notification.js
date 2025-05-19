// server/models/Notification.js
import { Schema, model } from 'mongoose';

const NotificationSchema = new Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info'
    },
    category: {
        type: String,
        enum: ['event', 'credit', 'absence', 'sanction', 'system'],
        required: true
    },
    relatedTo: {
        model: {
            type: String,
            enum: ['Event', 'Credit', 'Sanction', 'User'],
            required: false
        },
        id: {
            type: Schema.Types.ObjectId,
            required: false
        }
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isEmailSent: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 30 // Автоматично изтичане след 30 дни
    }
});

// Индекси за подобряване на ефективността на заявките
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ createdAt: 1 });
NotificationSchema.index({ category: 1 });

export default model('Notification', NotificationSchema);