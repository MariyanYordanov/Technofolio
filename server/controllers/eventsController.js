import { validationResult } from 'express-validator';
import Event from '../models/Event.js';
import EventParticipation from '../models/EventParticipation.js';
import Student from '../models/Student.js';

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

        // Изтриване на събитието - .remove() е остарял метод
        await Event.deleteOne({ _id: eventId });

        // Изтриване на свързаните участия
        await EventParticipation.deleteMany({ event: eventId });

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

        // Проверка дали студентът съществува
        const student = await Student.findOne({ user: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Студентският профил не е намерен' });
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
        const student = await Student.findById(participation.student);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        if (student.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да потвърждавате това участие' });
        }

        // Обновяване на статуса
        participation.status = 'confirmed';
        participation.confirmedAt = Date.now();
        await participation.save();

        res.status(200).json(participation);
    } catch (error) {
        next(error);
    }
}

// Получаване на регистрациите на студент
export async function getStudentParticipations(req, res, next) {
    try {
        const studentId = req.params.studentId;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
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