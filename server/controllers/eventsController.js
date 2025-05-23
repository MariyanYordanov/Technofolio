// server/controllers/eventsController.js
import { validationResult } from 'express-validator';
import Event from '../models/Event.js';
import EventParticipation from '../models/EventParticipation.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import * as notificationService from '../services/notificationService.js';

// Получаване на всички събития
export async function getAllEvents(req, res, next) {
    try {
        const events = await Event.find()
            .sort({ startDate: 1 });

        res.status(200).json(events);
    } catch (error) {
        next(error);
    }
}

// Получаване на събитие по ID
export async function getEventById(req, res, next) {
    try {
        const eventId = req.params.eventId;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Събитието не е намерено' });
        }

        res.status(200).json(event);
    } catch (error) {
        next(error);
    }
}

// Създаване на ново събитие (само за учители и администратори)
export async function createEvent(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        // Проверка дали потребителят има права (само учител или администратор)
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да създавате събития' });
        }

        const { title, description, startDate, endDate, location, organizer, feedbackUrl } = req.body;

        // Създаване на събитие
        const event = await Event.create({
            title,
            description,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
            location,
            organizer,
            feedbackUrl,
            createdBy: req.user.id
        });

        // Известяване на всички ученици за новото събитие
        const students = await User.find({ role: 'student' }).select('_id');
        const studentIds = students.map(student => student._id);

        await notificationService.notifyAboutNewEvent(event, studentIds);

        res.status(201).json(event);
    } catch (error) {
        next(error);
    }
}

// Обновяване на събитие (само за създателя и администратори)
export async function updateEvent(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        const eventId = req.params.eventId;

        // Намиране на събитието
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Събитието не е намерено' });
        }

        // Проверка дали потребителят има права (само създателят или администратор)
        if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да обновявате това събитие' });
        }

        const { title, description, startDate, endDate, location, organizer, feedbackUrl } = req.body;

        // Обновяване на полетата
        if (title) event.title = title;
        if (description) event.description = description;
        if (startDate) event.startDate = new Date(startDate);
        if (endDate !== undefined) event.endDate = endDate ? new Date(endDate) : undefined;
        if (location) event.location = location;
        if (organizer) event.organizer = organizer;
        if (feedbackUrl !== undefined) event.feedbackUrl = feedbackUrl;

        await event.save();

        // Ако датата на събитието е променена, известяваме регистрираните участници
        if (startDate && new Date(startDate).getTime() !== event.startDate.getTime()) {
            const participations = await EventParticipation.find({ event: eventId, status: { $in: ['registered', 'confirmed'] } })
                .populate('student', 'user');

            const participantIds = participations.map(p => p.student.user);

            if (participantIds.length > 0) {
                await notificationService.createBulkNotifications(participantIds, {
                    title: 'Промяна в дата на събитие',
                    message: `Датата на събитие "${event.title}" е променена на ${new Date(startDate).toLocaleDateString('bg-BG')}`,
                    type: 'warning',
                    category: 'event',
                    relatedTo: {
                        model: 'Event',
                        id: event._id
                    },
                    sendEmail: true
                });
            }
        }

        res.status(200).json(event);
    } catch (error) {
        next(error);
    }
}

// Изтриване на събитие (само за създателя и администратори)
export async function deleteEvent(req, res, next) {
    try {
        const eventId = req.params.eventId;

        // Намиране на събитието
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Събитието не е намерено' });
        }

        // Проверка дали потребителят има права (само създателят или администратор)
        if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да изтривате това събитие' });
        }

        // Намиране на всички регистрирани участници за известяване
        const participations = await EventParticipation.find({ event: eventId, status: { $in: ['registered', 'confirmed'] } })
            .populate('student', 'user');

        const participantIds = participations.map(p => p.student.user);

        // Изтриване на събитието
        await Event.deleteOne({ _id: eventId });

        // Изтриване на свързаните участия
        await EventParticipation.deleteMany({ event: eventId });

        // Известяване на регистрираните участници за отмяната
        if (participantIds.length > 0) {
            await notificationService.createBulkNotifications(participantIds, {
                title: 'Събитие отменено',
                message: `Събитие "${event.title}", планирано за ${new Date(event.startDate).toLocaleDateString('bg-BG')}, беше отменено.`,
                type: 'error',
                category: 'event',
                sendEmail: true
            });
        }

        res.status(200).json({ message: 'Събитието е изтрито успешно' });
    } catch (error) {
        next(error);
    }
}

// Регистриране за събитие
export async function participateInEvent(req, res, next) {
    try {
        const eventId = req.params.eventId;

        // Проверка дали събитието съществува
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Събитието не е намерено' });
        }

        // Проверка дали ученикът съществува
        const student = await Student.findOne({ user: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Ученическият профил не е намерен' });
        }

        // Проверка дали вече има регистрация
        const existingParticipation = await EventParticipation.findOne({
            event: eventId,
            student: student._id
        });

        if (existingParticipation) {
            return res.status(400).json({ message: 'Вече сте регистрирани за това събитие' });
        }

        // Създаване на нова регистрация
        const participation = await EventParticipation.create({
            event: eventId,
            student: student._id,
            status: 'registered'
        });

        // Известяване на организатора на събитието
        const organizer = await User.findById(event.createdBy);
        if (organizer) {
            await notificationService.createNotification({
                recipient: organizer._id,
                title: 'Нова регистрация за събитие',
                message: `Ученикът ${student.user.firstName} ${student.user.lastName} се регистрира за събитие "${event.title}"`,
                type: 'info',
                category: 'event',
                relatedTo: {
                    model: 'Event',
                    id: event._id
                },
                sendEmail: false
            });
        }

        res.status(201).json(participation);
    } catch (error) {
        next(error);
    }
}

// Потвърждаване на участие в събитие
export async function confirmParticipation(req, res, next) {
    try {
        const participationId = req.params.participationId;

        // Намиране на регистрацията
        const participation = await EventParticipation.findById(participationId);

        if (!participation) {
            return res.status(404).json({ message: 'Регистрацията не е намерена' });
        }

        // Проверка дали студентът има права
        const student = await Student.findById(participation.student).populate('user', 'firstName lastName');
        if (!student) {
            return res.status(404).json({ message: 'Ученикът не е намерен' });
        }

        if (student.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да потвърждавате това участие' });
        }

        // Обновяване на статуса
        participation.status = 'confirmed';
        participation.confirmedAt = Date.now();
        await participation.save();

        // Известяване на организатора на събитието
        const event = await Event.findById(participation.event);
        const organizer = event ? await User.findById(event.createdBy) : null;

        if (organizer) {
            await notificationService.createNotification({
                recipient: organizer._id,
                title: 'Потвърдено участие в събитие',
                message: `Ученикът ${student.user.firstName} ${student.user.lastName} потвърди участието си в събитие "${event.title}"`,
                type: 'success',
                category: 'event',
                relatedTo: {
                    model: 'Event',
                    id: event._id
                },
                sendEmail: false
            });
        }

        res.status(200).json(participation);
    } catch (error) {
        next(error);
    }
}

// Получаване на регистрациите на ученик
export async function getStudentParticipations(req, res, next) {
    try {
        const studentId = req.params.studentId;

        // Проверка дали ученика съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Ученикът не е намерен' });
        }

        // Проверка дали потребителят има права
        if (student.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Нямате права да преглеждате тези регистрации' });
        }

        // Намиране на регистрациите
        const participations = await EventParticipation.find({ student: studentId })
            .populate('event', 'title startDate endDate location organizer feedbackUrl');

        res.status(200).json(participations);
    } catch (error) {
        next(error);
    }
}

// Отбелязване на посетено събитие (ново)
export async function markAttendance(req, res, next) {
    try {
        const participationId = req.params.participationId;

        // Проверка дали потребителят има права (само учител или администратор)
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да отбелязвате присъствие' });
        }

        // Намиране на регистрацията
        const participation = await EventParticipation.findById(participationId)
            .populate('student', 'user')
            .populate('event', 'title');

        if (!participation) {
            return res.status(404).json({ message: 'Регистрацията не е намерена' });
        }

        // Обновяване на статуса
        participation.status = 'attended';
        participation.attendedAt = Date.now();
        await participation.save();

        // Известяване на студента
        await notificationService.createNotification({
            recipient: participation.student.user,
            title: 'Отбелязано присъствие на събитие',
            message: `Вашето присъствие на събитие "${participation.event.title}" беше отбелязано.`,
            type: 'success',
            category: 'event',
            relatedTo: {
                model: 'Event',
                id: participation.event._id
            },
            sendEmail: false
        });

        res.status(200).json(participation);
    } catch (error) {
        next(error);
    }
}

// Предоставяне на обратна връзка за събитие (ново)
export async function provideFeedback(req, res, next) {
    try {
        const participationId = req.params.participationId;
        const { feedback } = req.body;

        if (!feedback || typeof feedback !== 'string') {
            return res.status(400).json({ message: 'Невалидна обратна връзка' });
        }

        // Намиране на регистрацията
        const participation = await EventParticipation.findById(participationId);

        if (!participation) {
            return res.status(404).json({ message: 'Регистрацията не е намерена' });
        }

        // Проверка дали студентът има права
        const student = await Student.findById(participation.student);
        if (!student) {
            return res.status(404).json({ message: 'Ученикът не е намерен' });
        }

        if (student.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да предоставяте обратна връзка за това участие' });
        }

        // Проверка дали събитието е посетено
        if (participation.status !== 'attended') {
            return res.status(400).json({ message: 'Не можете да предоставите обратна връзка за непосетено събитие' });
        }

        // Обновяване на обратната връзка
        participation.feedback = feedback;
        participation.feedbackDate = Date.now();
        await participation.save();

        // Известяване на организатора на събитието
        const event = await Event.findById(participation.event);
        const organizer = event ? await User.findById(event.createdBy) : null;

        if (organizer) {
            await notificationService.createNotification({
                recipient: organizer._id,
                title: 'Нова обратна връзка за събитие',
                message: `Получена е нова обратна връзка за събитие "${event.title}".`,
                type: 'info',
                category: 'event',
                relatedTo: {
                    model: 'Event',
                    id: event._id
                },
                sendEmail: false
            });
        }

        res.status(200).json(participation);
    } catch (error) {
        next(error);
    }
}

// Отмяна на регистрация за събитие (ново)
export async function cancelParticipation(req, res, next) {
    try {
        const participationId = req.params.participationId;

        // Намиране на регистрацията
        const participation = await EventParticipation.findById(participationId)
            .populate('event', 'title createdBy')
            .populate('student', 'user');

        if (!participation) {
            return res.status(404).json({ message: 'Регистрацията не е намерена' });
        }

        // Проверка дали ученикът има права
        if (participation.student.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да отменяте тази регистрация' });
        }

        // Обновяване на статуса
        participation.status = 'cancelled';
        await participation.save();

        // Известяване на организатора
        const organizer = participation.event.createdBy;
        if (organizer) {
            await notificationService.createNotification({
                recipient: organizer,
                title: 'Отменена регистрация за събитие',
                message: `Регистрацията за събитие "${participation.event.title}" беше отменена.`,
                type: 'warning',
                category: 'event',
                relatedTo: {
                    model: 'Event',
                    id: participation.event._id
                },
                sendEmail: false
            });
        }

        res.status(200).json({ message: 'Регистрацията е отменена успешно' });
    } catch (error) {
        next(error);
    }
}