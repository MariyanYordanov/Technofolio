// server/controllers/reportsController.js
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import * as reportsService from '../services/reportsService.js';

// Функция за генериране на отчет за отсъствия
export const generateAbsenceReport = catchAsync(async (req, res, next) => {
    const { format = 'excel', grade, startDate, endDate } = req.query;

    // Валидиране
    if (!['excel', 'pdf'].includes(format)) {
        return next(new AppError('Невалиден формат. Поддържаните формати са "excel" и "pdf"', 400));
    }

    // Генериране на данни
    const data = await reportsService.generateAbsenceReportData({ grade, startDate, endDate });

    // Генериране на файл
    const { buffer, filename, contentType } = await reportsService.generateReportBuffer(data, format, 'absences');

    // Изпращане
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.send(buffer);
});

// Функция за генериране на отчет за събития
export const generateEventsReport = catchAsync(async (req, res, next) => {
    const { format = 'excel', eventId, startDate, endDate, status } = req.query;

    // Валидиране
    if (!['excel', 'pdf'].includes(format)) {
        return next(new AppError('Невалиден формат. Поддържаните формати са "excel" и "pdf"', 400));
    }

    // Генериране на данни
    const data = await reportsService.generateEventsReportData({ eventId, startDate, endDate, status });

    // Генериране на файл
    const { buffer, filename, contentType } = await reportsService.generateReportBuffer(data, format, 'events');

    // Изпращане
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.send(buffer);
});

// Функция за генериране на обобщен отчет за ученик
export const generateStudentReport = catchAsync(async (req, res, next) => {
    const { userId, format } = req.params;

    // Валидиране
    if (!['excel', 'pdf'].includes(format)) {
        return next(new AppError('Невалиден формат. Поддържаните формати са "excel" и "pdf"', 400));
    }

    // Генериране на данни
    const studentData = await reportsService.generateStudentReportData(userId);

    // Генериране на файл
    const { buffer, filename, contentType } = await reportsService.generateStudentReportBuffer(studentData, format);

    // Изпращане
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.send(buffer);
});