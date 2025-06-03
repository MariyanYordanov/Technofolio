// server/middleware/audit.js
import AuditLog from '../models/AuditLog.js';
import { catchAsync } from '../utils/catchAsync.js';

export const auditAction = (action, entity) => {
    return catchAsync(async (req, res, next) => {
        // Запазваме оригиналния send метод
        const originalSend = res.send;

        // Модифицираме send метода
        res.send = function (data) {
            try {
                // Записваме действието в AuditLog
                const entityId = req.params.id ||
                    (typeof data === 'string' && isJsonString(data) ? JSON.parse(data).id : null);

                const log = {
                    user: req.user ? req.user.id : null,
                    action,
                    entity,
                    entityId,
                    details: req.body,
                    ip: getClientIp(req),
                    userAgent: req.headers['user-agent']
                };

                // Записваме лога без да блокираме заявката
                AuditLog.create(log).catch(err => console.error('Audit log error:', err));

            } catch (error) {
                console.error('Error creating audit log:', error);
            }

            // Извикваме оригиналния send метод
            originalSend.call(this, data);
        };

        next();
    });
};

// Помощна функция за проверка дали стрингът е валиден JSON
function isJsonString(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

// Помощна функция за получаване на IP адреса на клиента
function getClientIp(req) {
    return (
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress
    );
}