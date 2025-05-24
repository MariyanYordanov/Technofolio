// server/services/goalsService.js
import Goals from '../models/Goals.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';

// Валидни категории цели
const VALID_CATEGORIES = [
    'personalDevelopment',
    'academicDevelopment',
    'profession',
    'extracurricular',
    'community',
    'internship'
];

// Помощна функция за заглавия на категории
const getCategoryTitle = (category) => {
    const titles = {
        personalDevelopment: 'Личностно развитие',
        academicDevelopment: 'Академично развитие',
        profession: 'Професия',
        extracurricular: 'Извънкласна дейност',
        community: 'Общност',
        internship: 'Стаж'
    };
    return titles[category] || category;
};

// Валидиране на категория
const validateCategory = (category) => {
    if (!VALID_CATEGORIES.includes(category)) {
        throw new AppError(`Невалидна категория. Допустими са: ${VALID_CATEGORIES.join(', ')}`, 400);
    }
};

// Получаване на целите на ученика
export const getStudentGoals = async (studentId, currentUserId, currentUserRole) => {
    // Проверка дали ученика съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка на права (собственик, учител или админ)
    if (student.user._id.toString() !== currentUserId &&
        currentUserRole !== 'teacher' &&
        currentUserRole !== 'admin') {
        throw new AppError('Нямате права да преглеждате тези цели', 403);
    }

    // Намиране на целите
    const goals = await Goals.find({ student: studentId }).sort({ updatedAt: -1 });

    // Форматиране на данните за клиентската част
    const formattedGoals = {};

    // Инициализиране на всички категории
    VALID_CATEGORIES.forEach(category => {
        formattedGoals[category] = {
            title: getCategoryTitle(category),
            description: '',
            activities: [],
            hasGoal: false,
            lastUpdated: null
        };
    });

    // Попълване с реални данни
    goals.forEach(goal => {
        if (VALID_CATEGORIES.includes(goal.category)) {
            formattedGoals[goal.category] = {
                title: getCategoryTitle(goal.category),
                description: goal.description,
                activities: goal.activities,
                hasGoal: true,
                lastUpdated: goal.updatedAt,
                goalId: goal._id
            };
        }
    });

    return {
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        studentGrade: student.grade || 'Неопределен',
        goals: formattedGoals,
        totalGoals: goals.length,
        completedCategories: goals.length
    };
};

// Създаване или обновяване на цел
export const updateGoal = async (studentId, category, goalData, currentUserId, currentUserRole) => {
    const { description, activities } = goalData;

    // Валидиране на категорията
    validateCategory(category);

    // Валидиране на входните данни
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        throw new AppError('Описанието е задължително', 400);
    }

    if (!activities || !Array.isArray(activities) || activities.length === 0) {
        throw new AppError('Дейностите са задължителни', 400);
    }

    if (description.trim().length > 1000) {
        throw new AppError('Описанието не може да бъде по-дълго от 1000 символа', 400);
    }

    // Валидиране на дейностите
    const validActivities = activities.filter(activity =>
        typeof activity === 'string' && activity.trim().length > 0
    );

    if (validActivities.length === 0) {
        throw new AppError('Трябва да има поне една валидна дейност', 400);
    }

    if (validActivities.some(activity => activity.trim().length > 200)) {
        throw new AppError('Всяка дейност не може да бъде по-дълга от 200 символа', 400);
    }

    // Проверка дали ученикът съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка дали потребителят има права (само собственикът или администратор)
    if (student.user._id.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да редактирате тази цел', 403);
    }

    // Проверка дали целта съществува
    let goal = await Goals.findOne({ student: studentId, category });

    if (goal) {
        // Обновяване на съществуваща цел
        goal.description = description.trim();
        goal.activities = validActivities.map(activity => activity.trim());
        goal.updatedAt = Date.now();
        await goal.save();
    } else {
        // Създаване на нова цел
        goal = await Goals.create({
            student: studentId,
            category,
            title: getCategoryTitle(category),
            description: description.trim(),
            activities: validActivities.map(activity => activity.trim())
        });
    }

    return goal;
};

// Изтриване на цел
export const deleteGoal = async (studentId, category, currentUserId, currentUserRole) => {
    // Валидиране на категорията
    validateCategory(category);

    // Проверка дали ученикът съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка дали потребителят има права (само собственикът или администратор)
    if (student.user._id.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да изтривате тази цел', 403);
    }

    // Намиране и изтриване на целта
    const result = await Goals.deleteOne({ student: studentId, category });

    if (result.deletedCount === 0) {
        throw new AppError('Целта не е намерена', 404);
    }

    return {
        message: `Целта за категория "${getCategoryTitle(category)}" е изтрита успешно`,
        category,
        categoryTitle: getCategoryTitle(category)
    };
};

// Получаване на всички цели (за учители и админи)
export const getAllGoals = async (filters, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате всички цели', 403);
    }

    const { page = 1, limit = 10, grade, category, search } = filters;
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
            { description: { $regex: search, $options: 'i' } },
            { activities: { $elemMatch: { $regex: search, $options: 'i' } } }
        ];
    }

    if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
    }

    // Добавяне на допълнителни полета
    pipeline.push({
        $addFields: {
            studentName: { $concat: ['$userData.firstName', ' ', '$userData.lastName'] },
            activitiesCount: { $size: '$activities' }
        }
    });

    // Сортиране и пагинация
    pipeline.push(
        { $sort: { 'studentData.grade': 1, 'userData.lastName': 1, category: 1 } },
        { $skip: skip },
        { $limit: limit }
    );

    const goals = await Goals.aggregate(pipeline);

    // Общ брой за пагинация
    const totalPipeline = pipeline.slice(0, -2); // Без skip и limit
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Goals.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    return {
        goals,
        pagination: {
            count: goals.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    };
};

// Получаване на статистики за цели
export const getGoalsStatistics = async (filters, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате статистики', 403);
    }

    const { grade } = filters;

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

    // Филтър по клас ако е зададен
    if (grade && ['8', '9', '10', '11', '12'].includes(grade)) {
        pipeline.push({
            $match: { 'studentData.grade': grade }
        });
    }

    // Статистики по категории
    const categoryStats = await Goals.aggregate([
        ...pipeline,
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                avgActivities: { $avg: { $size: '$activities' } }
            }
        },
        { $sort: { count: -1 } }
    ]);

    // Статистики по ученици
    const studentStats = await Goals.aggregate([
        ...pipeline,
        {
            $group: {
                _id: '$student',
                goalsCount: { $sum: 1 },
                categories: { $addToSet: '$category' }
            }
        },
        {
            $group: {
                _id: null,
                totalStudentsWithGoals: { $sum: 1 },
                avgGoalsPerStudent: { $avg: '$goalsCount' },
                studentsWithAllCategories: {
                    $sum: {
                        $cond: [
                            { $eq: [{ $size: '$categories' }, VALID_CATEGORIES.length] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    // Общи статистики
    const totalGoals = await Goals.countDocuments();
    const totalStudents = await Student.countDocuments(
        grade ? { grade } : {}
    );

    // Форматиране на резултатите
    const stats = {
        overview: {
            totalGoals,
            totalStudents,
            studentsWithGoals: studentStats.length > 0 ? studentStats[0].totalStudentsWithGoals : 0,
            averageGoalsPerStudent: studentStats.length > 0 ?
                Math.round(studentStats[0].avgGoalsPerStudent * 100) / 100 : 0,
            studentsWithAllCategories: studentStats.length > 0 ? studentStats[0].studentsWithAllCategories : 0,
            completionRate: totalStudents > 0 ?
                Math.round(((studentStats.length > 0 ? studentStats[0].totalStudentsWithGoals : 0) / totalStudents) * 100) : 0
        },
        byCategory: VALID_CATEGORIES.map(category => {
            const categoryData = categoryStats.find(stat => stat._id === category);
            return {
                category,
                title: getCategoryTitle(category),
                count: categoryData ? categoryData.count : 0,
                averageActivities: categoryData ?
                    Math.round(categoryData.avgActivities * 100) / 100 : 0
            };
        })
    };

    return stats;
};

// Масово обновяване на цели
export const bulkUpdateGoals = async (updates, currentUserId, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin') {
        throw new AppError('Нямате права за масово обновяване на цели', 403);
    }

    if (!Array.isArray(updates) || updates.length === 0) {
        throw new AppError('Невалидни данни за обновяване', 400);
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
        try {
            const { studentId, category, ...goalData } = update;
            const result = await updateGoal(studentId, category, goalData, currentUserId, currentUserRole);
            results.push({
                studentId,
                category,
                success: true,
                goalId: result._id
            });
        } catch (error) {
            errors.push({
                studentId: update.studentId,
                category: update.category,
                success: false,
                error: error.message
            });
        }
    }

    return {
        success: results.length,
        failed: errors.length,
        results,
        errors
    };
};

// Експортиране на цели за отчет
export const exportGoalsData = async (filters, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права за този експорт', 403);
    }

    const { grade, category } = filters;

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
            categoryTitle: getCategoryTitle('$category'),
            description: 1,
            activities: {
                $reduce: {
                    input: '$activities',
                    initialValue: '',
                    in: { $concat: ['$$value', { $cond: [{ $eq: ['$$value', ''] }, '', '; '] }, '$$this'] }
                }
            },
            activitiesCount: { $size: '$activities' },
            lastUpdated: '$updatedAt'
        }
    });

    pipeline.push({ $sort: { grade: 1, studentName: 1, category: 1 } });

    const exportData = await Goals.aggregate(pipeline);

    return exportData;
};