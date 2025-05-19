// server/services/notificationService.js
import Notification from '../models/Notification.js';
import { sendEmail } from '../utils/email.js';
import User from '../models/User.js';

// Функция за създаване на известие
export const createNotification = async (data) => {
    try {
        const { recipient, title, message, type, category, relatedTo, sendEmail: shouldSendEmail } = data;

        // Създаване на ново известие
        const notification = await Notification.create({
            recipient,
            title,
            message,
            type: type || 'info',
            category,
            relatedTo,
            isRead: false,
            isEmailSent: false
        });

        // Изпращане на имейл, ако е поискано
        if (shouldSendEmail) {
            await sendNotificationEmail(notification);
        }

        return notification;
    } catch (error) {
        console.error('Грешка при създаване на известие:', error);
        throw error;
    }
};

// Функция за масово създаване на известия (за група потребители)
export const createBulkNotifications = async (recipients, data) => {
    try {
        const { title, message, type, category, relatedTo, sendEmail: shouldSendEmail } = data;

        // Създаване на масив от известия
        const notificationsToCreate = recipients.map(recipient => ({
            recipient,
            title,
            message,
            type: type || 'info',
            category,
            relatedTo,
            isRead: false,
            isEmailSent: false
        }));

        // Запазване на известията в базата данни
        const notifications = await Notification.insertMany(notificationsToCreate);

        // Изпращане на имейли, ако е поискано
        if (shouldSendEmail) {
            for (const notification of notifications) {
                await sendNotificationEmail(notification);
            }
        }

        return notifications;
    } catch (error) {
        console.error('Грешка при масово създаване на известия:', error);
        throw error;
    }
};

// Функция за изпращане на имейл за известие
export const sendNotificationEmail = async (notification) => {
    try {
        // Извличане на потребителя
        const user = await User.findById(notification.recipient);

        if (!user || !user.email) {
            console.error('Потребителят не е намерен или няма имейл');
            return;
        }

        // Определяне на заглавие на имейла според категорията
        let subject;
        switch (notification.category) {
            case 'event':
                subject = 'Известие за събитие - Технофолио';
                break;
            case 'credit':
                subject = 'Известие за кредити - Технофолио';
                break;
            case 'absence':
                subject = 'Известие за отсъствия - Технофолио';
                break;
            case 'sanction':
                subject = 'Известие за санкции - Технофолио';
                break;
            default:
                subject = 'Известие от Технофолио';
        }

        // Изпращане на имейл
        await sendEmail({
            email: user.email,
            subject,
            text: `${notification.title}\n\n${notification.message}\n\nПоздрави,\nЕкипът на Технофолио`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #4a4a4a; text-align: center;">${notification.title}</h2>
                    <p>${notification.message}</p>
                    <p style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 10px; font-size: 12px; color: #777;">
                        С уважение,<br>
                        Екипът на Технофолио
                    </p>
                </div>
            `
        });

        // Обновяване на флага за изпратен имейл
        await Notification.findByIdAndUpdate(notification._id, { isEmailSent: true });

        return true;
    } catch (error) {
        console.error('Грешка при изпращане на имейл за известие:', error);
        return false;
    }
};

// Функция за отбелязване на известие като прочетено
export const markNotificationAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { isRead: true },
            { new: true }
        );

        return notification;
    } catch (error) {
        console.error('Грешка при отбелязване на известие като прочетено:', error);
        throw error;
    }
};

// Функция за отбелязване на всички известия като прочетени
export const markAllNotificationsAsRead = async (userId) => {
    try {
        const result = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );

        return result.modifiedCount;
    } catch (error) {
        console.error('Грешка при отбелязване на всички известия като прочетени:', error);
        throw error;
    }
};

// Функция за изтриване на известие
export const deleteNotification = async (notificationId, userId) => {
    try {
        const result = await Notification.deleteOne({
            _id: notificationId,
            recipient: userId
        });

        return result.deletedCount > 0;
    } catch (error) {
        console.error('Грешка при изтриване на известие:', error);
        throw error;
    }
};

// Функция за създаване на известие за ново събитие
export const notifyAboutNewEvent = async (event, recipients) => {
    try {
        const notificationData = {
            title: 'Ново събитие',
            message: `Ново събитие "${event.title}" е създадено. Датата на събитието е ${new Date(event.startDate).toLocaleDateString('bg-BG')} в ${event.location}.`,
            type: 'info',
            category: 'event',
            relatedTo: {
                model: 'Event',
                id: event._id
            },
            sendEmail: true
        };

        return await createBulkNotifications(recipients, notificationData);
    } catch (error) {
        console.error('Грешка при известяване за ново събитие:', error);
        throw error;
    }
};

// Функция за известяване за промяна в статуса на кредит
export const notifyAboutCreditStatusChange = async (credit, status) => {
    try {
        let title, message, type;

        if (status === 'validated') {
            title = 'Кредит одобрен';
            message = `Вашият кредит за "${credit.activity}" е одобрен.`;
            type = 'success';
        } else {
            title = 'Кредит отхвърлен';
            message = `Вашият кредит за "${credit.activity}" е отхвърлен.`;
            type = 'warning';
        }

        const notificationData = {
            recipient: credit.student.user,
            title,
            message,
            type,
            category: 'credit',
            relatedTo: {
                model: 'Credit',
                id: credit._id
            },
            sendEmail: true
        };

        return await createNotification(notificationData);
    } catch (error) {
        console.error('Грешка при известяване за промяна в статуса на кредит:', error);
        throw error;
    }
};

// Функция за известяване за нови отсъствия
export const notifyAboutAbsences = async (student, absences) => {
    try {
        const notificationData = {
            recipient: student.user,
            title: 'Нови отсъствия',
            message: `Имате нови отсъствия: ${absences.excused} извинени и ${absences.unexcused} неизвинени.`,
            type: 'warning',
            category: 'absence',
            relatedTo: {
                model: 'Sanction',
                id: absences._id
            },
            sendEmail: true
        };

        return await createNotification(notificationData);
    } catch (error) {
        console.error('Грешка при известяване за нови отсъствия:', error);
        throw error;
    }
};

// Функция за известяване за нова санкция
export const notifyAboutNewSanction = async (student, sanction) => {
    try {
        const notificationData = {
            recipient: student.user,
            title: 'Нова санкция',
            message: `Имате нова санкция: ${sanction.type}. Причина: ${sanction.reason}.`,
            type: 'error',
            category: 'sanction',
            relatedTo: {
                model: 'Sanction',
                id: sanction._id
            },
            sendEmail: true
        };

        return await createNotification(notificationData);
    } catch (error) {
        console.error('Грешка при известяване за нова санкция:', error);
        throw error;
    }
};