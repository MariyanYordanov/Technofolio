import { Router } from 'express';
import { body } from 'express-validator';
import { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent, participateInEvent, confirmParticipation, getStudentParticipations } from '../controllers/eventsController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Защита на всички маршрути с изключение на getAllEvents и getEventById
router.get('/', getAllEvents);
router.get('/:eventId', getEventById);

// Защита на останалите маршрути
router.use(authMiddleware);

router.post(
    '/',
    [
        body('title').notEmpty().withMessage('Заглавието е задължително'),
        body('description').notEmpty().withMessage('Описанието е задължително'),
        body('startDate').isISO8601().withMessage('Невалидна начална дата'),
        body('location').notEmpty().withMessage('Мястото е задължително'),
        body('organizer').notEmpty().withMessage('Организаторът е задължителен')
    ],
    createEvent
);

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

router.delete('/:eventId', deleteEvent);

// Участие в събития
router.post('/:eventId/participate', participateInEvent);
router.post('/participations/:participationId/confirm', confirmParticipation);
router.get('/students/:studentId/participations', getStudentParticipations);

export default router;