
// ===================================================================
// server/models/Notification.js - Остава непроменен
import { Schema, model } from 'mongoose';

const NotificationSchema = new Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
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
            enum: ['Event', 'Credit', 'Achievement', 'User'],
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
    }
}, {
    timestamps: true,
    expireAfterSeconds: 2592000 // 30 дни
});

// Индекси за подобряване на ефективността на заявките
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ category: 1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // TTL индекс

export default model('Notification', NotificationSchema);
