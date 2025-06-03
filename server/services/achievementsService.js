// server/services/achievementsService.js
import Achievement from '../models/Achievement.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { compareIds } from '../utils/helpers.js';

// Проверка дали потребителят е ученик
const ensureUserIsStudent = (user) => {
    if (!user || user.role !== 'student') {
        throw new AppError('Потребителят не е ученик', 400);
    }
};

// Проверка за права за достъп
const checkAccessRights = (user, currentUserId, currentUserRole) => {
    const isOwner = compareIds(user.id, currentUserId);
    const isTeacherOrAdmin = currentUserRole === 'teacher' || currentUserRole === 'admin';

    if (!isOwner && !isTeacherOrAdmin) {
        throw new AppError('Нямате права за достъп до тази информация', 403);
    }

    return { isOwner, isTeacherOrAdmin };
};

// Получаване на постиженията на потребител
export const getUserAchievements = async (userId, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);
    checkAccessRights(user, currentUserId, currentUserRole);

    const achievements = await Achievement.find({ user: userId })
        .sort({ date: -1 });

    return achievements;
};

// Добавяне на ново постижение
export const addAchievement = async (achievementData, currentUserId, currentUserRole) => {
    const { userId, category, title, description, date, place, issuer } = achievementData;

    // Определяне на userId - ако не е подаден, използваме текущия потребител
    const targetUserId = userId || currentUserId;

    const user = await User.findById(targetUserId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);

    // Проверка за права - само собственикът или админ може да добавя
    const isOwner = compareIds(user.id, currentUserId);
    if (!isOwner && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да добавяте постижения за този потребител', 403);
    }

    // Проверка за дублиращи се постижения
    const existingAchievement = await Achievement.findOne({
        user: targetUserId,
        title: title.trim(),
        date: new Date(date)
    });

    if (existingAchievement) {
        throw new AppError('Постижение с това заглавие и дата вече съществува', 400);
    }

    // Проверка дали датата не е в бъдещето
    if (new Date(date) > new Date()) {
        throw new AppError('Датата на постижението не може да бъде в бъдещето', 400);
    }

    const achievement = await Achievement.create({
        user: targetUserId,
        category,
        title: title.trim(),
        description: description ? description.trim() : '',
        date: new Date(date),
        place: place ? place.trim() : '',
        issuer: issuer ? issuer.trim() : ''
    });

    return achievement;
};

// Обновяване на постижение
export const updateAchievement = async (achievementId, updateData, currentUserId, currentUserRole) => {
    const achievement = await Achievement.findById(achievementId).populate('user');

    if (!achievement) {
        throw new AppError('Постижението не е намерено', 404);
    }

    // Проверка за права
    const isOwner = compareIds(achievement.user.id, currentUserId);
    if (!isOwner && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да редактирате това постижение', 403);
    }

    const { category, title, description, date, place, issuer } = updateData;

    if (category) achievement.category = category;
    if (title) achievement.title = title.trim();
    if (description !== undefined) achievement.description = description.trim();
    if (date) {
        if (new Date(date) > new Date()) {
            throw new AppError('Датата на постижението не може да бъде в бъдещето', 400);
        }
        achievement.date = new Date(date);
    }
    if (place !== undefined) achievement.place = place.trim();
    if (issuer !== undefined) achievement.issuer = issuer.trim();

    await achievement.save();

    return achievement;
};

// Изтриване на постижение
export const deleteAchievement = async (achievementId, currentUserId, currentUserRole) => {
    const achievement = await Achievement.findById(achievementId).populate('user');

    if (!achievement) {
        throw new AppError('Постижението не е намерено', 404);
    }

    // Проверка за права
    const isOwner = compareIds(achievement.user.id, currentUserId);
    if (!isOwner && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да изтривате това постижение', 403);
    }

    await Achievement.deleteOne({ id: achievementId });

    return {
        message: 'Постижението е изтрито успешно',
        deletedAchievement: {
            title: achievement.title,
            category: achievement.category,
            date: achievement.date
        }
    };
};

// Получаване на всички постижения (за админи и учители)
export const getAllAchievements = async (filters, currentUserRole) => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате всички постижения', 403);
    }

    const { page = 1, limit = 10, category, userId, startDate, endDate, search } = filters;
    const skip = (page - 1) * limit;

    let query = {};

    if (category) {
        query.category = category;
    }

    if (userId) {
        query.user = userId;
    }

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { issuer: { $regex: search, $options: 'i' } }
        ];
    }

    const achievements = await Achievement.find(query)
        .populate('user', 'firstName lastName email studentInfo.grade')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Achievement.countDocuments(query);

    return {
        achievements,
        pagination: {
            count: achievements.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    };
};

// Получаване на статистики за постижения
export const getAchievementsStats = async (filters, currentUserRole) => {
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате статистики', 403);
    }

    const { startDate, endDate, grade } = filters;

    let matchQuery = {};

    if (startDate || endDate) {
        matchQuery.date = {};
        if (startDate) matchQuery.date.$gte = new Date(startDate);
        if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    // Основни статистики
    const baseStats = await Achievement.aggregate([
        { $match: matchQuery },
        {
            $group: {
                id: null,
                total: { $sum: 1 },
                byCategory: { $push: '$category' }
            }
        }
    ]);

    const stats = baseStats[0] || { total: 0, byCategory: [] };

    // Статистики по категории
    const categoryStats = stats.byCategory.reduce((acc, category) => {
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});

    // Статистики по ученици
    const studentStats = await Achievement.aggregate([
        { $match: matchQuery },
        {
            $group: {
                id: '$user',
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                id: null,
                studentsWithAchievements: { $sum: 1 },
                avgAchievementsPerStudent: { $avg: '$count' }
            }
        }
    ]);

    const studentStatsData = studentStats[0] || {
        studentsWithAchievements: 0,
        avgAchievementsPerStudent: 0
    };

    // Топ ученици по брой постижения
    const topStudents = await Achievement.aggregate([
        { $match: matchQuery },
        {
            $group: {
                id: '$user',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'users',
                localField: 'id',
                foreignField: 'id',
                as: 'userInfo'
            }
        },
        { $unwind: '$userInfo' },
        {
            $project: {
                count: 1,
                studentName: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
                grade: '$userInfo.studentInfo.grade'
            }
        }
    ]);

    return {
        total: stats.total,
        byCategory: categoryStats,
        studentsWithAchievements: studentStatsData.studentsWithAchievements,
        avgAchievementsPerStudent: Math.round(studentStatsData.avgAchievementsPerStudent * 100) / 100,
        topStudents
    };
};