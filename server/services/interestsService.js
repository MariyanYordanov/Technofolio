// server/services/interestsService.js
import Interest from '../models/Interest.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';

// Получаване на интересите на ученика
export const getStudentInterests = async (studentId, currentUserId, currentUserRole) => {
    // Проверка дали ученика съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка на права (собственик, учител или админ)
    if (student.user._id.toString() !== currentUserId &&
        currentUserRole !== 'teacher' &&
        currentUserRole !== 'admin') {
        throw new AppError('Нямате права да преглеждате тези интереси', 403);
    }

    // Намиране на интересите
    let interests = await Interest.findOne({ student: studentId });

    // Ако няма записани интереси, връщаме празен обект
    if (!interests) {
        interests = {
            student: studentId,
            interests: [],
            hobbies: [],
            updatedAt: null
        };
    }

    return {
        interests,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        studentGrade: student.grade || 'Неопределен'
    };
};

// Обновяване на интересите на ученика
export const updateInterests = async (studentId, interestsData, currentUserId, currentUserRole) => {
    const { interests, hobbies } = interestsData;

    // Валидиране на входните данни
    if (interests !== undefined && !Array.isArray(interests)) {
        throw new AppError('Интересите трябва да бъдат масив', 400);
    }

    if (hobbies !== undefined && !Array.isArray(hobbies)) {
        throw new AppError('Хобитата трябва да бъдат масив', 400);
    }

    // Валидиране на структурата на интересите
    if (interests && interests.length > 0) {
        for (const interest of interests) {
            if (!interest || typeof interest !== 'object') {
                throw new AppError('Всеки интерес трябва да бъде обект', 400);
            }

            if (!interest.category || typeof interest.category !== 'string' || interest.category.trim().length === 0) {
                throw new AppError('Категорията на интереса е задължителна', 400);
            }

            if (!interest.subcategory || typeof interest.subcategory !== 'string' || interest.subcategory.trim().length === 0) {
                throw new AppError('Подкатегорията на интереса е задължителна', 400);
            }

            if (interest.category.trim().length > 100) {
                throw new AppError('Категорията не може да бъде по-дълга от 100 символа', 400);
            }

            if (interest.subcategory.trim().length > 100) {
                throw new AppError('Подкатегорията не може да бъде по-дълга от 100 символа', 400);
            }
        }

        // Проверка за дублиращи се интереси
        const uniqueInterests = new Set();
        for (const interest of interests) {
            const key = `${interest.category.trim().toLowerCase()}-${interest.subcategory.trim().toLowerCase()}`;
            if (uniqueInterests.has(key)) {
                throw new AppError('Има дублиращи се интереси', 400);
            }
            uniqueInterests.add(key);
        }

        // Ограничение на броя интереси
        if (interests.length > 20) {
            throw new AppError('Максималният брой интереси е 20', 400);
        }
    }

    // Валидиране на хобитата
    if (hobbies && hobbies.length > 0) {
        for (const hobby of hobbies) {
            if (!hobby || typeof hobby !== 'string' || hobby.trim().length === 0) {
                throw new AppError('Всяко хоби трябва да бъде непразен текст', 400);
            }

            if (hobby.trim().length > 100) {
                throw new AppError('Хобито не може да бъде по-дълго от 100 символа', 400);
            }
        }

        // Проверка за дублиращи се хобита
        const uniqueHobbies = new Set();
        for (const hobby of hobbies) {
            const trimmedHobby = hobby.trim().toLowerCase();
            if (uniqueHobbies.has(trimmedHobby)) {
                throw new AppError('Има дублиращи се хобита', 400);
            }
            uniqueHobbies.add(trimmedHobby);
        }

        // Ограничение на броя хобита
        if (hobbies.length > 15) {
            throw new AppError('Максималният брой хобита е 15', 400);
        }
    }

    // Проверка дали ученика съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка дали потребителят има права (само собственикът или администратор)
    if (student.user._id.toString() !== currentUserId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да редактирате тези интереси', 403);
    }

    // Проверка дали интересите съществуват
    let interestsDoc = await Interest.findOne({ student: studentId });

    // Подготовка на данните за запазване
    const processedInterests = interests ? interests.map(interest => ({
        category: interest.category.trim(),
        subcategory: interest.subcategory.trim()
    })) : [];

    const processedHobbies = hobbies ? hobbies.map(hobby => hobby.trim()) : [];

    if (interestsDoc) {
        // Обновяване на съществуващи интереси
        if (interests !== undefined) {
            interestsDoc.interests = processedInterests;
        }
        if (hobbies !== undefined) {
            interestsDoc.hobbies = processedHobbies;
        }
        interestsDoc.updatedAt = Date.now();
        await interestsDoc.save();
    } else {
        // Създаване на нови интереси
        interestsDoc = await Interest.create({
            student: studentId,
            interests: processedInterests,
            hobbies: processedHobbies
        });
    }

    return interestsDoc;
};

// Получаване на всички интереси (за учители и админи)
export const getAllInterests = async (filters, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате всички интереси', 403);
    }

    const { page = 1, limit = 10, grade, search, hasInterests, hasHobbies } = filters;
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
            { 'interests.category': { $regex: search, $options: 'i' } },
            { 'interests.subcategory': { $regex: search, $options: 'i' } },
            { 'hobbies': { $elemMatch: { $regex: search, $options: 'i' } } }
        ];
    }

    if (hasInterests !== undefined) {
        if (hasInterests === 'true') {
            matchConditions['interests.0'] = { $exists: true };
        } else if (hasInterests === 'false') {
            matchConditions.interests = { $size: 0 };
        }
    }

    if (hasHobbies !== undefined) {
        if (hasHobbies === 'true') {
            matchConditions['hobbies.0'] = { $exists: true };
        } else if (hasHobbies === 'false') {
            matchConditions.hobbies = { $size: 0 };
        }
    }

    if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
    }

    // Добавяне на допълнителни полета
    pipeline.push({
        $addFields: {
            studentName: { $concat: ['$userData.firstName', ' ', '$userData.lastName'] },
            interestsCount: { $size: '$interests' },
            hobbiesCount: { $size: '$hobbies' }
        }
    });

    // Сортиране и пагинация
    pipeline.push(
        { $sort: { 'studentData.grade': 1, 'userData.lastName': 1 } },
        { $skip: skip },
        { $limit: limit }
    );

    const interests = await Interest.aggregate(pipeline);

    // Общ брой за пагинация
    const totalPipeline = pipeline.slice(0, -2); // Без skip и limit
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Interest.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    return {
        interests,
        pagination: {
            count: interests.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    };
};

// Получаване на статистики за интереси
export const getInterestsStatistics = async (filters, currentUserRole) => {
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

    // Статистики за интереси по категории
    const interestCategoriesStats = await Interest.aggregate([
        ...pipeline,
        { $unwind: '$interests' },
        {
            $group: {
                _id: '$interests.category',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 } // Топ 10 категории
    ]);

    // Статистики за подкатегории
    const interestSubcategoriesStats = await Interest.aggregate([
        ...pipeline,
        { $unwind: '$interests' },
        {
            $group: {
                _id: {
                    category: '$interests.category',
                    subcategory: '$interests.subcategory'
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 15 } // Топ 15 подкатегории
    ]);

    // Най-популярни хобита
    const hobbiesStats = await Interest.aggregate([
        ...pipeline,
        { $unwind: '$hobbies' },
        {
            $group: {
                _id: { $toLower: '$hobbies' },
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 10 } // Топ 10 хобита
    ]);

    // Общи статистики
    const overviewStats = await Interest.aggregate([
        ...pipeline,
        {
            $group: {
                _id: null,
                totalStudentsWithInterests: { $sum: 1 },
                avgInterestsPerStudent: { $avg: { $size: '$interests' } },
                avgHobbiesPerStudent: { $avg: { $size: '$hobbies' } },
                studentsWithInterests: {
                    $sum: {
                        $cond: [{ $gt: [{ $size: '$interests' }, 0] }, 1, 0]
                    }
                },
                studentsWithHobbies: {
                    $sum: {
                        $cond: [{ $gt: [{ $size: '$hobbies' }, 0] }, 1, 0]
                    }
                }
            }
        }
    ]);

    // Общ брой студенти
    const totalStudents = await Student.countDocuments(
        grade ? { grade } : {}
    );

    // Форматиране на резултатите
    const overview = overviewStats.length > 0 ? overviewStats[0] : {
        totalStudentsWithInterests: 0,
        avgInterestsPerStudent: 0,
        avgHobbiesPerStudent: 0,
        studentsWithInterests: 0,
        studentsWithHobbies: 0
    };

    const stats = {
        overview: {
            totalStudents,
            studentsWithData: overview.totalStudentsWithInterests,
            studentsWithInterests: overview.studentsWithInterests,
            studentsWithHobbies: overview.studentsWithHobbies,
            averageInterestsPerStudent: Math.round(overview.avgInterestsPerStudent * 100) / 100,
            averageHobbiesPerStudent: Math.round(overview.avgHobbiesPerStudent * 100) / 100,
            participationRate: totalStudents > 0 ?
                Math.round((overview.totalStudentsWithInterests / totalStudents) * 100) : 0
        },
        topCategories: interestCategoriesStats.map(item => ({
            category: item._id,
            count: item.count
        })),
        topSubcategories: interestSubcategoriesStats.map(item => ({
            category: item._id.category,
            subcategory: item._id.subcategory,
            count: item.count
        })),
        topHobbies: hobbiesStats.map(item => ({
            hobby: item._id,
            count: item.count
        }))
    };

    return stats;
};

// Експортиране на интереси за отчет
export const exportInterestsData = async (filters, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права за този експорт', 403);
    }

    const { grade } = filters;

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
    if (grade) {
        pipeline.push({
            $match: { 'studentData.grade': grade }
        });
    }

    // Форматиране за експорт
    pipeline.push({
        $project: {
            studentName: { $concat: ['$userData.firstName', ' ', '$userData.lastName'] },
            grade: '$studentData.grade',
            specialization: '$studentData.specialization',
            interests: {
                $map: {
                    input: '$interests',
                    as: 'interest',
                    in: { $concat: ['$$interest.category', ' - ', '$$interest.subcategory'] }
                }
            },
            interestsText: {
                $reduce: {
                    input: '$interests',
                    initialValue: '',
                    in: {
                        $concat: [
                            '$$value',
                            { $cond: [{ $eq: ['$$value', ''] }, '', '; '] },
                            '$$this.category',
                            ' - ',
                            '$$this.subcategory'
                        ]
                    }
                }
            },
            hobbies: 1,
            hobbiesText: {
                $reduce: {
                    input: '$hobbies',
                    initialValue: '',
                    in: { $concat: ['$$value', { $cond: [{ $eq: ['$$value', ''] }, '', '; '] }, '$$this'] }
                }
            },
            interestsCount: { $size: '$interests' },
            hobbiesCount: { $size: '$hobbies' },
            lastUpdated: {
                $dateToString: {
                    format: '%d.%m.%Y',
                    date: '$updatedAt'
                }
            }
        }
    });

    pipeline.push({ $sort: { grade: 1, studentName: 1 } });

    const exportData = await Interest.aggregate(pipeline);

    return exportData;
};

// Получаване на популярни интереси и хобита
export const getPopularInterestsAndHobbies = async (currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате тази информация', 403);
    }

    // Популярни категории интереси
    const popularCategories = await Interest.aggregate([
        { $unwind: '$interests' },
        {
            $group: {
                _id: '$interests.category',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
    ]);

    // Популярни хобита
    const popularHobbies = await Interest.aggregate([
        { $unwind: '$hobbies' },
        {
            $group: {
                _id: { $toLower: '$hobbies' },
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 20 }
    ]);

    return {
        categories: popularCategories.map(item => ({
            name: item._id,
            count: item.count
        })),
        hobbies: popularHobbies.map(item => ({
            name: item._id,
            count: item.count
        }))
    };
};