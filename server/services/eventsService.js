// server/services/eventsService.js
import Event from '../models/Event.js';
import EventParticipation from '../models/EventParticipation.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import * as notificationService from './notificationService.js';

// Получаване на всички събития
export const getAllEvents = async (filters = {}) => {
    const { sortBy = 'startDate', sortOrder = 1, upcoming = false, past = false } = filters;

    let query = {};

    // Филтър за предстоящи събития
    if (upcoming) {
        query.startDate = { $gte: new Date() };
    }

    // Филтър за минали събития
    if (past) {
        query.startDate = { $lt: new Date() };
    }

    const events = await Event.find(query)
        .sort({ [sortBy]: sortOrder })
        .populate('createdBy', 'firstName lastName');

    return events;
};

// Получаване на събитие по ID
export const getEventById = async (eventId) => {
    const event = await Event.findById(eventId)
        .populate('createdBy', 'firstName lastName');

    if (!event) {
        throw new AppError('Събитието не е намерено', 404);
    }

    return event;
};

// Получаване на събитие с участници
export const getEventWithParticipants = async (eventId) => {
    const event = await getEventById(eventId);

    const participations = await EventParticipation.find({ event: eventId })
        .populate({
            path: 'student',
            select: 'grade specialization',
            populate: {
                path: 'user',
                select: 'firstName lastName email'
            }
        });

    return {
        event,
        participations,
        stats: {
            total: participations.length,
            registered: participations.filter(p => p.status === 'registered').length,
            confirmed: participations.filter(p => p.status === 'confirmed').length,
            attended: participations.filter(p => p.status === 'attended').length,
            cancelled: participations.filter(p => p.status === 'cancelled').length
        }
    };
};

// Създаване на ново събитие
export const createEvent = async (eventData, creatorId) => {
    const { title, description, startDate, endDate, location, organizer, feedbackUrl } = eventData;

    // Създаване на събитие
    const event = await Event.create({
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        location,
        organizer,
        feedbackUrl,
        createdBy: creatorId
    });

    // Известяване на всички ученици за новото събитие
    const students = await User.find({ role: 'student' }).select('_id');
    const studentIds = students.map(student => student._id);

    if (studentIds.length > 0) {
        await notificationService.notifyAboutNewEvent(event, studentIds);
    }

    return event;
};

// Обновяване на събитие
export const updateEvent = async (eventId, updateData, currentUserId, currentUserRole) => {
    const { title, description, startDate, endDate, location, organizer, feedbackUrl } = updateData;

    // Намиране на събитието
    const event = await Event.findById(eventId);

    if (!event) {
        throw new AppError('Събитието не е намерено', 404);
    }

    // Проверка дали потребителят има права (само създателят или администратор)
    if (event.createdBy.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да обновявате това събитие', 403);
    }

    // Запазване на старата дата за проверка
    const oldStartDate = event.startDate;

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
    if (startDate && new Date(startDate).getTime() !== oldStartDate.getTime()) {
        const participations = await EventParticipation.find({
            event: eventId,
            status: { $in: ['registered', 'confirmed'] }
        }).populate('student', 'user');

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

    return event;
};

// Изтриване на събитие
export const deleteEvent = async (eventId, currentUserId, currentUserRole) => {
    // Намиране на събитието
    const event = await Event.findById(eventId);

    if (!event) {
        throw new AppError('Събитието не е намерено', 404);
    }

    // Проверка дали потребителят има права (само създателят или администратор)
    if (event.createdBy.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да изтривате това събитие', 403);
    }

    // Намиране на всички регистрирани участници за известяване
    const participations = await EventParticipation.find({
        event: eventId,
        status: { $in: ['registered', 'confirmed'] }
    }).populate('student', 'user');

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

    return {
        message: 'Събитието е изтрито успешно',
        notifiedParticipants: participantIds.length
    };
};

// Регистриране за събитие
export const participateInEvent = async (eventId, userId) => {
    // Проверка дали събитието съществува
    const event = await Event.findById(eventId);
    if (!event) {
        throw new AppError('Събитието не е намерено', 404);
    }

    // Проверка дали ученикът съществува
    const student = await Student.findOne({ user: userId }).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученическият профил не е намерен', 404);
    }

    // Проверка дали вече има регистрация
    const existingParticipation = await EventParticipation.findOne({
        event: eventId,
        student: student._id
    });

    if (existingParticipation) {
        throw new AppError('Вече сте регистрирани за това събитие', 400);
    }

    // Проверка дали събитието не е вече започнало
    if (new Date() > event.startDate) {
        throw new AppError('Не можете да се регистрирате за събитие, което вече е започнало', 400);
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

    return participation;
};

// Потвърждаване на участие в събитие
export const confirmParticipation = async (participationId, currentUserId, currentUserRole) => {
    // Намиране на регистрацията
    const participation = await EventParticipation.findById(participationId)
        .populate({
            path: 'student',
            populate: {
                path: 'user',
                select: 'firstName lastName'
            }
        })
        .populate('event', 'title createdBy');

    if (!participation) {
        throw new AppError('Регистрацията не е намерена', 404);
    }

    // Проверка дали студентът има права
    if (participation.student.user._id.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да потвърждавате това участие', 403);
    }

    // Обновяване на статуса
    participation.status = 'confirmed';
    participation.confirmedAt = Date.now();
    await participation.save();

    // Известяване на организатора на събитието
    const organizer = await User.findById(participation.event.createdBy);
    if (organizer) {
        await notificationService.createNotification({
            recipient: organizer._id,
            title: 'Потвърдено участие в събитие',
            message: `Ученикът ${participation.student.user.firstName} ${participation.student.user.lastName} потвърди участието си в събитие "${participation.event.title}"`,
            type: 'success',
            category: 'event',
            relatedTo: {
                model: 'Event',
                id: participation.event._id
            },
            sendEmail: false
        });
    }

    return participation;
};

// Получаване на регистрациите на ученик
export const getStudentParticipations = async (studentId, currentUserId, currentUserRole) => {
    // Проверка дали ученика съществува
    const student = await Student.findById(studentId);
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка дали потребителят има права
    if (student.user.toString() !== currentUserId && currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате тези регистрации', 403);
    }

    // Намиране на регистрациите
    const participations = await EventParticipation.find({ student: studentId })
        .populate('event', 'title startDate endDate location organizer feedbackUrl')
        .sort({ 'event.startDate': -1 });

    return participations;
};

// Отбелязване на посетено събитие
export const markAttendance = async (participationId, currentUserRole) => {
    // Проверка дали потребителят има права (само учител или администратор)
    if (currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да отбелязвате присъствие', 403);
    }

    // Намиране на регистрацията
    const participation = await EventParticipation.findById(participationId)
        .populate({
            path: 'student',
            populate: {
                path: 'user',
                select: 'firstName lastName'
            }
        })
        .populate('event', 'title');

    if (!participation) {
        throw new AppError('Регистрацията не е намерена', 404);
    }

    // Обновяване на статуса
    participation.status = 'attended';
    participation.attendedAt = Date.now();
    await participation.save();

    // Известяване на студента
    await notificationService.createNotification({
        recipient: participation.student.user._id,
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

    return participation;
};

// Предоставяне на обратна връзка за събитие
export const provideFeedback = async (participationId, feedback, currentUserId, currentUserRole) => {
    if (!feedback || typeof feedback !== 'string') {
        throw new AppError('Невалидна обратна връзка', 400);
    }

    // Намиране на регистрацията
    const participation = await EventParticipation.findById(participationId)
        .populate('student', 'user')
        .populate('event', 'title createdBy');

    if (!participation) {
        throw new AppError('Регистрацията не е намерена', 404);
    }

    // Проверка дали студентът има права
    if (participation.student.user.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да предоставяте обратна връзка за това участие', 403);
    }

    // Проверка дали събитието е посетено
    if (participation.status !== 'attended') {
        throw new AppError('Не можете да предоставите обратна връзка за непосетено събитие', 400);
    }

    // Обновяване на обратната връзка
    participation.feedback = feedback;
    participation.feedbackDate = Date.now();
    await participation.save();

    // Известяване на организатора на събитието
    const organizer = await User.findById(participation.event.createdBy);
    if (organizer) {
        await notificationService.createNotification({
            recipient: organizer._id,
            title: 'Нова обратна връзка за събитие',
            message: `Получена е нова обратна връзка за събитие "${participation.event.title}".`,
            type: 'info',
            category: 'event',
            relatedTo: {
                model: 'Event',
                id: participation.event._id
            },
            sendEmail: false
        });
    }

    return participation;
};

// Отмяна на регистрация за събитие
export const cancelParticipation = async (participationId, currentUserId, currentUserRole) => {
    // Намиране на регистрацията
    const participation = await EventParticipation.findById(participationId)
        .populate('event', 'title createdBy startDate')
        .populate({
            path: 'student',
            populate: {
                path: 'user',
                select: 'firstName lastName'
            }
        });

    if (!participation) {
        throw new AppError('Регистрацията не е намерена', 404);
    }

    // Проверка дали ученикът има права
    if (participation.student.user._id.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да отменяте тази регистрация', 403);
    }

    // Проверка дали събитието не е вече започнало
    if (new Date() > participation.event.startDate) {
        throw new AppError('Не можете да отмените регистрация за събитие, което вече е започнало', 400);
    }

    // Обновяване на статуса
    participation.status = 'cancelled';
    await participation.save();

    // Известяване на организатора
    const organizer = await User.findById(participation.event.createdBy);
    if (organizer) {
        await notificationService.createNotification({
            recipient: organizer._id,
            title: 'Отменена регистрация за събитие',
            message: `${participation.student.user.firstName} ${participation.student.user.lastName} отмени регистрацията си за събитие "${participation.event.title}".`,
            type: 'warning',
            category: 'event',
            relatedTo: {
                model: 'Event',
                id: participation.event._id
            },
            sendEmail: false
        });
    }

    return { message: 'Регистрацията е отменена успешно' };
};

// Получаване на статистики за събития
export const getEventsStatistics = async (filters = {}) => {
    const { startDate, endDate } = filters;

    let dateQuery = {};
    if (startDate || endDate) {
        dateQuery.startDate = {};
        if (startDate) dateQuery.startDate.$gte = new Date(startDate);
        if (endDate) dateQuery.startDate.$lte = new Date(endDate);
    }

    const [
        totalEvents,
        upcomingEvents,
        pastEvents,
        totalParticipations,
        confirmedParticipations,
        attendedParticipations
    ] = await Promise.all([
        Event.countDocuments(dateQuery),
        Event.countDocuments({ ...dateQuery, startDate: { $gte: new Date() } }),
        Event.countDocuments({ ...dateQuery, startDate: { $lt: new Date() } }),
        EventParticipation.countDocuments(),
        EventParticipation.countDocuments({ status: 'confirmed' }),
        EventParticipation.countDocuments({ status: 'attended' })
    ]);

    return {
        totalEvents,
        upcomingEvents,
        pastEvents,
        participations: {
            total: totalParticipations,
            confirmed: confirmedParticipations,
            attended: attendedParticipations,
            attendanceRate: totalParticipations > 0 ? (attendedParticipations / totalParticipations * 100).toFixed(2) : 0
        }
    };
};