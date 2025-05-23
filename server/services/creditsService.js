// server/services/creditsService.js
import Credit from '../models/Credit.js';
import CreditCategory from '../models/CreditCategory.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import * as notificationService from './notificationService.js';

// Получаване на кредитите на ученик
export const getStudentCredits = async (studentId, currentUserId, currentUserRole) => {
    // Проверка дали ученикът съществува
    const student = await Student.findById(studentId);
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка дали потребителят има права
    if (student.user.toString() !== currentUserId && currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате тези кредити', 403);
    }

    // Намиране на кредитите
    const credits = await Credit.find({ student: studentId })
        .populate('validatedBy', 'firstName lastName')
        .sort({ createdAt: -1 });

    // Група статистики
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

    // Групиране по стълб за по-лесно използване
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

    // Валидиране на стълба
    if (!['Аз и другите', 'Мислене', 'Професия'].includes(pillar)) {
        throw new AppError('Невалиден стълб', 400);
    }

    // Проверка дали студентът съществува
    const student = await Student.findOne({ user: userId }).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученическият профил не е намерен', 404);
    }

    // Проверка за дублирани кредити (същата дейност от същия студент)
    const existingCredit = await Credit.findOne({
        student: student._id,
        activity: activity.trim(),
        status: { $in: ['pending', 'validated'] }
    });

    if (existingCredit) {
        throw new AppError('Вече имате заявка за кредит с тази дейност', 400);
    }

    // Създаване на нов кредит
    const credit = await Credit.create({
        student: student._id,
        pillar,
        activity: activity.trim(),
        description: description.trim(),
        status: 'pending'
    });

    // Известяване на учители за новата заявка за кредит
    const teachers = await User.find({ role: 'teacher' }).select('_id');

    if (teachers.length > 0) {
        const teacherIds = teachers.map(teacher => teacher._id);

        await notificationService.createBulkNotifications(teacherIds, {
            title: 'Нова заявка за кредит',
            message: `Ученикът ${student.user.firstName} ${student.user.lastName} заяви нов кредит за "${activity}".`,
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

// Валидиране на кредит (само за учители и администратори)
export const validateCredit = async (creditId, validationData, validatorId, validatorRole) => {
    const { status, validationNote } = validationData;

    // Проверка дали потребителят има права
    if (validatorRole !== 'teacher' && validatorRole !== 'admin') {
        throw new AppError('Нямате права да валидирате кредити', 403);
    }

    // Валидиране на статуса
    if (!['validated', 'rejected'].includes(status)) {
        throw new AppError('Невалиден статус за валидиране', 400);
    }

    // Намиране на кредита
    const credit = await Credit.findById(creditId).populate({
        path: 'student',
        populate: {
            path: 'user',
            select: 'firstName lastName'
        }
    });

    if (!credit) {
        throw new AppError('Кредитът не е намерен', 404);
    }

    // Проверка дали кредитът не е вече валидиран
    if (credit.status !== 'pending') {
        throw new AppError('Този кредит вече е бил обработен', 400);
    }

    // Обновяване на статуса
    credit.status = status;
    credit.validatedBy = validatorId;
    credit.validationDate = Date.now();

    // Ако има бележка за валидацията
    if (validationNote) {
        credit.validationNote = validationNote.trim();
    }

    await credit.save();

    // Известяване на ученика за промяната в статуса
    await notificationService.notifyAboutCreditStatusChange(credit, status);

    return credit;
};

// Изтриване на кредит
export const deleteCredit = async (creditId, currentUserId, currentUserRole) => {
    // Намиране на кредита
    const credit = await Credit.findById(creditId);

    if (!credit) {
        throw new AppError('Кредитът не е намерен', 404);
    }

    // Намиране на ученика
    const student = await Student.findById(credit.student);
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка дали потребителят има права (само собственикът или администратор)
    if (student.user.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да изтривате този кредит', 403);
    }

    // Проверка дали кредитът е валидиран
    if (credit.status === 'validated' && currentUserRole !== 'admin') {
        throw new AppError('Не можете да изтриете валидиран кредит', 400);
    }

    // Изтриване на кредита
    await Credit.deleteOne({ _id: creditId });

    return {
        message: 'Кредитът е изтрит успешно',
        creditId,
        activity: credit.activity
    };
};

// Получаване на всички кредити с филтри и пагинация (за администратори и учители)
export const getAllCredits = async (filters, currentUserRole) => {
    // Проверка дали потребителят има права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате всички кредити', 403);
    }

    const { page = 1, limit = 10, status, pillar, search, studentId } = filters;
    const skip = (page - 1) * limit;

    // Построяване на заявката
    let query = {};

    if (status && ['pending', 'validated', 'rejected'].includes(status)) {
        query.status = status;
    }

    if (pillar && ['Аз и другите', 'Мислене', 'Професия'].includes(pillar)) {
        query.pillar = pillar;
    }

    if (studentId) {
        query.student = studentId;
    }

    if (search) {
        query.$or = [
            { activity: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Извършване на заявката с пагинация
    const credits = await Credit.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
            path: 'student',
            select: 'grade specialization',
            populate: {
                path: 'user',
                select: 'firstName lastName'
            }
        })
        .populate('validatedBy', 'firstName lastName');

    // Общ брой на кредитите (за пагинация)
    const total = await Credit.countDocuments(query);

    // Статистики за текущата заявка
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

// Добавяне на нова категория кредити (за администратор)
export const addCreditCategory = async (categoryData, currentUserRole) => {
    // Проверка дали потребителят има права
    if (currentUserRole !== 'admin') {
        throw new AppError('Нямате права да добавяте категории кредити', 403);
    }

    const { pillar, name, description } = categoryData;

    // Валидиране на стълба
    if (!['Аз и другите', 'Мислене', 'Професия'].includes(pillar)) {
        throw new AppError('Невалиден стълб', 400);
    }

    // Проверка дали категорията вече съществува
    const existingCategory = await CreditCategory.findOne({
        name: name.trim(),
        pillar
    });

    if (existingCategory) {
        throw new AppError('Категория кредити с това име вече съществува в този стълб', 400);
    }

    // Създаване на нова категория
    const category = await CreditCategory.create({
        pillar,
        name: name.trim(),
        description: description ? description.trim() : ''
    });

    return category;
};

// Обновяване на категория кредити (за администратор)
export const updateCreditCategory = async (categoryId, updateData, currentUserRole) => {
    // Проверка дали потребителят има права
    if (currentUserRole !== 'admin') {
        throw new AppError('Нямате права да обновявате категории кредити', 403);
    }

    const { name, description, pillar } = updateData;

    const category = await CreditCategory.findById(categoryId);
    if (!category) {
        throw new AppError('Категорията не е намерена', 404);
    }

    // Обновяване на полетата
    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (pillar && ['Аз и другите', 'Мислене', 'Професия'].includes(pillar)) {
        category.pillar = pillar;
    }

    await category.save();
    return category;
};

// Изтриване на категория кредити (за администратор)
export const deleteCreditCategory = async (categoryId, currentUserRole) => {
    // Проверка дали потребителят има права
    if (currentUserRole !== 'admin') {
        throw new AppError('Нямате права да изтривате категории кредити', 403);
    }

    // Проверка дали категорията се използва
    const creditsWithCategory = await Credit.findOne({ category: categoryId });
    if (creditsWithCategory) {
        throw new AppError('Тази категория не може да бъде изтрита, защото се използва в кредити', 400);
    }

    // Изтриване на категорията
    const result = await CreditCategory.deleteOne({ _id: categoryId });

    if (result.deletedCount === 0) {
        throw new AppError('Категорията не е намерена', 404);
    }

    return { message: 'Категорията е изтрита успешно' };
};

// Получаване на статистики за кредити
export const getCreditsStatistics = async (filters = {}) => {
    const { startDate, endDate, pillar, studentGrade } = filters;

    // Построяване на заявката за филтриране
    let creditQuery = {};
    let studentQuery = {};

    if (startDate || endDate) {
        creditQuery.createdAt = {};
        if (startDate) creditQuery.createdAt.$gte = new Date(startDate);
        if (endDate) creditQuery.createdAt.$lte = new Date(endDate);
    }

    if (pillar && ['Аз и другите', 'Мислене', 'Професия'].includes(pillar)) {
        creditQuery.pillar = pillar;
    }

    if (studentGrade) {
        studentQuery.grade = studentGrade;
    }

    // Агрегация за статистики
    const pipeline = [
        { $match: creditQuery }
    ];

    // Ако има филтър по клас, добавяме lookup за студентите
    if (studentGrade) {
        pipeline.push(
            {
                $lookup: {
                    from: 'students',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'studentData'
                }
            },
            { $unwind: '$studentData' },
            { $match: { 'studentData.grade': studentGrade } }
        );
    }

    // Групиране за статистики
    pipeline.push(
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
    );

    const [stats] = await Credit.aggregate(pipeline);

    if (!stats) {
        return {
            total: 0,
            pending: 0,
            validated: 0,
            rejected: 0,
            byPillar: {
                'Аз и другите': 0,
                'Мислене': 0,
                'Професия': 0
            },
            validationRate: 0
        };
    }

    // Обработка на статистиките по стълб
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
    // Проверка дали потребителят има права
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

    // Намиране на кредитите
    const credits = await Credit.find({
        _id: { $in: creditIds },
        status: 'pending'
    }).populate({
        path: 'student',
        populate: {
            path: 'user',
            select: 'firstName lastName'
        }
    });

    if (credits.length === 0) {
        throw new AppError('Няма намерени кредити за валидиране', 404);
    }

    // Масово обновяване
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

    // Изпращане на известия за всички обработени кредити
    for (const credit of credits) {
        await notificationService.notifyAboutCreditStatusChange(credit, status);
    }

    return {
        message: `${result.modifiedCount} кредита са обработени успешно`,
        processedCount: result.modifiedCount,
        status
    };
};