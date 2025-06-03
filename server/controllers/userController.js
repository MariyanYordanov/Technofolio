// server/controllers/userController.js - Updated with student functionality
import { validationResult } from 'express-validator';
import { catchAsync } from '../utils/catchAsync.js';
import * as userService from '../services/userService.js';

// ===== ОСНОВНИ USER ФУНКЦИИ =====

// Получаване на всички потребители (с пагинация и филтри)
export const getAllUsers = catchAsync(async (req, res, next) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        role: req.query.role,
        search: req.query.search,
        grade: req.query.grade,
        specialization: req.query.specialization
    };

    const result = await userService.getAllUsers(filters);

    res.status(200).json({
        success: true,
        ...result.pagination,
        users: result.users
    });
});

// Получаване на потребител по ID
export const getUserById = catchAsync(async (req, res, next) => {
    const result = await userService.getUserById(req.params.id);

    res.status(200).json({
        success: true,
        user: result.user
    });
});

// Създаване на нов потребител (от админ)
export const createUser = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const result = await userService.createUser(req.body);

    res.status(201).json({
        success: true,
        user: result.user
    });
});

// Обновяване на потребител
export const updateUser = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const result = await userService.updateUser(req.params.id, req.body, req.user);

    res.status(200).json({
        success: true,
        user: result.user
    });
});

// Задаване на нова парола на потребител (от админ)
export const resetUserPassword = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { password } = req.body;
    const result = await userService.resetUserPassword(req.params.id, password, req.user);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// Изтриване на потребител
export const deleteUser = catchAsync(async (req, res, next) => {
    const result = await userService.deleteUser(req.params.id);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// Смяна на ролята на потребител
export const changeUserRole = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { role } = req.body;
    const result = await userService.changeUserRole(req.params.id, role, req.user);

    res.status(200).json({
        success: true,
        user: result.user
    });
});

// ===== ФУНКЦИИ ЗА УЧЕНИЧЕСКИ ДАННИ =====

// Получаване на всички ученици
export const getAllStudents = catchAsync(async (req, res, next) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        grade: req.query.grade,
        specialization: req.query.specialization,
        search: req.query.search
    };

    const result = await userService.getAllStudents(filters);

    res.status(200).json({
        success: true,
        ...result.pagination,
        students: result.students
    });
});

// Обновяване на ученически данни
export const updateStudentInfo = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const result = await userService.updateStudentInfo(req.params.id, req.body, req.user);

    res.status(200).json({
        success: true,
        user: result.user
    });
});

// ===== ЦЕЛИ (GOALS) =====

// Получаване на целите на потребител
export const getUserGoals = catchAsync(async (req, res, next) => {
    const result = await userService.getUserGoals(req.params.id, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        goals: result.goals,
        totalGoals: result.totalGoals
    });
});

// Обновяване/създаване на цел
export const updateUserGoal = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { category } = req.params;
    const result = await userService.updateUserGoal(
        req.params.id,
        category,
        req.body,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: 'Целта е обновена успешно',
        goal: result.goal
    });
});

// Изтриване на цел
export const deleteUserGoal = catchAsync(async (req, res, next) => {
    const { category } = req.params;
    const result = await userService.deleteUserGoal(
        req.params.id,
        category,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// ===== ИНТЕРЕСИ И ХОБИТА =====

// Получаване на интереси и хобита
export const getUserInterests = catchAsync(async (req, res, next) => {
    const result = await userService.getUserInterests(req.params.id, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        interests: result.interests,
        hobbies: result.hobbies
    });
});

// Обновяване на интереси и хобита
export const updateUserInterests = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const result = await userService.updateUserInterests(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: 'Интересите са обновени успешно',
        interests: result.interests,
        hobbies: result.hobbies
    });
});

// ===== ПОРТФОЛИО =====

// Получаване на портфолио
export const getUserPortfolio = catchAsync(async (req, res, next) => {
    const result = await userService.getUserPortfolio(req.params.id, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        portfolio: result.portfolio
    });
});

// Обновяване на портфолио
export const updateUserPortfolio = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const result = await userService.updateUserPortfolio(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        portfolio: result.portfolio
    });
});

// Добавяне на препоръка
export const addPortfolioRecommendation = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const result = await userService.addPortfolioRecommendation(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
    );

    res.status(201).json({
        success: true,
        message: 'Препоръката е добавена успешно',
        recommendation: result.recommendation
    });
});

// Изтриване на препоръка
export const removePortfolioRecommendation = catchAsync(async (req, res, next) => {
    const result = await userService.removePortfolioRecommendation(
        req.params.id,
        req.params.recommendationId,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// ===== САНКЦИИ И ОТСЪСТВИЯ =====

// Получаване на санкции и отсъствия
export const getUserSanctions = catchAsync(async (req, res, next) => {
    const result = await userService.getUserSanctions(req.params.id, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        sanctions: result.sanctions
    });
});

// Обновяване на отсъствия
export const updateUserAbsences = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const result = await userService.updateUserAbsences(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        sanctions: result.sanctions
    });
});

// Добавяне на активна санкция
export const addUserSanction = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const result = await userService.addUserSanction(
        req.params.id,
        req.body,
        req.user._id,
        req.user.role
    );

    res.status(201).json({
        success: true,
        message: 'Санкцията е добавена успешно',
        sanction: result.sanction
    });
});

// Премахване на активна санкция
export const removeUserSanction = catchAsync(async (req, res, next) => {
    const result = await userService.removeUserSanction(
        req.params.id,
        req.params.sanctionId,
        req.user._id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// ===== СТАТИСТИКИ =====

// Получаване на статистика за потребителите
export const getUsersStats = catchAsync(async (req, res, next) => {
    const stats = await userService.getUsersStatistics();

    res.status(200).json({
        success: true,
        stats
    });
});

// Получаване на статистика за учениците
export const getStudentsStats = catchAsync(async (req, res, next) => {
    const stats = await userService.getStudentsStatistics();

    res.status(200).json({
        success: true,
        stats
    });
});

// ===== ДРУГИ ФУНКЦИИ =====

// Търсене на потребители
export const searchUsers = catchAsync(async (req, res, next) => {
    const searchCriteria = {
        query: req.query.q,
        role: req.query.role,
        emailConfirmed: req.query.emailConfirmed ? req.query.emailConfirmed === 'true' : undefined,
        accountLocked: req.query.accountLocked ? req.query.accountLocked === 'true' : undefined
    };

    const users = await userService.searchUsers(searchCriteria);

    res.status(200).json({
        success: true,
        count: users.length,
        users
    });
});

// Получаване на потребители по роля
export const getUsersByRole = catchAsync(async (req, res, next) => {
    const { role } = req.params;
    const users = await userService.getUsersByRole(role);

    res.status(200).json({
        success: true,
        count: users.length,
        users
    });
});

// Масово обновяване на потребители
export const bulkUpdateUsers = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { userIds, ...updateData } = req.body;
    const result = await userService.bulkUpdateUsers(userIds, updateData, req.user);

    res.status(200).json({
        success: true,
        message: result.message,
        modifiedCount: result.modifiedCount
    });
});

// Получаване на потребители с изтичащи пароли
export const getUsersWithExpiringPasswords = catchAsync(async (req, res, next) => {
    const daysThreshold = parseInt(req.query.days) || 30;
    const users = await userService.getUsersWithExpiringPasswords(daysThreshold);

    res.status(200).json({
        success: true,
        count: users.length,
        users
    });
});

// Активиране/деактивиране на акаунт
export const toggleUserAccount = catchAsync(async (req, res, next) => {
    const result = await userService.toggleUserAccount(req.params.id, req.user);

    res.status(200).json({
        success: true,
        message: result.message,
        user: result.user
    });
});