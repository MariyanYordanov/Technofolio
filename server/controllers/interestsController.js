// server/controllers/interestsController.js (refactored)
import { validationResult } from 'express-validator';
import { catchAsync } from '../utils/catchAsync.js';
import * as interestsService from '../services/interestsService.js';

// Получаване на интересите на ученика
export const getStudentInterests = catchAsync(async (req, res, next) => {
    const studentId = req.params.studentId;

    const result = await interestsService.getStudentInterests(
        studentId,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        studentName: result.studentName,
        studentGrade: result.studentGrade,
        interests: result.interests
    });
});

// Обновяване на интересите на ученика
export const updateInterests = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const studentId = req.params.studentId;

    const interests = await interestsService.updateInterests(
        studentId,
        req.body,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: 'Интересите са обновени успешно',
        interests
    });
});

// Получаване на всички интереси (за учители и админи)
export const getAllInterests = catchAsync(async (req, res, next) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        grade: req.query.grade,
        search: req.query.search,
        hasInterests: req.query.hasInterests,
        hasHobbies: req.query.hasHobbies
    };

    const result = await interestsService.getAllInterests(filters, req.user.role);

    res.status(200).json({
        success: true,
        ...result.pagination,
        interests: result.interests
    });
});

// Получаване на статистики за интереси
export const getInterestsStatistics = catchAsync(async (req, res, next) => {
    const filters = {
        grade: req.query.grade
    };

    const stats = await interestsService.getInterestsStatistics(filters, req.user.role);

    res.status(200).json({
        success: true,
        stats
    });
});

// Експортиране на интереси за отчет
export const exportInterestsData = catchAsync(async (req, res, next) => {
    const filters = {
        grade: req.query.grade
    };

    const data = await interestsService.exportInterestsData(filters, req.user.role);

    res.status(200).json({
        success: true,
        count: data.length,
        filters,
        data
    });
});

// Получаване на популярни интереси и хобита
export const getPopularInterestsAndHobbies = catchAsync(async (req, res, next) => {
    const result = await interestsService.getPopularInterestsAndHobbies(req.user.role);

    res.status(200).json({
        success: true,
        popular: result
    });
});

