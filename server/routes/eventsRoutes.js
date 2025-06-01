// server/routes/eventsRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    participateInEvent,
    confirmParticipation,
    getStudentParticipations,
    markAttendance,
    provideFeedback,
    cancelParticipation,
    getEventsStatistics
} from '../controllers/eventsController.js';
import authMiddleware from '../middleware/auth.js';
import { restrictTo } from '../middleware/auth.js';

const router = Router();

// Публични маршрути (не изискват автентикация)
router.get('/', getAllEvents);
router.get('/:eventId', getEventById);

// Защита на останалите маршрути
router.use(authMiddleware);

// Създаване на събитие (само учители и админи)
router.post(
    '/',
    restrictTo('teacher', 'admin'),
    [
        body('title').notEmpty().withMessage('Заглавието е задължително'),
        body('description').notEmpty().withMessage('Описанието е задължително'),
        body('startDate').isISO8601().withMessage('Невалидна начална дата'),
        body('location').notEmpty().withMessage('Мястото е задължително'),
        body('organizer').notEmpty().withMessage('Организаторът е задължителен')
    ],
    createEvent
);

// Обновяване на събитие (създател или админ)
router.put(
    '/:eventId',
    [
        body('title').optional().notEmpty().withMessage('Заглавието е задължително'),
        body('description').optional().notEmpty().withMessage('Описанието е задължително'),
        body('startDate').optional().isISO8601().withMessage('Невалидна начална дата'),
        body('location').optional().notEmpty().withMessage('Мястото е задължително'),
        body('organizer').optional().notEmpty().withMessage('Организаторът е задължителен')
    ],
    updateEvent
);

// Изтриване на събитие (създател или админ)
router.delete('/:eventId', deleteEvent);

// Участие в събития
router.post('/:eventId/participate', participateInEvent);

// Управление на участия
router.post('/participations/:participationId/confirm', confirmParticipation);
router.post('/participations/:participationId/cancel', cancelParticipation);
router.post(
    '/participations/:participationId/feedback',
    [
        body('feedback').notEmpty().withMessage('Обратната връзка е задължителна')
    ],
    provideFeedback
);

// Отбелязване на присъствие (само учители и админи)
router.post(
    '/participations/:participationId/attendance',
    restrictTo('teacher', 'admin'),
    markAttendance
);

// Получаване на участията на потребител - променено от students/:studentId на users/:userId
router.get('/users/:userId/participations', getStudentParticipations);

// Статистики (само учители и админи)
router.get('/stats/overview', restrictTo('teacher', 'admin'), getEventsStatistics);

export default router;