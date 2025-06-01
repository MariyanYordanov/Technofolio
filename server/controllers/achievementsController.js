// server/controllers/achievementsController.js
import { validationResult } from 'express-validator';
import { catchAsync } from '../utils/catchAsync.js';
import * as achievementsService from '../services/achievementsService.js';

// Получаване на постиженията на потребител
export const getUserAchievements = catchAsync(async (req, res, next) => {
    const userId = req.params.userId;

    const achievements = await achievementsService.getUserAchievements(
        userId,
        req.user._id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        count: achievements.length,
        achievements
    });
});

// Добавяне на ново постижение
export const addAchievement = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const achievement = await achievementsService.addAchievement(
        req.body,
        req.user._id,
        req.user.role
    );

    res.status(201).json({
        success: true,
        message: 'Постижението е добавено успешно',
        achievement
    });
});

// Обновяване на постижение
export const updateAchievement = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const achievementId = req.params.id;

    const achievement = await achievementsService.updateAchievement(
        achievementId,
        req.body,
        req.user._id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: 'Постижението е обновено успешно',
        achievement
    });
});

// Изтриване на постижение
export const deleteAchievement = catchAsync(async (req, res, next) => {
    const achievementId = req.params.id;

    const result = await achievementsService.deleteAchievement(
        achievementId,
        req.user._id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: result.message,
        deletedAchievement: result.deletedAchievement
    });
});

// Получаване на всички постижения (за учители и админи)
export const getAllAchievements = catchAsync(async (req, res, next) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        category: req.query.category,
        userId: req.query.userId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search
    };

    const result = await achievementsService.getAllAchievements(filters, req.user.role);

    res.status(200).json({
        success: true,
        ...result.pagination,
        achievements: result.achievements
    });
});

// Получаване на статистики за постижения
export const getAchievementsStats = catchAsync(async (req, res, next) => {
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        grade: req.query.grade
    };

    const stats = await achievementsService.getAchievementsStats(filters, req.user.role);

    res.status(200).json({
        success: true,
        stats
    });
});