// server/controllers/portfolioController.js (refactored)
import { validationResult } from 'express-validator';
import { catchAsync } from '../utils/catchAsync.js';
import * as portfolioService from '../services/portfolioService.js';

// Получаване на портфолио на ученик
export const getStudentPortfolio = catchAsync(async (req, res, next) => {
    const studentId = req.params.studentId;

    const portfolio = await portfolioService.getStudentPortfolio(
        studentId,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        portfolio
    });
});

// Обновяване на портфолио
export const updatePortfolio = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const studentId = req.params.studentId;

    const portfolio = await portfolioService.updatePortfolio(
        studentId,
        req.body,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        portfolio
    });
});

// Добавяне на препоръка към портфолио
export const addRecommendation = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const studentId = req.params.studentId;

    const portfolio = await portfolioService.addRecommendation(
        studentId,
        req.body,
        req.user.id,
        req.user.role
    );

    res.status(201).json({
        success: true,
        portfolio
    });
});

// Изтриване на препоръка от портфолио
export const removeRecommendation = catchAsync(async (req, res, next) => {
    const studentId = req.params.studentId;
    const recommendationId = req.params.recommendationId;

    const result = await portfolioService.removeRecommendation(
        studentId,
        recommendationId,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        portfolio: result.portfolio,
        message: `Препоръката от ${result.removedRecommendation.author} е премахната успешно`
    });
});

// Получаване на всички портфолия (за учители и админи)
export const getAllPortfolios = catchAsync(async (req, res, next) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        grade: req.query.grade,
        search: req.query.search,
        hasMentor: req.query.hasMentor
    };

    const result = await portfolioService.getAllPortfolios(filters, req.user.role);

    res.status(200).json({
        success: true,
        ...result.pagination,
        portfolios: result.portfolios
    });
});

// Получаване на статистики за портфолия
export const getPortfoliosStatistics = catchAsync(async (req, res, next) => {
    const stats = await portfolioService.getPortfoliosStatistics(req.user.role);

    res.status(200).json({
        success: true,
        stats
    });
});