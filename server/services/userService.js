// server/services/userService.js - Updated with all embedded data functions
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { compareIds } from '../utils/helpers.js';
import * as notificationService from './notificationService.js';

// ===== ПОМОЩНИ ФУНКЦИИ =====

// Проверка дали потребителят е ученик
const ensureUserIsStudent = (user) => {
    if (user.role !== 'student') {
        throw new AppError('Потребителят не е ученик', 400);
    }
};

// Проверка за права за достъп
const checkAccessRights = (user, currentUserId, currentUserRole) => {
    const isOwner = compareIds(user._id, currentUserId);
    const isTeacherOrAdmin = currentUserRole === 'teacher' || currentUserRole === 'admin';

    if (!isOwner && !isTeacherOrAdmin) {
        throw new AppError('Нямате права за достъп до тази информация', 403);
    }

    return { isOwner, isTeacherOrAdmin };
};

// ===== ОСНОВНИ USER ФУНКЦИИ =====

// Получаване на всички потребители
export const getAllUsers = async (filters = {}) => {
    const { page = 1, limit = 10, role, search, grade, specialization } = filters;
    const skip = (page - 1) * limit;

    let query = {};

    if (role) {
        query.role = role;
    }

    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    if (grade) {
        query['studentInfo.grade'] = grade;
    }

    if (specialization) {
        query['studentInfo.specialization'] = { $regex: specialization, $options: 'i' };
    }

    const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await User.countDocuments(query);

    return {
        users,
        pagination: {
            count: users.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    };
};

// Получаване на потребител по ID
export const getUserById = async (id) => {
    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    return { user };
};

// Създаване на нов потребител
export const createUser = async (userData) => {
    const { email, password, firstName, lastName, role, studentInfo } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('Потребител с този имейл вече съществува', 400);
    }

    const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role: role || 'student',
        studentInfo: role === 'student' ? studentInfo : undefined,
        emailConfirmed: true
    });

    return { user };
};

// Обновяване на потребител
export const updateUser = async (id, updateData, currentUser) => {
    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    // Проверка за права
    if (user.role === 'admin' && currentUser._id.toString() !== user._id.toString()) {
        throw new AppError('Администратор не може да променя друг администратор', 403);
    }

    const { firstName, lastName, imageUrl } = updateData;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (imageUrl) user.imageUrl = imageUrl;

    await user.save();

    return { user };
};

// Изтриване на потребител
export const deleteUser = async (id) => {
    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    if (user.role === 'admin') {
        throw new AppError('Администратор не може да бъде изтрит', 403);
    }

    await User.deleteOne({ _id: id });

    return {
        message: 'Потребителят е успешно изтрит',
        deletedUserId: id
    };
};

// ===== УЧЕНИЧЕСКИ ФУНКЦИИ =====

// Получаване на всички ученици
export const getAllStudents = async (filters = {}) => {
    const { page = 1, limit = 10, grade, specialization, search } = filters;
    const skip = (page - 1) * limit;

    let query = { role: 'student' };

    if (grade) {
        query['studentInfo.grade'] = grade;
    }

    if (specialization) {
        query['studentInfo.specialization'] = { $regex: specialization, $options: 'i' };
    }

    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const students = await User.find(query)
        .sort({ 'studentInfo.grade': 1, lastName: 1 })
        .skip(skip)
        .limit(limit);

    const total = await User.countDocuments(query);

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

// Обновяване на ученически данни
export const updateStudentInfo = async (id, updateData, currentUser) => {
    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);
    checkAccessRights(user, currentUser._id, currentUser.role);

    const { grade, specialization, averageGrade } = updateData;

    if (!user.studentInfo) {
        user.studentInfo = {};
    }

    if (grade) user.studentInfo.grade = grade;
    if (specialization) user.studentInfo.specialization = specialization;
    if (averageGrade !== undefined) user.studentInfo.averageGrade = averageGrade;

    await user.save();

    return { user };
};

// Получаване на статистики за ученици
export const getStudentsStatistics = async () => {
    const totalStudents = await User.countDocuments({ role: 'student' });

    const byGrade = await User.aggregate([
        { $match: { role: 'student' } },
        { $group: { _id: '$studentInfo.grade', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);

    const withHighAbsences = await User.findStudentsWithHighAbsences(0.8);

    return {
        totalStudents,
        byGrade,
        withHighAbsences: withHighAbsences.length
    };
};

// ===== ЦЕЛИ (GOALS) =====

export const getUserGoals = async (userId, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);
    checkAccessRights(user, currentUserId, currentUserRole);

    return {
        goals: user.goals || [],
        totalGoals: user.goals ? user.goals.length : 0
    };
};

export const updateUserGoal = async (userId, category, goalData, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);
    const { isOwner, isTeacherOrAdmin } = checkAccessRights(user, currentUserId, currentUserRole);

    // Само собственикът или админ може да редактира цели
    if (!isOwner && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да редактирате целите', 403);
    }

    const { title, description, activities } = goalData;

    // Използваме вградения метод
    await user.setGoal(category, {
        title,
        description,
        activities: activities || []
    });

    const goal = user.goals.find(g => g.category === category);

    return { goal };
};

export const deleteUserGoal = async (userId, category, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);
    const { isOwner } = checkAccessRights(user, currentUserId, currentUserRole);

    if (!isOwner && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да изтривате цели', 403);
    }

    user.goals = user.goals.filter(g => g.category !== category);
    await user.save();

    return {
        message: `Целта за категория "${category}" е изтрита успешно`
    };
};

// ===== ИНТЕРЕСИ И ХОБИТА =====

export const getUserInterests = async (userId, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);
    checkAccessRights(user, currentUserId, currentUserRole);

    return {
        interests: user.interests || [],
        hobbies: user.hobbies || []
    };
};

export const updateUserInterests = async (userId, updateData, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);
    const { isOwner } = checkAccessRights(user, currentUserId, currentUserRole);

    if (!isOwner && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да редактирате интересите', 403);
    }

    const { interests, hobbies } = updateData;

    if (interests) {
        user.interests = interests;
    }

    if (hobbies) {
        user.hobbies = hobbies;
    }

    await user.save();

    return {
        interests: user.interests,
        hobbies: user.hobbies
    };
};

// ===== ПОРТФОЛИО =====

export const getUserPortfolio = async (userId, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);
    checkAccessRights(user, currentUserId, currentUserRole);

    return {
        portfolio: user.portfolio || {
            experience: '',
            projects: '',
            recommendations: []
        }
    };
};

export const updateUserPortfolio = async (userId, updateData, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);
    const { isOwner } = checkAccessRights(user, currentUserId, currentUserRole);

    if (!isOwner && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да редактирате портфолиото', 403);
    }

    const { experience, projects, mentorId } = updateData;

    if (!user.portfolio) {
        user.portfolio = {
            experience: '',
            projects: '',
            recommendations: []
        };
    }

    if (experience !== undefined) user.portfolio.experience = experience;
    if (projects !== undefined) user.portfolio.projects = projects;
    if (mentorId !== undefined) user.portfolio.mentorId = mentorId;

    await user.save();

    return { portfolio: user.portfolio };
};

export const addPortfolioRecommendation = async (userId, recommendationData, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);

    // Само учители и админи могат да добавят препоръки
    if (currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
        throw new AppError('Само учители могат да добавят препоръки', 403);
    }

    const { text, author } = recommendationData;

    await user.addRecommendation(text, author);

    const newRecommendation = user.portfolio.recommendations[user.portfolio.recommendations.length - 1];

    return { recommendation: newRecommendation };
};

export const removePortfolioRecommendation = async (userId, recommendationId, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);

    // Само админи могат да изтриват препоръки
    if (currentUserRole !== 'admin') {
        throw new AppError('Само администратори могат да изтриват препоръки', 403);
    }

    if (!user.portfolio || !user.portfolio.recommendations) {
        throw new AppError('Няма препоръки за изтриване', 404);
    }

    const initialLength = user.portfolio.recommendations.length;
    user.portfolio.recommendations = user.portfolio.recommendations.filter(
        r => r._id.toString() !== recommendationId
    );

    if (user.portfolio.recommendations.length === initialLength) {
        throw new AppError('Препоръката не е намерена', 404);
    }

    await user.save();

    return {
        message: 'Препоръката е изтрита успешно'
    };
};

// ===== САНКЦИИ И ОТСЪСТВИЯ =====

export const getUserSanctions = async (userId, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);
    checkAccessRights(user, currentUserId, currentUserRole);

    return {
        sanctions: user.sanctions || {
            absences: { excused: 0, unexcused: 0, maxAllowed: 150 },
            schooloRemarks: 0,
            activeSanctions: []
        }
    };
};

export const updateUserAbsences = async (userId, updateData, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);

    // Само учители и админи могат да обновяват отсъствия
    if (currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да обновявате отсъствия', 403);
    }

    const { excused, unexcused, maxAllowed, schooloRemarks } = updateData;

    if (!user.sanctions) {
        user.sanctions = {
            absences: { excused: 0, unexcused: 0, maxAllowed: 150 },
            schooloRemarks: 0,
            activeSanctions: []
        };
    }

    if (excused !== undefined) user.sanctions.absences.excused = excused;
    if (unexcused !== undefined) user.sanctions.absences.unexcused = unexcused;
    if (maxAllowed !== undefined) user.sanctions.absences.maxAllowed = maxAllowed;
    if (schooloRemarks !== undefined) user.sanctions.schooloRemarks = schooloRemarks;

    await user.save();

    // Проверка за високи отсъствия и известяване
    const totalAbsences = user.sanctions.absences.excused + user.sanctions.absences.unexcused;
    const absenceRate = totalAbsences / user.sanctions.absences.maxAllowed;

    if (absenceRate >= 0.8) {
        await notificationService.createNotification({
            recipient: user._id,
            title: 'Внимание: Високи отсъствия',
            message: `Имате ${totalAbsences} от ${user.sanctions.absences.maxAllowed} допустими отсъствия.`,
            type: 'warning',
            category: 'absence',
            sendEmail: true
        });
    }

    return { sanctions: user.sanctions };
};

export const addUserSanction = async (userId, sanctionData, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);

    // Само учители и админи могат да добавят санкции
    if (currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да добавяте санкции', 403);
    }

    const { type, reason, startDate, endDate, issuedBy } = sanctionData;

    if (!user.sanctions) {
        user.sanctions = {
            absences: { excused: 0, unexcused: 0, maxAllowed: 150 },
            schooloRemarks: 0,
            activeSanctions: []
        };
    }

    const newSanction = {
        type,
        reason,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        issuedBy
    };

    user.sanctions.activeSanctions.push(newSanction);
    await user.save();

    // Известяване за новата санкция
    await notificationService.createNotification({
        recipient: user._id,
        title: 'Нова санкция',
        message: `Имате нова санкция: ${type}. Причина: ${reason}.`,
        type: 'error',
        category: 'sanction',
        sendEmail: true
    });

    return {
        sanction: user.sanctions.activeSanctions[user.sanctions.activeSanctions.length - 1]
    };
};

export const removeUserSanction = async (userId, sanctionId, currentUserId, currentUserRole) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    ensureUserIsStudent(user);

    // Само админи могат да премахват санкции
    if (currentUserRole !== 'admin') {
        throw new AppError('Само администратори могат да премахват санкции', 403);
    }

    if (!user.sanctions || !user.sanctions.activeSanctions) {
        throw new AppError('Няма санкции за премахване', 404);
    }

    const initialLength = user.sanctions.activeSanctions.length;
    user.sanctions.activeSanctions = user.sanctions.activeSanctions.filter(
        s => s._id.toString() !== sanctionId
    );

    if (user.sanctions.activeSanctions.length === initialLength) {
        throw new AppError('Санкцията не е намерена', 404);
    }

    await user.save();

    return {
        message: 'Санкцията е премахната успешно'
    };
};

// ===== ДРУГИ ФУНКЦИИ =====

export const getUsersStatistics = async () => {
    const [
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        registrationsThisMonth
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'teacher' }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({
            createdAt: { $gte: new Date(new Date().setDate(1)) }
        })
    ]);

    return {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        registrationsThisMonth
    };
};

export const changeUserRole = async (id, newRole, currentUser) => {
    if (!['student', 'teacher', 'admin'].includes(newRole)) {
        throw new AppError('Невалидна роля', 400);
    }

    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    // Проверка за права
    if (user.role === 'admin' && currentUser._id.toString() !== user._id.toString()) {
        throw new AppError('Не можете да променяте ролята на администратор', 403);
    }

    // Забрана за определени промени
    const currentRole = user.role;
    
    // Ученик не може да става учител/админ (губи данните си)
    if (currentRole === 'student' && newRole !== 'student') {
        throw new AppError('Ученик не може да променя ролята си. Създайте нов акаунт за учител/админ роля.', 400);
    }
    
    // Учител/админ не може да става ученик
    if ((currentRole === 'teacher' || currentRole === 'admin') && newRole === 'student') {
        throw new AppError('Учител или администратор не може да стане ученик', 400);
    }

    // Позволени са само teacher <-> admin
    if ((currentRole === 'teacher' && newRole === 'admin') || 
        (currentRole === 'admin' && newRole === 'teacher')) {
        user.role = newRole;
        await user.save();
        return { user };
    }

    throw new AppError('Тази промяна на роля не е позволена', 400);
};

export const resetUserPassword = async (id, password, currentUser) => {
    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    // Проверка за права
    if (user.role === 'admin' && currentUser._id.toString() !== user._id.toString()) {
        throw new AppError('Не можете да променяте паролата на администратор', 403);
    }

    user.password = password;
    user.passwordChangedAt = Date.now();
    user.accountLocked = false;
    user.incorrectLoginAttempts = 0;

    await user.save();

    return { message: 'Паролата е успешно променена' };
};

export const searchUsers = async (searchCriteria) => {
    const { query, role, emailConfirmed, accountLocked } = searchCriteria;

    let searchQuery = {};

    if (query) {
        searchQuery.$or = [
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
        ];
    }

    if (role) {
        searchQuery.role = role;
    }

    if (emailConfirmed !== undefined) {
        searchQuery.emailConfirmed = emailConfirmed;
    }

    if (accountLocked !== undefined) {
        searchQuery.accountLocked = accountLocked;
    }

    const users = await User.find(searchQuery)
        .sort({ createdAt: -1 })
        .limit(50);

    return users;
};

export const getUsersByRole = async (role) => {
    if (!['student', 'teacher', 'admin'].includes(role)) {
        throw new AppError('Невалидна роля', 400);
    }

    const users = await User.find({ role }).select('_id firstName lastName email');
    return users;
};

export const bulkUpdateUsers = async (userIds, updateData, currentUser) => {
    const { accountLocked, emailConfirmed } = updateData;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError('Не са предоставени валидни ID-та на потребители', 400);
    }

    const users = await User.find({ _id: { $in: userIds } });

    if (users.length === 0) {
        throw new AppError('Няма намерени потребители', 404);
    }

    // Проверка дали има админи в списъка
    const hasAdmins = users.some(user => user.role === 'admin');
    if (hasAdmins && currentUser.role !== 'admin') {
        throw new AppError('Нямате права да променяте администратори', 403);
    }

    const updateFields = {};
    if (accountLocked !== undefined) updateFields.accountLocked = accountLocked;
    if (emailConfirmed !== undefined) updateFields.emailConfirmed = emailConfirmed;

    const result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: updateFields }
    );

    return {
        message: `${result.modifiedCount} потребители са обновени успешно`,
        modifiedCount: result.modifiedCount
    };
};

export const getUsersWithExpiringPasswords = async (daysThreshold = 30) => {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - (90 - daysThreshold));

    const users = await User.find({
        passwordChangedAt: { $lte: thresholdDate },
        role: { $ne: 'admin' }
    }).select('firstName lastName email passwordChangedAt');

    return users;
};

export const toggleUserAccount = async (id, currentUser) => {
    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    // Проверка за права
    if (user.role === 'admin' && currentUser._id.toString() !== user._id.toString()) {
        throw new AppError('Не можете да променяте статуса на администратор', 403);
    }

    user.accountLocked = !user.accountLocked;

    if (!user.accountLocked) {
        user.incorrectLoginAttempts = 0;
    }

    await user.save();

    return {
        user,
        message: user.accountLocked ? 'Акаунтът е заключен' : 'Акаунтът е отключен'
    };
};