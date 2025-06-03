// server/services/eventsService.js - Updated
import Event from '../models/Event.js';
import EventParticipation from '../models/EventParticipation.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { compareIds } from '../utils/helpers.js';
import * as notificationService from './notificationService.js';

// Получаване на всички събития
export const getAllEvents = async (filters = {}) => {
    const { sortBy = 'startDate', sortOrder = 1, upcoming = false, past = false } = filters;

    let query = {};

    if (upcoming) {
        query.startDate = { $gte: new Date() };
    }

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
            path: 'user',
            select: 'firstName lastName email studentInfo.grade studentInfo.specialization'
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

    // Известяване на всички ученици
    const students = await User.find({ role: 'student' }).select('id firstName lastName');
    const studentIds = students.map(student => student.id);

    if (studentIds.length > 0) {
        await notificationService.createBulkNotifications(studentIds, {
            title: 'Ново събитие',
            message: `Ново събитие "${event.title}" е създадено. Датата на събитието е ${new Date(event.startDate).toLocaleDateString('bg-BG')} в ${event.location}.`,
            type: 'info',
            category: 'event',
            relatedTo: {
                model: 'Event',
                id: event.id
            },
            sendEmail: true
        });
    }

    return event;
};

// Обновяване на събитие
export const updateEvent = async (eventId, updateData, currentUserId, currentUserRole) => {
    const event = await Event.findById(eventId);

    if (!event) {
        throw new AppError('Събитието не е намерено', 404);
    }

    // Проверка за права
    const isCreator = compareIds(event.createdBy, currentUserId);
    if (!isCreator && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да обновявате това събитие', 403);
    }

    const oldStartDate = event.startDate;
    const { title, description, startDate, endDate, location, organizer, feedbackUrl } = updateData;

    if (title) event.title = title;
    if (description) event.description = description;
    if (startDate) event.startDate = new Date(startDate);
    if (endDate !== undefined) event.endDate = endDate ? new Date(endDate) : undefined;
    if (location) event.location = location;
    if (organizer) event.organizer = organizer;
    if (feedbackUrl !== undefined) event.feedbackUrl = feedbackUrl;

    await event.save();

    // Ако датата е променена, известяваме участниците
    if (startDate && new Date(startDate).getTime() !== oldStartDate.getTime()) {
        const participations = await EventParticipation.find({
            event: eventId,
            status: { $in: ['registered', 'confirmed'] }
        }).populate('user', 'id');

        const participantIds = participations.map(p => p.user.id);

        if (participantIds.length > 0) {
            await notificationService.createBulkNotifications(participantIds, {
                title: 'Промяна в дата на събитие',
                message: `Датата на събитие "${event.title}" е променена на ${new Date(startDate).toLocaleDateString('bg-BG')}`,
                type: 'warning',
                category: 'event',
                relatedTo: {
                    model: 'Event',
                    id: event.id
                },
                sendEmail: true
            });
        }
    }

    return event;
};

// Изтриване на събитие
export const deleteEvent = async (eventId, currentUserId, currentUserRole) => {
    const event = await Event.findById(eventId);

    if (!event) {
        throw new AppError('Събитието не е намерено', 404);
    }

    // Проверка за права
    const isCreator = compareIds(event.createdBy, currentUserId);
    if (!isCreator && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да изтривате това събитие', 403);
    }

    // Намиране на участници за известяване
    const participations = await EventParticipation.find({
        event: eventId,
        status: { $in: ['registered', 'confirmed'] }
    }).populate('user', 'id');

    const participantIds = participations.map(p => p.user.id);

    // Изтриване
    await Event.deleteOne({ id: eventId });
    await EventParticipation.deleteMany({ event: eventId });

    // Известяване
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
    const event = await Event.findById(eventId);
    if (!event) {
        throw new AppError('Събитието не е намерено', 404);
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    if (user.role !== 'student') {
        throw new AppError('Само ученици могат да се регистрират за събития', 400);
    }

    // Проверка за съществуваща регистрация
    const existingParticipation = await EventParticipation.findOne({
        event: eventId,
        user: userId
    });

    if (existingParticipation) {
        throw new AppError('Вече сте регистрирани за това събитие', 400);
    }

    // Проверка дали събитието не е започнало
    if (new Date() > event.startDate) {
        throw new AppError('Не можете да се регистрирате за събитие, което вече е започнало', 400);
    }

    const participation = await EventParticipation.create({
        event: eventId,
        user: userId,
        status: 'registered'
    });

    // Известяване на организатора
    const organizer = await User.findById(event.createdBy);
    if (organizer) {
        await notificationService.createNotification({
            recipient: organizer.id,
            title: 'Нова регистрация за събитие',
            message: `${user.firstName} ${user.lastName} се регистрира за събитие "${event.title}"`,
            type: 'info',
            category: 'event',
            relatedTo: {
                model: 'Event',
                id: event.id
            },
            sendEmail: false
        });
    }

    return participation;
};

// Потвърждаване на участие
export const confirmParticipation = async (participationId, currentUserId, currentUserRole) => {
    const participation = await EventParticipation.findById(participationId)
        .populate('user', 'firstName lastName')
        .populate('event', 'title createdBy');

    if (!participation) {
        throw new AppError('Регистрацията не е намерена', 404);
    }

    // Проверка за права
    const isOwner = compareIds(participation.user.id, currentUserId);
    if (!isOwner && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да потвърждавате това участие', 403);
    }

    participation.status = 'confirmed';
    participation.confirmedAt = Date.now();
    await participation.save();

    // Известяване на организатора
    const organizer = await User.findById(participation.event.createdBy);
    if (organizer) {
        await notificationService.createNotification({
            recipient: organizer.id,
            title: 'Потвърдено участие в събитие',
            message: `${participation.user.firstName} ${participation.user.lastName} потвърди участието си в събитие "${participation.event.title}"`,
            type: 'success',
            category: 'event',
            relatedTo: {
                model: 'Event',
                id: participation.event.id
            },
            sendEmail: false
        });
    }

    return participation;
};

// Получаване на регистрации на ученик
export const getStudentParticipations = async (userId, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    if (user.role !== 'student') {
        throw new AppError('Потребителят не е ученик', 400);
    }

    // Проверка за права
    const isOwner = compareIds(user.id, currentUserId);
    const isTeacherOrAdmin = currentUserRole === 'teacher' || currentUserRole === 'admin';

    if (!isOwner && !isTeacherOrAdmin) {
        throw new AppError('Нямате права да преглеждате тези регистрации', 403);
    }

    const participations = await EventParticipation.find({ user: userId })
        .populate('event', 'title startDate endDate location organizer feedbackUrl')
        .sort({ 'event.startDate': -1 });

    return participations;
};

// Отбелязване на присъствие
export const markAttendance = async (participationId, currentUserRole) => {
    if (currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да отбелязвате присъствие', 403);
    }

    const participation = await EventParticipation.findById(participationId)
        .populate('user', 'firstName lastName')
        .populate('event', 'title');

    if (!participation) {
        throw new AppError('Регистрацията не е намерена', 404);
    }

    participation.status = 'attended';
    participation.attendedAt = Date.now();
    await participation.save();

    // Известяване на ученика
    await notificationService.createNotification({
        recipient: participation.user.id,
        title: 'Отбелязано присъствие на събитие',
        message: `Вашето присъствие на събитие "${participation.event.title}" беше отбелязано.`,
        type: 'success',
        category: 'event',
        relatedTo: {
            model: 'Event',
            id: participation.event.id
        },
        sendEmail: false
    });

    return participation;
};

// Предоставяне на обратна връзка
export const provideFeedback = async (participationId, feedback, currentUserId, currentUserRole) => {
    const participation = await EventParticipation.findById(participationId)
        .populate('user', 'id')
        .populate('event', 'title createdBy');

    if (!participation) {
        throw new AppError('Регистрацията не е намерена', 404);
    }

    // Проверка за права
    const isOwner = compareIds(participation.user.id, currentUserId);
    if (!isOwner && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да предоставяте обратна връзка за това участие', 403);
    }

    if (participation.status !== 'attended') {
        throw new AppError('Не можете да предоставите обратна връзка за непосетено събитие', 400);
    }

    participation.feedback = feedback;
    participation.feedbackDate = Date.now();
    await participation.save();

    // Известяване на организатора
    const organizer = await User.findById(participation.event.createdBy);
    if (organizer) {
        await notificationService.createNotification({
            recipient: organizer.id,
            title: 'Нова обратна връзка за събитие',
            message: `Получена е нова обратна връзка за събитие "${participation.event.title}".`,
            type: 'info',
            category: 'event',
            relatedTo: {
                model: 'Event',
                id: participation.event.id
            },
            sendEmail: false
        });
    }

    return participation;
};

// Отмяна на регистрация
export const cancelParticipation = async (participationId, currentUserId, currentUserRole) => {
    const participation = await EventParticipation.findById(participationId)
        .populate('event', 'title createdBy startDate')
        .populate('user', 'firstName lastName');

    if (!participation) {
        throw new AppError('Регистрацията не е намерена', 404);
    }

    // Проверка за права
    const isOwner = compareIds(participation.user.id, currentUserId);
    if (!isOwner && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да отменяте тази регистрация', 403);
    }

    // Проверка дали събитието не е започнало
    if (new Date() > participation.event.startDate) {
        throw new AppError('Не можете да отмените регистрация за събитие, което вече е започнало', 400);
    }

    participation.status = 'cancelled';
    await participation.save();

    // Известяване на организатора
    const organizer = await User.findById(participation.event.createdBy);
    if (organizer) {
        await notificationService.createNotification({
            recipient: organizer.id,
            title: 'Отменена регистрация за събитие',
            message: `${participation.user.firstName} ${participation.user.lastName} отмени регистрацията си за събитие "${participation.event.title}".`,
            type: 'warning',
            category: 'event',
            relatedTo: {
                model: 'Event',
                id: participation.event.id
            },
            sendEmail: false
        });
    }

    return { message: 'Регистрацията е отменена успешно' };
};

// Получаване на статистики
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