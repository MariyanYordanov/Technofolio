// server/controllers/eventsController.js
import { validationResult } from 'express-validator';
import { catchAsync } from '../utils/catchAsync.js';
import * as eventsService from '../services/eventsService.js';

// Получаване на всички събития
export const getAllEvents = catchAsync(async (req, res, next) => {
    const filters = {
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder ? parseInt(req.query.sortOrder) : 1,
        upcoming: req.query.upcoming === 'true',
        past: req.query.past === 'true'
    };

    const events = await eventsService.getAllEvents(filters);

    res.status(200).json({
        success: true,
        count: events.length,
        events
    });
});

// Получаване на събитие по ID
export const getEventById = catchAsync(async (req, res, next) => {
    const eventId = req.params.eventId;
    const withParticipants = req.query.withParticipants === 'true';

    let result;
    if (withParticipants && (req.user.role === 'teacher' || req.user.role === 'admin')) {
        result = await eventsService.getEventWithParticipants(eventId);
        res.status(200).json({
            success: true,
            event: result.event,
            participations: result.participations,
            stats: result.stats
        });
    } else {
        const event = await eventsService.getEventById(eventId);
        res.status(200).json({
            success: true,
            event
        });
    }
});

// Създаване на ново събитие (само за учители и администратори)
export const createEvent = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    // Проверка дали потребителят има права (само учител или администратор)
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Нямате права да създавате събития'
        });
    }

    const event = await eventsService.createEvent(req.body, req.user.id);

    res.status(201).json({
        success: true,
        event
    });
});

// Обновяване на събитие (само за създателя и администратори)
export const updateEvent = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const eventId = req.params.eventId;
    const event = await eventsService.updateEvent(eventId, req.body, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        event
    });
});

// Изтриване на събитие (само за създателя и администратори)
export const deleteEvent = catchAsync(async (req, res, next) => {
    const eventId = req.params.eventId;
    const result = await eventsService.deleteEvent(eventId, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        message: result.message,
        notifiedParticipants: result.notifiedParticipants
    });
});

// Регистриране за събитие
export const participateInEvent = catchAsync(async (req, res, next) => {
    const eventId = req.params.eventId;
    const participation = await eventsService.participateInEvent(eventId, req.user.id);

    res.status(201).json({
        success: true,
        participation
    });
});

// Потвърждаване на участие в събитие
export const confirmParticipation = catchAsync(async (req, res, next) => {
    const participationId = req.params.participationId;
    const participation = await eventsService.confirmParticipation(participationId, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        participation
    });
});

// Получаване на регистрациите на ученик
export const getStudentParticipations = catchAsync(async (req, res, next) => {
    const studentId = req.params.studentId;
    const participations = await eventsService.getStudentParticipations(studentId, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        count: participations.length,
        participations
    });
});

// Отбелязване на посетено събитие
export const markAttendance = catchAsync(async (req, res, next) => {
    const participationId = req.params.participationId;
    const participation = await eventsService.markAttendance(participationId, req.user.role);

    res.status(200).json({
        success: true,
        participation
    });
});

// Предоставяне на обратна връзка за събитие
export const provideFeedback = catchAsync(async (req, res, next) => {
    const participationId = req.params.participationId;
    const { feedback } = req.body;

    if (!feedback || typeof feedback !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Невалидна обратна връзка'
        });
    }

    const participation = await eventsService.provideFeedback(participationId, feedback, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        participation
    });
});

// Отмяна на регистрация за събитие
export const cancelParticipation = catchAsync(async (req, res, next) => {
    const participationId = req.params.participationId;
    const result = await eventsService.cancelParticipation(participationId, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// Получаване на статистики за събития
export const getEventsStatistics = catchAsync(async (req, res, next) => {
    // Проверка дали потребителят има права (само учител или администратор)
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Нямате права да преглеждате статистики'
        });
    }

    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
    };

    const stats = await eventsService.getEventsStatistics(filters);

    res.status(200).json({
        success: true,
        stats
    });
});