// server/routes/notificationsRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    createBulkNotification
} from '../controllers/notificationsController.js';
import authMiddleware from '../middleware/auth.js';
import { restrictTo } from '../middleware/auth.js';

const router = Router();

// Защита на всички маршрути
router.use(authMiddleware);

// Маршрути достъпни за всички аутентикирани потребители
router.get('/', getUserNotifications);
router.patch('/:notificationId/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:notificationId', deleteNotification);

// Маршрути само за администратори и учители
router.use(restrictTo('admin', 'teacher'));

router.post(
    '/',
    [
        body('recipientId').notEmpty().withMessage('ID на получателя е задължително'),
        body('title').notEmpty().withMessage('Заглавието е задължително'),
        body('message').notEmpty().withMessage('Съобщението е задължително'),
        body('type').isIn(['info', 'success', 'warning', 'error']).withMessage('Невалиден тип'),
        body('category').isIn(['event', 'credit', 'absence', 'sanction', 'system']).withMessage('Невалидна категория')
    ],
    createNotification
);

router.post(
    '/bulk',
    [
        body('title').notEmpty().withMessage('Заглавието е задължително'),
        body('message').notEmpty().withMessage('Съобщението е задължително'),
        body('type').isIn(['info', 'success', 'warning', 'error']).withMessage('Невалиден тип'),
        body('category').isIn(['event', 'credit', 'absence', 'sanction', 'system']).withMessage('Невалидна категория'),
        body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Невалидна роля'),
        body('grade').optional().isIn(['8', '9', '10', '11', '12']).withMessage('Невалиден клас')
    ],
    createBulkNotification
);

export default router;