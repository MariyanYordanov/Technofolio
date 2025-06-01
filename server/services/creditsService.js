// server/services/creditsService.js - Updated
import Credit from '../models/Credit.js';
import CreditCategory from '../models/CreditCategory.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { compareIds } from '../utils/helpers.js';
import * as notificationService from './notificationService.js';

// Проверка дали потребителят е ученик
const ensureUserIsStudent = (user) => {
    if (!user || user.role !== 'student') {
        throw new AppError('Потребителят не е ученик', 400);
    }
};

// Получаване на кредитите на потребител
export const getStudentCredits = async (userId, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);

    // Проверка за права
    const isOwner = compareIds(user._id, currentUserId);
    const isTeacherOrAdmin = currentUserRole === 'teacher' || currentUserRole === 'admin';

    if (!isOwner && !isTeacherOrAdmin) {
        throw new AppError('Нямате права да преглеждате тези кредити', 403);
    }

    const credits = await Credit.find({ user: userId })
        .populate('validatedBy', 'firstName lastName')
        .sort({ createdAt: -1 });

    // Статистики
    const stats = {
        total: credits.length,
        pending: credits.filter(c => c.status === 'pending').length,
        validated: credits.filter(c => c.status === 'validated').length,
        rejected: credits.filter(c => c.status === 'rejected').length,
        byPillar: {
            'Аз и другите': credits.filter(c => c.pillar === 'Аз и другите').length,
            'Мислене': credits.filter(c => c.pillar === 'Мислене').length,
            'Професия': credits.filter(c => c.pillar === 'Професия').length
        }
    };

    return { credits, stats };
};

// Получаване на категориите кредити
export const getCreditCategories = async () => {
    const categories = await CreditCategory.find().sort({ pillar: 1, name: 1 });

    const categoriesByPillar = categories.reduce((acc, category) => {
        if (!acc[category.pillar]) {
            acc[category.pillar] = [];
        }
        acc[category.pillar].push(category);
        return acc;
    }, {});

    return { categories, categoriesByPillar };
};

// Добавяне на нов кредит
export const addCredit = async (creditData, userId) => {
    const { pillar, activity, description } = creditData;

    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);

    // Проверка за дублирани кредити
    const existingCredit = await Credit.findOne({
        user: userId,
        activity: activity.trim(),
        status: { $in: ['pending', 'validated'] }
    });

    if (existingCredit) {
        throw new AppError('Вече имате заявка за кредит с тази дейност', 400);
    }

    const credit = await Credit.create({
        user: userId,
        pillar,
        activity: activity.trim(),
        description: description.trim(),
        status: 'pending'
    });

    // Известяване на учители
    const teachers = await User.find({ role: 'teacher' }).select('_id');

    if (teachers.length > 0) {
        const teacherIds = teachers.map(teacher => teacher._id);

        await notificationService.createBulkNotifications(teacherIds, {
            title: 'Нова заявка за кредит',
            message: `${user.firstName} ${user.lastName} заяви нов кредит за "${activity}".`,
            type: 'info',
            category: 'credit',
            relatedTo: {
                model: 'Credit',
                id: credit._id
            },
            sendEmail: false
        });
    }

    return credit;
};

// Валидиране на кредит
export const validateCredit = async (creditId, validationData, validatorId, validatorRole) => {
    if (validatorRole !== 'teacher' && validatorRole !== 'admin') {
        throw new AppError('Нямате права да валидирате кредити', 403);
    }

    const { status, validationNote } = validationData;

    if (!['validated', 'rejected'].includes(status)) {
        throw new AppError('Невалиден статус за валидиране', 400);
    }

    const credit = await Credit.findById(creditId).populate('user');

    if (!credit) {
        throw new AppError('Кредитът не е намерен', 404);
    }

    if (credit.status !== 'pending') {
        throw new AppError('Този кредит вече е бил обработен', 400);
    }

    credit.status = status;
    credit.validatedBy = validatorId;
    credit.validationDate = Date.now();

    if (validationNote) {
        credit.validationNote = validationNote.trim();
    }

    await credit.save();

    // Известяване на ученика
    await notificationService.createNotification({
        recipient: credit.user._id,
        title: status === 'validated' ? 'Кредит одобрен' : 'Кредит отхвърлен',
        message: status === 'validated'
            ? `Вашият кредит за "${credit.activity}" е одобрен.`
            : `Вашият кредит за "${credit.activity}" е отхвърлен.`,
        type: status === 'validated' ? 'success' : 'warning',
        category: 'credit',
        relatedTo: {
            model: 'Credit',
            id: credit._id
        },
        sendEmail: true
    });

    return credit;
};

// Изтриване на кредит
export const deleteCredit = async (creditId, currentUserId, currentUserRole) => {
    const credit = await Credit.findById(creditId).populate('user');

    if (!credit) {
        throw new AppError('Кредитът не е намерен', 404);
    }

    // Проверка за права
    const isOwner = compareIds(credit.user._id, currentUserId);

    if (!isOwner && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да изтривате този кредит', 403);
    }

    if (credit.status === 'validated' && currentUserRole !== 'admin') {
        throw new AppError('Не можете да изтриете валидиран кредит', 400);
    }

    await Credit.deleteOne({ _id: creditId });

    return {
        message: 'Кредитът е изтрит успешно',
        creditId,
        activity: credit.activity
    };
};

// Получаване на всички кредити
export const getAllCredits = async (filters, currentUserRole) => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате всички кредити', 403);
    }

    const { page = 1, limit = 10, status, pillar, search, userId } = filters;
    const skip = (page - 1) * limit;

    let query = {};

    if (status) {
        query.status = status;
    }

    if (pillar) {
        query.pillar = pillar;
    }

    if (userId) {
        query.user = userId;
    }

    if (search) {
        query.$or = [
            { activity: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    const credits = await Credit.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'firstName lastName email studentInfo.grade')
        .populate('validatedBy', 'firstName lastName');

    const total = await Credit.countDocuments(query);

    // Статистики
    const stats = await Credit.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const statusStats = stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
    }, { pending: 0, validated: 0, rejected: 0 });

    return {
        credits,
        pagination: {
            count: credits.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        },
        stats: statusStats
    };
};

// Добавяне на категория кредити
export const addCreditCategory = async (categoryData, currentUserRole) => {
    if (currentUserRole !== 'admin') {
        throw new AppError('Нямате права да добавяте категории кредити', 403);
    }

    const { pillar, name, description } = categoryData;

    const existingCategory = await CreditCategory.findOne({
        name: name.trim(),
        pillar
    });

    if (existingCategory) {
        throw new AppError('Категория кредити с това име вече съществува в този стълб', 400);
    }

    const category = await CreditCategory.create({
        pillar,
        name: name.trim(),
        description: description ? description.trim() : ''
    });

    return category;
};

// Обновяване на категория кредити
export const updateCreditCategory = async (categoryId, updateData, currentUserRole) => {
    if (currentUserRole !== 'admin') {
        throw new AppError('Нямате права да обновявате категории кредити', 403);
    }

    const { name, description, pillar } = updateData;

    const category = await CreditCategory.findById(categoryId);
    if (!category) {
        throw new AppError('Категорията не е намерена', 404);
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (pillar) category.pillar = pillar;

    await category.save();
    return category;
};

// Изтриване на категория кредити
export const deleteCreditCategory = async (categoryId, currentUserRole) => {
    if (currentUserRole !== 'admin') {
        throw new AppError('Нямате права да изтривате категории кредити', 403);
    }

    const creditsWithCategory = await Credit.findOne({ category: categoryId });
    if (creditsWithCategory) {
        throw new AppError('Тази категория не може да бъде изтрита, защото се използва в кредити', 400);
    }

    const result = await CreditCategory.deleteOne({ _id: categoryId });

    if (result.deletedCount === 0) {
        throw new AppError('Категорията не е намерена', 404);
    }

    return { message: 'Категорията е изтрита успешно' };
};

// Получаване на статистики за кредити
export const getCreditsStatistics = async (filters = {}) => {
    const { startDate, endDate, pillar, studentGrade } = filters;

    let creditQuery = {};

    if (startDate || endDate) {
        creditQuery.createdAt = {};
        if (startDate) creditQuery.createdAt.$gte = new Date(startDate);
        if (endDate) creditQuery.createdAt.$lte = new Date(endDate);
    }

    if (pillar) {
        creditQuery.pillar = pillar;
    }

    // Основни статистики
    const baseStats = await Credit.aggregate([
        { $match: creditQuery },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                pending: {
                    $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                },
                validated: {
                    $sum: { $cond: [{ $eq: ['$status', 'validated'] }, 1, 0] }
                },
                rejected: {
                    $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
                },
                byPillar: {
                    $push: '$pillar'
                }
            }
        }
    ]);

    const stats = baseStats[0] || {
        total: 0,
        pending: 0,
        validated: 0,
        rejected: 0,
        byPillar: []
    };

    // Статистики по стълбове
    const pillarStats = stats.byPillar.reduce((acc, pillar) => {
        acc[pillar] = (acc[pillar] || 0) + 1;
        return acc;
    }, {});

    return {
        total: stats.total,
        pending: stats.pending,
        validated: stats.validated,
        rejected: stats.rejected,
        byPillar: {
            'Аз и другите': pillarStats['Аз и другите'] || 0,
            'Мислене': pillarStats['Мислене'] || 0,
            'Професия': pillarStats['Професия'] || 0
        },
        validationRate: stats.total > 0 ? ((stats.validated / stats.total) * 100).toFixed(2) : 0
    };
};

// Масово валидиране на кредити
export const bulkValidateCredits = async (creditIds, validationData, validatorId, validatorRole) => {
    if (validatorRole !== 'teacher' && validatorRole !== 'admin') {
        throw new AppError('Нямате права да валидирате кредити', 403);
    }

    const { status, validationNote } = validationData;

    if (!['validated', 'rejected'].includes(status)) {
        throw new AppError('Невалиден статус за валидиране', 400);
    }

    if (!creditIds || !Array.isArray(creditIds) || creditIds.length === 0) {
        throw new AppError('Не са предоставени валидни ID-та на кредити', 400);
    }

    const credits = await Credit.find({
        _id: { $in: creditIds },
        status: 'pending'
    }).populate('user');

    if (credits.length === 0) {
        throw new AppError('Няма намерени кредити за валидиране', 404);
    }

    const updateData = {
        status,
        validatedBy: validatorId,
        validationDate: Date.now()
    };

    if (validationNote) {
        updateData.validationNote = validationNote.trim();
    }

    const result = await Credit.updateMany(
        { _id: { $in: credits.map(c => c._id) } },
        { $set: updateData }
    );

    // Изпращане на известия
    for (const credit of credits) {
        await notificationService.createNotification({
            recipient: credit.user._id,
            title: status === 'validated' ? 'Кредит одобрен' : 'Кредит отхвърлен',
            message: status === 'validated'
                ? `Вашият кредит за "${credit.activity}" е одобрен.`
                : `Вашият кредит за "${credit.activity}" е отхвърлен.`,
            type: status === 'validated' ? 'success' : 'warning',
            category: 'credit',
            sendEmail: false
        });
    }

    return {
        message: `${result.modifiedCount} кредита са обработени успешно`,
        processedCount: result.modifiedCount,
        status
    };
};