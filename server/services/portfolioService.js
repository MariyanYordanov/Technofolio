// server/services/portfolioService.js
import Portfolio from '../models/Portfolio.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

// Получаване на портфолио на ученик
export const getStudentPortfolio = async (studentId, currentUserId, currentUserRole) => {
    // Проверка дали ученик съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка на права (собственик, учител или админ)
    if (student.user._id.toString() !== currentUserId &&
        currentUserRole !== 'teacher' &&
        currentUserRole !== 'admin') {
        throw new AppError('Нямате права да преглеждате това портфолио', 403);
    }

    // Намиране на портфолиото
    let portfolio = await Portfolio.findOne({ student: studentId })
        .populate('mentorId', 'firstName lastName specialization');

    // Ако няма портфолио, създаваме празно
    if (!portfolio) {
        portfolio = await Portfolio.create({
            student: studentId,
            experience: '',
            projects: '',
            recommendations: []
        });

        // Повторно зареждане с populate
        portfolio = await Portfolio.findById(portfolio._id)
            .populate('mentorId', 'firstName lastName specialization');
    }

    return portfolio;
};

// Обновяване на портфолио
export const updatePortfolio = async (studentId, portfolioData, currentUserId, currentUserRole) => {
    const { experience, projects, mentorId } = portfolioData;

    // Проверка дали ученика съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка дали потребителят има права (само собственикът или администратор)
    if (student.user._id.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да редактирате това портфолио', 403);
    }

    // Валидиране на mentorId ако е предоставен
    if (mentorId) {
        const mentor = await User.findById(mentorId);
        if (!mentor) {
            throw new AppError('Менторът не е намерен', 404);
        }
        if (mentor.role !== 'teacher' && mentor.role !== 'admin') {
            throw new AppError('Менторът трябва да бъде учител или администратор', 400);
        }
    }

    // Проверка дали портфолиото съществува
    let portfolio = await Portfolio.findOne({ student: studentId });

    if (portfolio) {
        // Обновяване на съществуващо портфолио
        if (experience !== undefined) portfolio.experience = experience;
        if (projects !== undefined) portfolio.projects = projects;
        if (mentorId !== undefined) portfolio.mentorId = mentorId;
        portfolio.updatedAt = Date.now();

        await portfolio.save();
    } else {
        // Създаване на ново портфолио
        portfolio = await Portfolio.create({
            student: studentId,
            experience: experience || '',
            projects: projects || '',
            mentorId: mentorId || null
        });
    }

    // Зареждане с populate данни
    portfolio = await Portfolio.findById(portfolio._id)
        .populate('mentorId', 'firstName lastName specialization');

    return portfolio;
};

// Добавяне на препоръка към портфолио
export const addRecommendation = async (studentId, recommendationData, currentUserId, currentUserRole) => {
    const { text, author } = recommendationData;

    // Валидиране на входните данни
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new AppError('Текстът на препоръката е задължителен', 400);
    }

    if (!author || typeof author !== 'string' || author.trim().length === 0) {
        throw new AppError('Авторът на препоръката е задължителен', 400);
    }

    if (text.trim().length > 1000) {
        throw new AppError('Текстът на препоръката не може да бъде по-дълъг от 1000 символа', 400);
    }

    if (author.trim().length > 100) {
        throw new AppError('Името на автора не може да бъде по-дълго от 100 символа', 400);
    }

    // Проверка дали ученика съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка на права (учител, админ или собственик на портфолиото)
    if (currentUserRole !== 'teacher' &&
        currentUserRole !== 'admin' &&
        student.user._id.toString() !== currentUserId) {
        throw new AppError('Нямате права да добавяте препоръки към това портфолио', 403);
    }

    // Намиране на портфолиото
    let portfolio = await Portfolio.findOne({ student: studentId });

    const recommendationObj = {
        text: text.trim(),
        author: author.trim(),
        date: new Date()
    };

    if (!portfolio) {
        // Създаване на ново портфолио, ако не съществува
        portfolio = await Portfolio.create({
            student: studentId,
            experience: '',
            projects: '',
            recommendations: [recommendationObj]
        });
    } else {
        // Проверка за дублиране на препоръки от същия автор
        const existingRecommendation = portfolio.recommendations.find(
            rec => rec.author.toLowerCase() === author.trim().toLowerCase()
        );

        if (existingRecommendation) {
            throw new AppError('Вече има препоръка от този автор', 400);
        }

        // Ограничение на броя препоръки
        if (portfolio.recommendations.length >= 10) {
            throw new AppError('Максималният брой препоръки е 10', 400);
        }

        // Добавяне на препоръка към съществуващо портфолио
        portfolio.recommendations.push(recommendationObj);
        portfolio.updatedAt = Date.now();
        await portfolio.save();
    }

    // Зареждане с populate данни
    portfolio = await Portfolio.findById(portfolio._id)
        .populate('mentorId', 'firstName lastName specialization');

    return portfolio;
};

// Изтриване на препоръка от портфолио
export const removeRecommendation = async (studentId, recommendationId, currentUserId, currentUserRole) => {
    // Валидиране на recommendationId
    if (!recommendationId || typeof recommendationId !== 'string') {
        throw new AppError('Невалиден ID на препоръката', 400);
    }

    // Проверка дали ученика съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка дали потребителят има права (само собственикът или администратор)
    if (student.user._id.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да редактирате това портфолио', 403);
    }

    // Намиране на портфолиото
    const portfolio = await Portfolio.findOne({ student: studentId });
    if (!portfolio) {
        throw new AppError('Портфолиото не е намерено', 404);
    }

    // Намиране на индекса на препоръката
    const recommendationIndex = portfolio.recommendations.findIndex(
        rec => rec._id.toString() === recommendationId
    );

    if (recommendationIndex === -1) {
        throw new AppError('Препоръката не е намерена', 404);
    }

    // Запазване на информация за препоръката преди премахването (за логове)
    const removedRecommendation = portfolio.recommendations[recommendationIndex];

    // Премахване на препоръката
    portfolio.recommendations.splice(recommendationIndex, 1);
    portfolio.updatedAt = Date.now();
    await portfolio.save();

    // Зареждане с populate данни
    const updatedPortfolio = await Portfolio.findById(portfolio._id)
        .populate('mentorId', 'firstName lastName specialization');

    return {
        portfolio: updatedPortfolio,
        removedRecommendation: {
            author: removedRecommendation.author,
            text: removedRecommendation.text.substring(0, 50) + '...' // Първите 50 символа за референция
        }
    };
};

// Получаване на портфолия на всички ученици (за учители и админи)
export const getAllPortfolios = async (filters, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате всички портфолия', 403);
    }

    const { page = 1, limit = 10, grade, search, hasMentor } = filters;
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

    if (search) {
        matchConditions.$or = [
            { 'userData.firstName': { $regex: search, $options: 'i' } },
            { 'userData.lastName': { $regex: search, $options: 'i' } },
            { 'studentData.specialization': { $regex: search, $options: 'i' } }
        ];
    }

    if (hasMentor !== undefined) {
        if (hasMentor === 'true') {
            matchConditions.mentorId = { $ne: null };
        } else if (hasMentor === 'false') {
            matchConditions.mentorId = null;
        }
    }

    if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
    }

    // Добавяне на mentor данни
    pipeline.push(
        {
            $lookup: {
                from: 'users',
                localField: 'mentorId',
                foreignField: '_id',
                as: 'mentorData'
            }
        },
        {
            $addFields: {
                mentorData: { $arrayElemAt: ['$mentorData', 0] }
            }
        }
    );

    // Сортиране и пагинация
    pipeline.push(
        { $sort: { 'studentData.grade': 1, 'userData.lastName': 1 } },
        { $skip: skip },
        { $limit: limit }
    );

    const portfolios = await Portfolio.aggregate(pipeline);

    // Общ брой за пагинация
    const totalPipeline = pipeline.slice(0, -2); // Без skip и limit
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Portfolio.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    return {
        portfolios,
        pagination: {
            count: portfolios.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    };
};

// Получаване на статистики за портфолия
export const getPortfoliosStatistics = async (currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате статистики', 403);
    }

    const [
        totalPortfolios,
        portfoliosWithMentors,
        portfoliosWithRecommendations,
        averageRecommendations
    ] = await Promise.all([
        Portfolio.countDocuments(),
        Portfolio.countDocuments({ mentorId: { $ne: null } }),
        Portfolio.countDocuments({ 'recommendations.0': { $exists: true } }),
        Portfolio.aggregate([
            {
                $group: {
                    _id: null,
                    avgRecommendations: { $avg: { $size: '$recommendations' } }
                }
            }
        ])
    ]);

    return {
        totalPortfolios,
        portfoliosWithMentors,
        portfoliosWithRecommendations,
        averageRecommendations: averageRecommendations.length > 0 ?
            Math.round(averageRecommendations[0].avgRecommendations * 100) / 100 : 0,
        mentorshipRate: totalPortfolios > 0 ?
            Math.round((portfoliosWithMentors / totalPortfolios) * 100) : 0
    };
};