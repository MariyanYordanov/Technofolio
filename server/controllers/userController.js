// server/controllers/userController.js
import { validationResult } from 'express-validator';
import { catchAsync } from '../utils/catchAsync.js';
import * as userService from '../services/userService.js';

// Получаване на всички потребители (с пагинация и филтри)
export const getAllUsers = catchAsync(async (req, res, next) => {
    // Извличане на параметри от заявката
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        role: req.query.role,
        search: req.query.search
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
        user: result.user,
        studentData: result.studentData
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

// Получаване на статистика за потребителите
export const getUsersStats = catchAsync(async (req, res, next) => {
    const stats = await userService.getUsersStatistics();

    res.status(200).json({
        success: true,
        stats
    });
});

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