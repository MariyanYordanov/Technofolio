// server/controllers/sanctionsController.js (refactored)
import { validationResult } from 'express-validator';
import { catchAsync } from '../utils/catchAsync.js';
import * as sanctionsService from '../services/sanctionsService.js';

// Получаване на санкциите на ученик
export const getStudentSanctions = catchAsync(async (req, res, next) => {
    const studentId = req.params.studentId;
    const sanctions = await sanctionsService.getStudentSanctions(
        studentId,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        sanctions
    });
});

// Обновяване на отсъствията на ученик
export const updateAbsences = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const studentId = req.params.studentId;
    const sanction = await sanctionsService.updateStudentAbsences(
        studentId,
        req.body,
        req.user.role
    );

    res.status(200).json({
        success: true,
        sanction
    });
});

// Обновяване на забележките в Школо
export const updateSchooloRemarks = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const studentId = req.params.studentId;
    const sanction = await sanctionsService.updateSchooloRemarks(
        studentId,
        req.body,
        req.user.role
    );

    res.status(200).json({
        success: true,
        sanction
    });
});

// Добавяне на активна санкция
export const addActiveSanction = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const studentId = req.params.studentId;
    const sanction = await sanctionsService.addActiveSanction(
        studentId,
        req.body,
        req.user.role
    );

    res.status(201).json({
        success: true,
        sanction
    });
});

// Премахване на активна санкция
export const removeActiveSanction = catchAsync(async (req, res, next) => {
    const studentId = req.params.studentId;
    const sanctionId = req.params.sanctionId;

    const sanction = await sanctionsService.removeActiveSanction(
        studentId,
        sanctionId,
        req.user.role
    );

    res.status(200).json({
        success: true,
        sanction
    });
});

// Получаване на статистика за санкциите и отсъствията
export const getSanctionsStats = catchAsync(async (req, res, next) => {
    const filters = {
        grade: req.query.grade
    };

    const stats = await sanctionsService.getSanctionsStatistics(filters, req.user.role);

    res.status(200).json({
        success: true,
        stats
    });
});

// Експортиране на санкции за отчет
export const exportSanctionsData = catchAsync(async (req, res, next) => {
    const filters = {
        grade: req.query.grade
    };

    const data = await sanctionsService.exportSanctionsData(filters, req.user.role);

    res.status(200).json({
        success: true,
        count: data.length,
        data
    });
});

// Масово обновяване на отсъствия
export const bulkUpdateAbsences = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { updates } = req.body;
    const result = await sanctionsService.bulkUpdateAbsences(updates, req.user.role);

    res.status(200).json({
        success: true,
        message: `${result.success} обновления успешни, ${result.failed} неуспешни`,
        result
    });
});

// Получаване на ученици с високи отсъствия
export const getStudentsWithHighAbsences = catchAsync(async (req, res, next) => {
    const threshold = req.query.threshold ? parseFloat(req.query.threshold) : 0.8;

    const students = await sanctionsService.getStudentsWithHighAbsences(threshold, req.user.role);

    res.status(200).json({
        success: true,
        count: students.length,
        threshold: `${Math.round(threshold * 100)}%`,
        students
    });
});