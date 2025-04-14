const express = require('express');
const { body } = require('express-validator');
const eventsController = require('../controllers/eventsController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Защита на всички маршрути с изключение на getAllEvents и getEventById
router.get('/', eventsController.getAllEvents);
router.get('/:eventId', eventsController.getEventById);

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
    eventsController.createEvent
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
    eventsController.updateEvent
);

router.delete('/:eventId', eventsController.deleteEvent);

// Участие в събития
router.post('/:eventId/participate', eventsController.participateInEvent);
router.post('/participations/:participationId/confirm', eventsController.confirmParticipation);
router.get('/students/:studentId/participations', eventsController.getStudentParticipations);

module.exports = router;