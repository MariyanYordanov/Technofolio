// server/controllers/notificationsController.js
import { validationResult } from 'express-validator';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import * as notificationService from '../services/notificationService.js';

// Получаване на известия за текущия потребител
export const getUserNotifications = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';
    const category = req.query.category;

    // Създаване на query обект
    let query = { recipient: req.user.id };

    // Филтър за непрочетени известия
    if (unreadOnly) {
        query.isRead = false;
    }

    // Филтър по категория
    if (category && ['event', 'credit', 'absence', 'sanction', 'system'].includes(category)) {
        query.category = category;
    }

    // Извличане на известия
    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Брой на непрочетените известия
    const unreadCount = await Notification.countDocuments({
        recipient: req.user.id,
        isRead: false
    });

    // Общ брой известия (за пагинация)
    const total = await Notification.countDocuments(query);

    res.status(200).json({
        success: true,
        count: notifications.length,
        total,
        unreadCount,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        notifications
    });
});

// Отбелязване на известие като прочетено
export const markAsRead = catchAsync(async (req, res, next) => {
    const { notificationId } = req.params;

    const notification = await notificationService.markNotificationAsRead(notificationId, req.user.id);

    if (!notification) {
        return next(new AppError('Известието не е намерено или нямате права да го отбележите като прочетено', 404));
    }

    res.status(200).json({
        success: true,
        notification
    });
});

// Отбелязване на всички известия като прочетени
export const markAllAsRead = catchAsync(async (req, res, next) => {
    const updatedCount = await notificationService.markAllNotificationsAsRead(req.user.id);

    res.status(200).json({
        success: true,
        message: `${updatedCount} известия са отбелязани като прочетени`
    });
});

// Изтриване на известие
export const deleteNotification = catchAsync(async (req, res, next) => {
    const { notificationId } = req.params;

    const isDeleted = await notificationService.deleteNotification(notificationId, req.user.id);

    if (!isDeleted) {
        return next(new AppError('Известието не е намерено или нямате права да го изтриете', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Известието е успешно изтрито'
    });
});

// Създаване на известие (за администратори и учители)
export const createNotification = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { recipientId, title, message, type, category, relatedTo, sendEmail } = req.body;

    // Проверка дали потребителят съществува
    const recipient = await User.findById(recipientId);
    if (!recipient) {
        return next(new AppError('Получателят не е намерен', 404));
    }

    // Създаване на известие
    const notification = await notificationService.createNotification({
        recipient: recipientId,
        title,
        message,
        type,
        category,
        relatedTo,
        sendEmail
    });

    res.status(201).json({
        success: true,
        notification
    });
});

// Изпращане на масово известие (за администратори и учители)
export const createBulkNotification = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { role, grade, title, message, type, category, relatedTo, sendEmail } = req.body;

    // Намиране на получателите според зададените филтри
    let recipients = [];

    if (role) {
        // Филтър по роля
        const users = await User.find({ role }).select('id');
        recipients = users.map(user => user.id);
    } else if (grade) {
        // Филтър по клас (само за ученици)
        const students = await User.find({
            role: 'student',
            'studentInfo.grade': grade
        }).select('id');
        recipients = students.map(student => student.id);
    } else {
        // Всички потребители
        const users = await User.find().select('id');
        recipients = users.map(user => user.id);
    }

    if (recipients.length === 0) {
        return next(new AppError('Няма намерени получатели според зададените филтри', 404));
    }

    // Създаване на масови известия
    const notifications = await notificationService.createBulkNotifications(recipients, {
        title,
        message,
        type,
        category,
        relatedTo,
        sendEmail
    });

    res.status(201).json({
        success: true,
        count: notifications.length,
        message: `${notifications.length} известия са създадени успешно`
    });
});