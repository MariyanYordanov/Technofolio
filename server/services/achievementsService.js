// server/services/achievementsService.js
import Achievement from '../models/Achievement.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';

// Валидни категории постижения
const VALID_CATEGORIES = ['competition', 'olympiad', 'tournament', 'certificate', 'award', 'other'];

// Получаване на постиженията на ученик
export const getStudentAchievements = async (studentId, currentUserId, currentUserRole) => {
    // Проверка дали ученикът съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка на права (собственик, учител или админ)
    if (student.user._id.toString() !== currentUserId &&
        currentUserRole !== 'teacher' &&
        currentUserRole !== 'admin') {
        throw new AppError('Нямате права да преглеждате тези постижения', 403);
    }

    // Намиране на постиженията
    const achievements = await Achievement.find({ student: studentId })
        .sort({ date: -1 });

    return {
        achievements,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        studentGrade: student.grade || 'Неопределен'
    };
};

// Добавяне на ново постижение
export const addAchievement = async (studentId, achievementData, currentUserId, currentUserRole) => {
    const { category, title, description, date, place, issuer } = achievementData;

    // Валидиране на категорията
    if (!VALID_CATEGORIES.includes(category)) {
        throw new AppError(`Невалидна категория. Допустими са: ${VALID_CATEGORIES.join(', ')}`, 400);
    }

    // Валидиране на задължителните полета
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw new AppError('Заглавието е задължително', 400);
    }

    if (!date || !Date.parse(date)) {
        throw new AppError('Невалидна дата', 400);
    }

    // Валидиране на дължините на полетата
    if (title.trim().length > 200) {
        throw new AppError('Заглавието не може да бъде по-дълго от 200 символа', 400);
    }

    if (description && typeof description === 'string' && description.trim().length > 1000) {
        throw new AppError('Описанието не може да бъде по-дълго от 1000 символа', 400);
    }

    if (place && typeof place === 'string' && place.trim().length > 100) {
        throw new AppError('Мястото не може да бъде по-дълго от 100 символа', 400);
    }

    if (issuer && typeof issuer === 'string' && issuer.trim().length > 200) {
        throw new AppError('Издателят не може да бъде по-дълъг от 200 символа', 400);
    }

    // Проверка дали датата не е в бъдещето
    const achievementDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Края на днешния ден

    if (achievementDate > today) {
        throw new AppError('Датата на постижението не може да бъде в бъдещето', 400);
    }

    // Проверка дали ученикът съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка дали потребителят има права (само собственикът или администратор)
    if (student.user._id.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да добавяте постижения за този ученик', 403);
    }

    // Проверка за дублиращи се постижения (ако заглавието и датата са еднакви)
    const existingAchievement = await Achievement.findOne({
        student: studentId,
        title: title.trim(),
        date: achievementDate
    });

    if (existingAchievement) {
        throw new AppError('Постижение с това заглавие и дата вече съществува', 400);
    }

    // Създаване на ново постижение
    const achievement = await Achievement.create({
        student: studentId,
        category,
        title: title.trim(),
        description: description ? description.trim() : '',
        date: achievementDate,
        place: place ? place.trim() : '',
        issuer: issuer ? issuer.trim() : ''
    });

    return achievement;
};

// Изтриване на постижение
export const removeAchievement = async (studentId, achievementId, currentUserId, currentUserRole) => {
    // Валидиране на achievementId
    if (!achievementId || typeof achievementId !== 'string') {
        throw new AppError('Невалиден ID на постижението', 400);
    }

    // Проверка дали студентът съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Намиране на постижението
    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
        throw new AppError('Постижението не е намерено', 404);
    }

    // Проверка дали постижението принадлежи на правилния студент
    if (achievement.student.toString() !== studentId) {
        throw new AppError('Постижението не принадлежи на този ученик', 400);
    }

    // Проверка дали потребителят има права (само собственикът или администратор)
    if (student.user._id.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да изтривате постижения за този ученик', 403);
    }

    // Запазване на информация за постижението преди изтриването
    const achievementInfo = {
        title: achievement.title,
        category: achievement.category,
        date: achievement.date
    };

    // Изтриване на постижението
    await Achievement.deleteOne({ _id: achievementId });

    return {
        message: 'Постижението е изтрито успешно',
        deletedAchievement: achievementInfo
    };
};

// Получаване на всички постижения (за учители и админи)
export const getAllAchievements = async (filters, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате всички постижения', 403);
    }

    const { page = 1, limit = 10, grade, category, search, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    // Построяване на pipeline за агрегация
    let pipeline = [
        {
            $lookup: {
                from: 'students',
                localField: 'student',
                foreignField: '_id',
                as: 'studentData'
            }
        },
        { $unwind: '$studentData' },
        {
            $lookup: {
                from: 'users',
                localField: 'studentData.user',
                foreignField: '_id',
                as: 'userData'
            }
        },
        { $unwind: '$userData' }
    ];

    // Филтри
    let matchConditions = {};

    if (grade && ['8', '9', '10', '11', '12'].includes(grade)) {
        matchConditions['studentData.grade'] = grade;
    }

    if (category && VALID_CATEGORIES.includes(category)) {
        matchConditions.category = category;
    }

    if (search) {
        matchConditions.$or = [
            { 'userData.firstName': { $regex: search, $options: 'i' } },
            { 'userData.lastName': { $regex: search, $options: 'i' } },
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { issuer: { $regex: search, $options: 'i' } }
        ];
    }

    if (startDate || endDate) {
        matchConditions.date = {};
        if (startDate) matchConditions.date.$gte = new Date(startDate);
        if (endDate) matchConditions.date.$lte = new Date(endDate);
    }

    if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
    }

    // Добавяне на допълнителни полета
    pipeline.push({
        $addFields: {
            studentName: { $concat: ['$userData.firstName', ' ', '$userData.lastName'] }
        }
    });

    // Сортиране и пагинация
    pipeline.push(
        { $sort: { date: -1, 'userData.lastName': 1 } },
        { $skip: skip },
        { $limit: limit }
    );

    const achievements = await Achievement.aggregate(pipeline);

    // Общ брой за пагинация
    const totalPipeline = pipeline.slice(0, -2); // Без skip и limit
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Achievement.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

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
export const getAchievementsStatistics = async (filters, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате статистики', 403);
    }

    const { grade, startDate, endDate } = filters;

    // Построяване на pipeline
    let pipeline = [
        {
            $lookup: {
                from: 'students',
                localField: 'student',
                foreignField: '_id',
                as: 'studentData'
            }
        },
        { $unwind: '$studentData' }
    ];

    // Филтри
    let matchConditions = {};

    if (grade && ['8', '9', '10', '11', '12'].includes(grade)) {
        matchConditions['studentData.grade'] = grade;
    }

    if (startDate || endDate) {
        matchConditions.date = {};
        if (startDate) matchConditions.date.$gte = new Date(startDate);
        if (endDate) matchConditions.date.$lte = new Date(endDate);
    }

    if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
    }

    // Статистики по категории
    const categoryStats = await Achievement.aggregate([
        ...pipeline,
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);

    // Статистики по ученици
    const studentStats = await Achievement.aggregate([
        ...pipeline,
        {
            $group: {
                _id: '$student',
                achievementsCount: { $sum: 1 },
                categories: { $addToSet: '$category' }
            }
        },
        {
            $group: {
                _id: null,
                totalStudentsWithAchievements: { $sum: 1 },
                avgAchievementsPerStudent: { $avg: '$achievementsCount' }
            }
        }
    ]);

    // Общи статистики
    const totalAchievements = await Achievement.countDocuments();
    const totalStudents = await Student.countDocuments(
        grade ? { grade } : {}
    );

    // Форматиране на резултатите
    const stats = {
        overview: {
            totalAchievements,
            totalStudents,
            studentsWithAchievements: studentStats.length > 0 ? studentStats[0].totalStudentsWithAchievements : 0,
            averageAchievementsPerStudent: studentStats.length > 0 ?
                Math.round(studentStats[0].avgAchievementsPerStudent * 100) / 100 : 0,
            participationRate: totalStudents > 0 ?
                Math.round(((studentStats.length > 0 ? studentStats[0].totalStudentsWithAchievements : 0) / totalStudents) * 100) : 0
        },
        byCategory: VALID_CATEGORIES.map(category => {
            const categoryData = categoryStats.find(stat => stat._id === category);
            return {
                category,
                count: categoryData ? categoryData.count : 0
            };
        })
    };

    return stats;
};

// Експортиране на постижения за отчет
export const exportAchievementsData = async (filters, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права за този експорт', 403);
    }

    const { grade, category, startDate, endDate } = filters;

    // Pipeline за експорт
    let pipeline = [
        {
            $lookup: {
                from: 'students',
                localField: 'student',
                foreignField: '_id',
                as: 'studentData'
            }
        },
        { $unwind: '$studentData' },
        {
            $lookup: {
                from: 'users',
                localField: 'studentData.user',
                foreignField: '_id',
                as: 'userData'
            }
        },
        { $unwind: '$userData' }
    ];

    // Филтри
    let matchConditions = {};
    if (grade) matchConditions['studentData.grade'] = grade;
    if (category) matchConditions.category = category;
    if (startDate || endDate) {
        matchConditions.date = {};
        if (startDate) matchConditions.date.$gte = new Date(startDate);
        if (endDate) matchConditions.date.$lte = new Date(endDate);
    }

    if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
    }

    // Форматиране за експорт
    pipeline.push({
        $project: {
            studentName: { $concat: ['$userData.firstName', ' ', '$userData.lastName'] },
            grade: '$studentData.grade',
            specialization: '$studentData.specialization',
            category: 1,
            title: 1,
            description: 1,
            date: {
                $dateToString: {
                    format: '%d.%m.%Y',
                    date: '$date'
                }
            },
            place: 1,
            issuer: 1,
            createdAt: {
                $dateToString: {
                    format: '%d.%m.%Y',
                    date: '$createdAt'
                }
            }
        }
    });

    pipeline.push({ $sort: { grade: 1, studentName: 1, date: -1 } });

    const exportData = await Achievement.aggregate(pipeline);

    return exportData;
};