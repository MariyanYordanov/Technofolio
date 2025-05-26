// server/controllers/achievementsController.js (refactored)
import { validationResult } from 'express-validator';
import { catchAsync } from '../utils/catchAsync.js';
import * as achievementsService from '../services/achievementsService.js';

// Получаване на постиженията на ученик
export const getStudentAchievements = catchAsync(async (req, res, next) => {
    const studentId = req.params.studentId;

    const result = await achievementsService.getStudentAchievements(
        studentId,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        count: result.achievements.length,
        studentName: result.studentName,
        studentGrade: result.studentGrade,
        achievements: result.achievements
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

    const studentId = req.params.studentId;

    const achievement = await achievementsService.addAchievement(
        studentId,
        req.body,
        req.user.id,
        req.user.role
    );

    res.status(201).json({
        success: true,
        message: 'Постижението е добавено успешно',
        achievement
    });
});

// Изтриване на постижение
export const removeAchievement = catchAsync(async (req, res, next) => {
    const studentId = req.params.studentId;
    const achievementId = req.params.achievementId;

    const result = await achievementsService.removeAchievement(
        studentId,
        achievementId,
        req.user.id,
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
        grade: req.query.grade,
        category: req.query.category,
        search: req.query.search,
        startDate: req.query.startDate,
        endDate: req.query.endDate
    };

    const result = await achievementsService.getAllAchievements(filters, req.user.role);

    res.status(200).json({
        success: true,
        ...result.pagination,
        achievements: result.achievements
    });
});

// Получаване на статистики за постижения
export const getAchievementsStatistics = catchAsync(async (req, res, next) => {
    const filters = {
        grade: req.query.grade,
        startDate: req.query.startDate,
        endDate: req.query.endDate
    };

    const stats = await achievementsService.getAchievementsStatistics(filters, req.user.role);

    res.status(200).json({
        success: true,
        stats
    });
});

// Експортиране на постижения за отчет
export const exportAchievementsData = catchAsync(async (req, res, next) => {
    const filters = {
        grade: req.query.grade,
        category: req.query.category,
        startDate: req.query.startDate,
        endDate: req.query.endDate
    };

    const data = await achievementsService.exportAchievementsData(filters, req.user.role);

    res.status(200).json({
        success: true,
        count: data.length,
        filters,
        data
    });
});