// server/models/AuditLog.js
import { Schema, model } from 'mongoose';

const AuditLogSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    action: {
        type: String,
        required: true,
        enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'register', 'password_change', 'password_reset']
    },
    entity: {
        type: String,
        required: true
    },
    entityId: Schema.Types.ObjectId,
    details: Schema.Types.Mixed,
    ip: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Индекси за по-бързо търсене
AuditLogSchema.index({ user: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ entity: 1 });
AuditLogSchema.index({ timestamp: -1 });

export default model('AuditLog', AuditLogSchema);