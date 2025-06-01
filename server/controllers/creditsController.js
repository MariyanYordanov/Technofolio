// server/controllers/creditsController.js
import { validationResult } from 'express-validator';
import { catchAsync } from '../utils/catchAsync.js';
import * as creditsService from '../services/creditsService.js';

// Получаване на кредитите на ученик
export const getStudentCredits = catchAsync(async (req, res, next) => {
    const userId = req.params.userId; // Променено от studentId на userId
    const result = await creditsService.getStudentCredits(userId, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        count: result.credits.length,
        stats: result.stats,
        credits: result.credits
    });
});

// Получаване на категориите кредити
export const getCreditCategories = catchAsync(async (req, res, next) => {
    const result = await creditsService.getCreditCategories();

    res.status(200).json({
        success: true,
        count: result.categories.length,
        categories: result.categories,
        categoriesByPillar: result.categoriesByPillar
    });
});

// Добавяне на нов кредит
export const addCredit = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const credit = await creditsService.addCredit(req.body, req.user.id);

    res.status(201).json({
        success: true,
        credit
    });
});

// Валидиране на кредит (само за учители и администратори)
export const validateCredit = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const creditId = req.params.creditId;
    const credit = await creditsService.validateCredit(creditId, req.body, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        credit
    });
});

// Изтриване на кредит
export const deleteCredit = catchAsync(async (req, res, next) => {
    const creditId = req.params.creditId;
    const result = await creditsService.deleteCredit(creditId, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// Получаване на всички кредити (за администратор и учители)
export const getAllCredits = catchAsync(async (req, res, next) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        pillar: req.query.pillar,
        search: req.query.search,
        userId: req.query.userId // Променено от studentId на userId
    };

    const result = await creditsService.getAllCredits(filters, req.user.role);

    res.status(200).json({
        success: true,
        ...result.pagination,
        stats: result.stats,
        credits: result.credits
    });
});

// Добавяне на нова категория кредити (за администратор)
export const addCreditCategory = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const category = await creditsService.addCreditCategory(req.body, req.user.role);

    res.status(201).json({
        success: true,
        category
    });
});

// Обновяване на категория кредити (за администратор)
export const updateCreditCategory = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const categoryId = req.params.categoryId;
    const category = await creditsService.updateCreditCategory(categoryId, req.body, req.user.role);

    res.status(200).json({
        success: true,
        category
    });
});

// Изтриване на категория кредити (за администратор)
export const deleteCreditCategory = catchAsync(async (req, res, next) => {
    const categoryId = req.params.categoryId;
    const result = await creditsService.deleteCreditCategory(categoryId, req.user.role);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// Получаване на статистики за кредити
export const getCreditsStatistics = catchAsync(async (req, res, next) => {
    // Проверка дали потребителят има права (само учител или администратор)
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Нямате права да преглеждате статистики'
        });
    }

    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        pillar: req.query.pillar,
        studentGrade: req.query.grade
    };

    const stats = await creditsService.getCreditsStatistics(filters);

    res.status(200).json({
        success: true,
        stats
    });
});

// Масово валидиране на кредити
export const bulkValidateCredits = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { creditIds, ...validationData } = req.body;
    const result = await creditsService.bulkValidateCredits(creditIds, validationData, req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        message: result.message,
        processedCount: result.processedCount,
        status: result.status
    });
});