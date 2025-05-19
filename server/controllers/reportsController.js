// server/controllers/reportsController.js
import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { generateExcelReport, generatePdfReport, formatDate } from '../utils/reports/reportGenerator.js';

// Модели
import Sanction from '../models/Sanction.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import EventParticipation from '../models/EventParticipation.js';
import Event from '../models/Event.js';

// Функция за генериране на отчет за отсъствия
export const generateAbsenceReport = catchAsync(async (req, res, next) => {
    const { format, grade, startDate, endDate } = req.query;

    // Валидиране на входните данни
    if (format && !['excel', 'pdf'].includes(format)) {
        return next(new AppError('Невалиден формат. Поддържаните формати са "excel" и "pdf"', 400));
    }

    // Създаване на query обект за филтриране
    let query = {};

    // Филтър по клас
    if (grade) {
        const studentIds = await Student.find({ grade }).select('_id');
        query.student = { $in: studentIds.map(s => s._id) };
    }

    // Филтър по дата на последна промяна
    if (startDate || endDate) {
        query.updatedAt = {};
        if (startDate) query.updatedAt.$gte = new Date(startDate);
        if (endDate) query.updatedAt.$lte = new Date(endDate);
    }

    // Извличане на данни за отсъствия
    const sanctions = await Sanction.find(query).populate({
        path: 'student',
        select: 'grade specialization',
        populate: {
            path: 'user',
            select: 'firstName lastName'
        }
    });

    // Форматиране на данните за отчета
    const reportData = sanctions.map(sanction => ({
        studentName: `${sanction.student.user.firstName} ${sanction.student.user.lastName}`,
        grade: sanction.student.grade,
        specialization: sanction.student.specialization,
        excusedAbsences: sanction.absences.excused,
        unexcusedAbsences: sanction.absences.unexcused,
        totalAbsences: sanction.absences.excused + sanction.absences.unexcused,
        maxAllowed: sanction.absences.maxAllowed,
        schooloRemarks: sanction.schooloRemarks,
        activeSanctions: sanction.activeSanctions.length,
        lastUpdated: formatDate(sanction.updatedAt)
    }));

    // Дефиниране на заглавията за отчета
    const headers = [
        { key: 'studentName', label: 'Име на ученик', width: 25 },
        { key: 'grade', label: 'Клас', width: 10 },
        { key: 'specialization', label: 'Специалност', width: 25 },
        { key: 'excusedAbsences', label: 'Извинени отсъствия', width: 10 },
        { key: 'unexcusedAbsences', label: 'Неизвинени отсъствия', width: 10 },
        { key: 'totalAbsences', label: 'Общо отсъствия', width: 10 },
        { key: 'maxAllowed', label: 'Макс. допустими', width: 10 },
        { key: 'schooloRemarks', label: 'Забележки в Школо', width: 10 },
        { key: 'activeSanctions', label: 'Активни санкции', width: 10 },
        { key: 'lastUpdated', label: 'Последна актуализация', width: 15 }
    ];

    // Създаване на заглавие за отчета
    const title = 'Отчет за отсъствия и санкции';
    const subtitle = `${grade ? `Клас: ${grade}, ` : ''}${formatDate(new Date())}`;

    // Генериране на отчет според избрания формат
    let buffer, filename, contentType;
    if (format === 'pdf') {
        buffer = await generatePdfReport(reportData, headers, title, subtitle);
        filename = `absences_report_${new Date().toISOString().slice(0, 10)}.pdf`;
        contentType = 'application/pdf';
    } else {
        buffer = await generateExcelReport(reportData, headers, title);
        filename = `absences_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Изпращане на файла
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
});

// Функция за генериране на отчет за участия в събития
export const generateEventsReport = catchAsync(async (req, res, next) => {
    const { format, eventId, startDate, endDate, status } = req.query;

    // Валидиране на входните данни
    if (format && !['excel', 'pdf'].includes(format)) {
        return next(new AppError('Невалиден формат. Поддържаните формати са "excel" и "pdf"', 400));
    }

    // Създаване на query обект за филтриране
    let query = {};

    // Филтър по събитие
    if (eventId) {
        query.event = eventId;
    }

    // Филтър по статус
    if (status) {
        query.status = status;
    }

    // Филтър по дата
    if (startDate || endDate) {
        // Ако търсим по дата на регистрация
        query.registeredAt = {};
        if (startDate) query.registeredAt.$gte = new Date(startDate);
        if (endDate) query.registeredAt.$lte = new Date(endDate);
    }

    // Извличане на данни за участия
    const participations = await EventParticipation.find(query)
        .populate({
            path: 'student',
            select: 'grade specialization',
            populate: {
                path: 'user',
                select: 'firstName lastName email'
            }
        })
        .populate({
            path: 'event',
            select: 'title startDate location organizer'
        });

    // Форматиране на данните за отчета
    const reportData = participations.map(participation => ({
        studentName: `${participation.student.user.firstName} ${participation.student.user.lastName}`,
        email: participation.student.user.email,
        grade: participation.student.grade,
        specialization: participation.student.specialization,
        eventTitle: participation.event.title,
        eventDate: formatDate(participation.event.startDate),
        eventLocation: participation.event.location,
        organizer: participation.event.organizer,
        status: participation.status,
        registeredAt: formatDate(participation.registeredAt),
        confirmedAt: participation.confirmedAt ? formatDate(participation.confirmedAt) : 'Не е потвърдено',
        attendedAt: participation.attendedAt ? formatDate(participation.attendedAt) : 'Не е отбелязано'
    }));

    // Дефиниране на заглавията за отчета
    const headers = [
        { key: 'studentName', label: 'Име на ученик', width: 25 },
        { key: 'email', label: 'Имейл', width: 25 },
        { key: 'grade', label: 'Клас', width: 10 },
        { key: 'specialization', label: 'Специалност', width: 25 },
        { key: 'eventTitle', label: 'Събитие', width: 30 },
        { key: 'eventDate', label: 'Дата на събитие', width: 15 },
        { key: 'eventLocation', label: 'Място', width: 20 },
        { key: 'organizer', label: 'Организатор', width: 20 },
        { key: 'status', label: 'Статус', width: 15 },
        { key: 'registeredAt', label: 'Регистриран на', width: 15 },
        { key: 'confirmedAt', label: 'Потвърден на', width: 15 },
        { key: 'attendedAt', label: 'Присъствал на', width: 15 }
    ];

    // Създаване на заглавие за отчета
    let title = 'Отчет за участия в събития';
    if (eventId) {
        const event = await Event.findById(eventId);
        if (event) {
            title = `Участници в събитие: ${event.title}`;
        }
    }

    const subtitle = `${formatDate(new Date())}`;

    // Генериране на отчет според избрания формат
    let buffer, filename, contentType;
    if (format === 'pdf') {
        buffer = await generatePdfReport(reportData, headers, title, subtitle);
        filename = `events_report_${new Date().toISOString().slice(0, 10)}.pdf`;
        contentType = 'application/pdf';
    } else {
        buffer = await generateExcelReport(reportData, headers, title);
        filename = `events_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Изпращане на файла
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
});

// Функция за генериране на обобщен отчет за ученик
export const generateStudentReport = catchAsync(async (req, res, next) => {
    const { studentId, format } = req.params;

    // Валидиране на входните данни
    if (format && !['excel', 'pdf'].includes(format)) {
        return next(new AppError('Невалиден формат. Поддържаните формати са "excel" и "pdf"', 400));
    }

    // Проверка дали ученикът съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName email');

    if (!student) {
        return next(new AppError('Ученикът не е намерен', 404));
    }

    // Събиране на данни за ученика от различни колекции
    const [sanctions, participations] = await Promise.all([
        Sanction.findOne({ student: studentId }),
        EventParticipation.find({ student: studentId }).populate('event', 'title startDate location organizer')
    ]);

    // Форматиране на данните за отсъствия и санкции
    const absencesData = sanctions ? {
        excusedAbsences: sanctions.absences.excused,
        unexcusedAbsences: sanctions.absences.unexcused,
        totalAbsences: sanctions.absences.excused + sanctions.absences.unexcused,
        maxAllowed: sanctions.absences.maxAllowed,
        schooloRemarks: sanctions.schooloRemarks,
        activeSanctions: sanctions.activeSanctions.map(s => ({
            type: s.type,
            reason: s.reason,
            startDate: formatDate(s.startDate),
            endDate: s.endDate ? formatDate(s.endDate) : 'Безсрочна',
            issuedBy: s.issuedBy
        }))
    } : {
        excusedAbsences: 0,
        unexcusedAbsences: 0,
        totalAbsences: 0,
        maxAllowed: 150,
        schooloRemarks: 0,
        activeSanctions: []
    };

    // Форматиране на данните за участия в събития
    const eventsData = participations.map(p => ({
        eventTitle: p.event.title,
        eventDate: formatDate(p.event.startDate),
        eventLocation: p.event.location,
        organizer: p.event.organizer,
        status: p.status,
        registeredAt: formatDate(p.registeredAt),
        confirmedAt: p.confirmedAt ? formatDate(p.confirmedAt) : 'Не е потвърдено',
        attendedAt: p.attendedAt ? formatDate(p.attendedAt) : 'Не е отбелязано'
    }));

    // Заглавия за отсъствия
    const absencesHeaders = [
        { key: 'excusedAbsences', label: 'Извинени отсъствия', width: 20 },
        { key: 'unexcusedAbsences', label: 'Неизвинени отсъствия', width: 20 },
        { key: 'totalAbsences', label: 'Общо отсъствия', width: 20 },
        { key: 'maxAllowed', label: 'Макс. допустими', width: 20 },
        { key: 'schooloRemarks', label: 'Забележки в Школо', width: 20 }
    ];

    // Заглавия за санкции
    const sanctionsHeaders = [
        { key: 'type', label: 'Тип санкция', width: 20 },
        { key: 'reason', label: 'Причина', width: 40 },
        { key: 'startDate', label: 'Начална дата', width: 20 },
        { key: 'endDate', label: 'Крайна дата', width: 20 },
        { key: 'issuedBy', label: 'Издадена от', width: 20 }
    ];

    // Заглавия за събития
    const eventsHeaders = [
        { key: 'eventTitle', label: 'Събитие', width: 30 },
        { key: 'eventDate', label: 'Дата', width: 15 },
        { key: 'eventLocation', label: 'Място', width: 20 },
        { key: 'organizer', label: 'Организатор', width: 20 },
        { key: 'status', label: 'Статус', width: 15 },
        { key: 'registeredAt', label: 'Регистриран на', width: 15 },
        { key: 'confirmedAt', label: 'Потвърден на', width: 15 },
        { key: 'attendedAt', label: 'Присъствал на', width: 15 }
    ];

    // Създаване на заглавие за отчета
    const title = `Отчет за ученик: ${student.user.firstName} ${student.user.lastName}`;
    const subtitle = `Клас: ${student.grade}, Специалност: ${student.specialization}, Дата: ${formatDate(new Date())}`;

    // Генериране на отчет според избрания формат
    let buffer, filename, contentType;

    if (format === 'pdf') {
        // Създаване на PDF документ с няколко секции
        // Тук трябва да се използва по-сложна структура за PDF документа
        // За целите на примера ще генерираме само една секция с отсъствия

        buffer = await generatePdfReport([absencesData], absencesHeaders, title, subtitle);
        filename = `student_report_${student.user.lastName}_${new Date().toISOString().slice(0, 10)}.pdf`;
        contentType = 'application/pdf';
    } else {
        // За Excel използваме по-сложна логика с няколко работни листа
        const workbook = new Excel.Workbook();

        // Работен лист за основна информация
        const infoSheet = workbook.addWorksheet('Информация');
        infoSheet.columns = [
            { header: 'Поле', key: 'field', width: 25 },
            { header: 'Стойност', key: 'value', width: 50 }
        ];
        infoSheet.getRow(1).font = { bold: true };

        infoSheet.addRow({ field: 'Име', value: `${student.user.firstName} ${student.user.lastName}` });
        infoSheet.addRow({ field: 'Имейл', value: student.user.email });
        infoSheet.addRow({ field: 'Клас', value: student.grade });
        infoSheet.addRow({ field: 'Специалност', value: student.specialization });
        infoSheet.addRow({ field: 'Среден успех', value: student.averageGrade || 'Не е въведен' });

        // Работен лист за отсъствия
        const absencesSheet = workbook.addWorksheet('Отсъствия');
        absencesSheet.columns = absencesHeaders.map(header => ({
            header: header.label,
            key: header.key,
            width: header.width || 20
        }));
        absencesSheet.getRow(1).font = { bold: true };
        absencesSheet.addRow(absencesData);

        // Работен лист за санкции
        const sanctionsSheet = workbook.addWorksheet('Санкции');
        sanctionsSheet.columns = sanctionsHeaders.map(header => ({
            header: header.label,
            key: header.key,
            width: header.width || 20
        }));
        sanctionsSheet.getRow(1).font = { bold: true };
        absencesData.activeSanctions.forEach(sanction => {
            sanctionsSheet.addRow(sanction);
        });

        // Работен лист за събития
        const eventsSheet = workbook.addWorksheet('Събития');
        eventsSheet.columns = eventsHeaders.map(header => ({
            header: header.label,
            key: header.key,
            width: header.width || 20
        }));
        eventsSheet.getRow(1).font = { bold: true };
        eventsData.forEach(event => {
            eventsSheet.addRow(event);
        });

        // Създаване на буфер
        buffer = await workbook.xlsx.writeBuffer();
        filename = `student_report_${student.user.lastName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Изпращане на файла
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
});