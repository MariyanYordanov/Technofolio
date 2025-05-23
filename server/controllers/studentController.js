// server/controllers/studentController.js (refactored)
import { validationResult } from 'express-validator';
import { catchAsync } from '../utils/catchAsync.js';
import * as studentService from '../services/studentService.js';

// Създаване на ученически профил
export const createStudentProfile = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const studentProfile = await studentService.createStudentProfile(req.body, req.user.id);

    res.status(201).json({
        success: true,
        student: studentProfile
    });
});

// Получаване на ученически профил по userId
export const getStudentProfileByUserId = catchAsync(async (req, res, next) => {
    const student = await studentService.getStudentProfileByUserId(req.params.userId);

    res.status(200).json({
        success: true,
        student
    });
});

// Получаване на профила на текущия ученик
export const getCurrentStudentProfile = catchAsync(async (req, res, next) => {
    const student = await studentService.getCurrentStudentProfile(req.user.id);

    res.status(200).json({
        success: true,
        student
    });
});

// Получаване на ученически профил по studentId
export const getStudentProfileById = catchAsync(async (req, res, next) => {
    const student = await studentService.getStudentProfileById(
        req.params.studentId,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        student
    });
});

// Обновяване на ученическия профил (текущ потребител)
export const updateStudentProfile = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const student = await studentService.updateStudentProfile(
        req.body,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        student
    });
});

// Обновяване на профил по studentId (за админи/учители)
export const updateStudentProfileById = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const student = await studentService.updateStudentProfileById(
        req.params.studentId,
        req.body,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        student
    });
});

// Изтриване на ученически профил
export const deleteStudentProfile = catchAsync(async (req, res, next) => {
    const result = await studentService.deleteStudentProfile(req.user.id, req.user.role);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// Изтриване на профил по studentId (за админи)
export const deleteStudentProfileById = catchAsync(async (req, res, next) => {
    const result = await studentService.deleteStudentProfileById(
        req.params.studentId,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// Получаване на всички ученици (за учители и админи)
export const getAllStudents = catchAsync(async (req, res, next) => {
    const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        grade: req.query.grade,
        specialization: req.query.specialization,
        search: req.query.search
    };

    const result = await studentService.getAllStudents(filters, req.user.role);

    res.status(200).json({
        success: true,
        ...result.pagination,
        students: result.students
    });
});

// Получаване на статистики за ученици
export const getStudentsStatistics = catchAsync(async (req, res, next) => {
    const stats = await studentService.getStudentsStatistics(req.user.role);

    res.status(200).json({
        success: true,
        stats
    });
});

// Търсене на ученици
export const searchStudents = catchAsync(async (req, res, next) => {
    const searchCriteria = {
        query: req.query.q,
        grade: req.query.grade,
        minAverageGrade: req.query.minGrade ? parseFloat(req.query.minGrade) : undefined,
        maxAverageGrade: req.query.maxGrade ? parseFloat(req.query.maxGrade) : undefined
    };

    const students = await studentService.searchStudents(searchCriteria, req.user.role);

    res.status(200).json({
        success: true,
        count: students.length,
        students
    });
});