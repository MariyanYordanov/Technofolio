// server/controllers/goalsController.js (refactored)
import { validationResult } from 'express-validator';
import { catchAsync } from '../utils/catchAsync.js';
import * as goalsService from '../services/goalsService.js';

// Получаване на целите на ученика
export const getStudentGoals = catchAsync(async (req, res, next) => {
    const studentId = req.params.studentId;

    const result = await goalsService.getStudentGoals(
        studentId,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        studentName: result.studentName,
        studentGrade: result.studentGrade,
        totalGoals: result.totalGoals,
        completedCategories: result.completedCategories,
        goals: result.goals
    });
});

// Създаване или обновяване на цел
export const updateGoal = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const studentId = req.params.studentId;
    const category = req.params.category;

    const result = await goalsService.updateGoal(
        studentId,
        category,
        req.body,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: `Целта за категория "${result.goal.title}" е обновена успешно`,
        goal: result.goal,
        goals: result.updatedGoals
    });
});

// Изтриване на цел
export const deleteGoal = catchAsync(async (req, res, next) => {
    const studentId = req.params.studentId;
    const category = req.params.category;

    const result = await goalsService.deleteGoal(
        studentId,
        category,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: result.message,
        deletedCategory: result.category,
        deletedCategoryTitle: result.categoryTitle
    });
});

// Получаване на всички цели (за учители и админи)
export const getAllGoals = catchAsync(async (req, res, next) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        grade: req.query.grade,
        category: req.query.category,
        search: req.query.search
    };

    const result = await goalsService.getAllGoals(filters, req.user.role);

    res.status(200).json({
        success: true,
        ...result.pagination,
        goals: result.goals
    });
});

// Получаване на статистики за цели
export const getGoalsStatistics = catchAsync(async (req, res, next) => {
    const filters = {
        grade: req.query.grade
    };

    const stats = await goalsService.getGoalsStatistics(filters, req.user.role);

    res.status(200).json({
        success: true,
        stats
    });
});

// Масово обновяване на цели (за админи)
export const bulkUpdateGoals = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { updates } = req.body;

    const result = await goalsService.bulkUpdateGoals(
        updates,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: `${result.success} цели обновени успешно, ${result.failed} неуспешни`,
        summary: {
            successful: result.success,
            failed: result.failed
        },
        details: result
    });
});

// Експортиране на цели за отчет
export const exportGoalsData = catchAsync(async (req, res, next) => {
    const filters = {
        grade: req.query.grade,
        category: req.query.category
    };

    const data = await goalsService.exportGoalsData(filters, req.user.role);

    res.status(200).json({
        success: true,
        count: data.length,
        filters,
        data
    });
});