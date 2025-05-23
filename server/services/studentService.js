// server/services/studentService.js
import Student from '../models/Student.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

// Създаване на ученически профил
export const createStudentProfile = async (userData, userId) => {
    const { grade, specialization, averageGrade, imageUrl } = userData;

    // Проверка дали потребителят вече има профил
    const existingStudent = await Student.findOne({ user: userId });
    if (existingStudent) {
        throw new AppError('Потребителят вече има ученически профил', 400);
    }

    // Проверка дали потребителят съществува и е студент
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    if (user.role !== 'student') {
        throw new AppError('Само ученици могат да създават ученически профил', 403);
    }

    // Създаване на профил
    const studentProfile = await Student.create({
        user: userId,
        grade,
        specialization,
        averageGrade: averageGrade || 2,
        imageUrl: imageUrl || '/default-avatar.png'
    });

    return studentProfile;
};

// Получаване на ученически профил по userId
export const getStudentProfileByUserId = async (userId) => {
    const student = await Student.findOne({ user: userId })
        .populate('user', 'firstName lastName email role');

    if (!student) {
        throw new AppError('Ученическият профил не е намерен', 404);
    }

    return student;
};

// Получаване на текущия ученически профил
export const getCurrentStudentProfile = async (userId) => {
    return await getStudentProfileByUserId(userId);
};

// Получаване на ученически профил по studentId
export const getStudentProfileById = async (studentId, currentUserId, currentUserRole) => {
    const student = await Student.findById(studentId)
        .populate('user', 'firstName lastName email role');

    if (!student) {
        throw new AppError('Ученическият профил не е намерен', 404);
    }

    // Проверка на права (собственик, учител или админ)
    if (student.user._id.toString() !== currentUserId &&
        currentUserRole !== 'teacher' &&
        currentUserRole !== 'admin') {
        throw new AppError('Нямате права да преглеждате този профил', 403);
    }

    return student;
};

// Обновяване на ученически профил
export const updateStudentProfile = async (profileData, userId, currentUserRole) => {
    const { grade, specialization, averageGrade, imageUrl } = profileData;

    // Намиране на профила
    const student = await Student.findOne({ user: userId });
    if (!student) {
        throw new AppError('Ученическият профил не е намерен', 404);
    }

    // Проверка на права (само собственикът или админ)
    if (student.user.toString() !== userId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да редактирате този профил', 403);
    }

    // Валидиране на данни
    if (grade && !['8', '9', '10', '11', '12'].includes(grade)) {
        throw new AppError('Невалиден клас', 400);
    }

    if (averageGrade && (averageGrade < 2 || averageGrade > 6)) {
        throw new AppError('Средният успех трябва да е между 2 и 6', 400);
    }

    // Обновяване на полетата
    if (grade) student.grade = grade;
    if (specialization) student.specialization = specialization;
    if (averageGrade !== undefined) student.averageGrade = averageGrade;
    if (imageUrl !== undefined) student.imageUrl = imageUrl;

    await student.save();
    return student;
};

// Обновяване на профил по studentId (за админи/учители)
export const updateStudentProfileById = async (studentId, profileData, currentUserId, currentUserRole) => {
    const { grade, specialization, averageGrade, imageUrl } = profileData;

    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да редактирате ученически профили', 403);
    }

    // Намиране на профила
    const student = await Student.findById(studentId);
    if (!student) {
        throw new AppError('Ученическият профил не е намерен', 404);
    }

    // Валидиране на данни
    if (grade && !['8', '9', '10', '11', '12'].includes(grade)) {
        throw new AppError('Невалиден клас', 400);
    }

    if (averageGrade && (averageGrade < 2 || averageGrade > 6)) {
        throw new AppError('Средният успех трябва да е между 2 и 6', 400);
    }

    if (specialization && typeof specialization !== 'string') {
        throw new AppError('Специалността трябва да бъде текст', 400);
    }

    // Обновяване на полетата
    if (grade) student.grade = grade;
    if (specialization) student.specialization = specialization;
    if (averageGrade !== undefined) student.averageGrade = averageGrade;
    if (imageUrl !== undefined) student.imageUrl = imageUrl;

    await student.save();
    return student;
};

// Изтриване на ученически профил
export const deleteStudentProfile = async (userId, currentUserRole) => {
    // Намиране на профила
    const student = await Student.findOne({ user: userId });
    if (!student) {
        throw new AppError('Ученическият профил не е намерен', 404);
    }

    // Проверка на права (само собственикът или админ)
    if (student.user.toString() !== userId && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да изтривате този профил', 403);
    }

    // Изтриване на профила
    await Student.deleteOne({ _id: student._id });

    return {
        message: 'Ученическият профил е изтрит успешно',
        deletedProfileId: student._id
    };
};

// Изтриване на профил по studentId (за админи)
export const deleteStudentProfileById = async (studentId, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin') {
        throw new AppError('Нямате права да изтривате ученически профили', 403);
    }

    // Намиране на профила
    const student = await Student.findById(studentId);
    if (!student) {
        throw new AppError('Ученическият профил не е намерен', 404);
    }

    // Изтриване на профила
    await Student.deleteOne({ _id: studentId });

    return {
        message: 'Ученическият профил е изтрит успешно',
        deletedProfileId: studentId
    };
};

// Получаване на всички ученици (за учители и админи)
export const getAllStudents = async (filters, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате всички ученици', 403);
    }

    const { page = 1, limit = 10, grade, specialization, search } = filters;
    const skip = (page - 1) * limit;

    // Построяване на query
    let query = {};

    if (grade && ['8', '9', '10', '11', '12'].includes(grade)) {
        query.grade = grade;
    }

    if (specialization) {
        query.specialization = { $regex: specialization, $options: 'i' };
    }

    // Aggregate за търсене в user данни
    let pipeline = [
        { $match: query },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userData'
            }
        },
        { $unwind: '$userData' }
    ];

    // Добавяне на търсене ако е необходимо
    if (search) {
        pipeline.push({
            $match: {
                $or: [
                    { 'userData.firstName': { $regex: search, $options: 'i' } },
                    { 'userData.lastName': { $regex: search, $options: 'i' } },
                    { 'userData.email': { $regex: search, $options: 'i' } },
                    { specialization: { $regex: search, $options: 'i' } }
                ]
            }
        });
    }

    // Сортиране и пагинация
    pipeline.push(
        { $sort: { grade: 1, 'userData.lastName': 1 } },
        { $skip: skip },
        { $limit: limit }
    );

    const students = await Student.aggregate(pipeline);

    // Общ брой за пагинация
    const totalPipeline = [...pipeline.slice(0, -2)]; // Без skip и limit
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Student.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    return {
        students,
        pagination: {
            count: students.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    };
};

// Получаване на статистики за ученици
export const getStudentsStatistics = async (currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате статистики', 403);
    }

    const [
        totalStudents,
        studentsByGrade,
        averageGrades
    ] = await Promise.all([
        Student.countDocuments(),
        Student.aggregate([
            {
                $group: {
                    _id: '$grade',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        Student.aggregate([
            {
                $group: {
                    _id: '$grade',
                    averageGrade: { $avg: '$averageGrade' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])
    ]);

    return {
        totalStudents,
        byGrade: studentsByGrade.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {}),
        averageGrades: averageGrades.map(item => ({
            grade: item._id,
            average: Math.round(item.averageGrade * 100) / 100,
            studentCount: item.count
        }))
    };
};

// Търсене на ученици
export const searchStudents = async (searchCriteria, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да търсите ученици', 403);
    }

    const { query, grade, minAverageGrade, maxAverageGrade } = searchCriteria;

    let pipeline = [
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userData'
            }
        },
        { $unwind: '$userData' }
    ];

    // Построяване на match условия
    let matchConditions = {};

    if (grade) {
        matchConditions.grade = grade;
    }

    if (minAverageGrade !== undefined) {
        matchConditions.averageGrade = { $gte: minAverageGrade };
    }

    if (maxAverageGrade !== undefined) {
        if (matchConditions.averageGrade) {
            matchConditions.averageGrade.$lte = maxAverageGrade;
        } else {
            matchConditions.averageGrade = { $lte: maxAverageGrade };
        }
    }

    if (query) {
        matchConditions.$or = [
            { 'userData.firstName': { $regex: query, $options: 'i' } },
            { 'userData.lastName': { $regex: query, $options: 'i' } },
            { 'userData.email': { $regex: query, $options: 'i' } },
            { specialization: { $regex: query, $options: 'i' } }
        ];
    }

    pipeline.push(
        { $match: matchConditions },
        { $sort: { grade: 1, 'userData.lastName': 1 } },
        { $limit: 50 } // Ограничение за performance
    );

    const students = await Student.aggregate(pipeline);

    return students;
};