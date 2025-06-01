// server/controllers/reportsController.js
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { generateExcelReport, generatePdfReport, formatDate } from '../utils/reports/reportGenerator.js';
import { generateMultiSectionPdfReport } from '../utils/reports/enhancedPdfGenerator.js';
import Credit from '../models/Credit.js';
import Achievement from '../models/Achievement.js';

// Модели
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
    let query = {
        role: 'student'
    };

    // Филтър по клас
    if (grade) {
        query['studentInfo.grade'] = grade;
    }

    // Филтър по дата на последна промяна
    if (startDate || endDate) {
        query.updatedAt = {};
        if (startDate) query.updatedAt.$gte = new Date(startDate);
        if (endDate) query.updatedAt.$lte = new Date(endDate);
    }

    // Извличане на данни за отсъствия от User модела
    const students = await User.find(query).sort({ 'studentInfo.grade': 1, lastName: 1 });

    // Форматиране на данните за отчета
    const reportData = students.map(student => ({
        studentName: `${student.firstName} ${student.lastName}`,
        grade: student.studentInfo?.grade || 'N/A',
        specialization: student.studentInfo?.specialization || 'N/A',
        excusedAbsences: student.sanctions?.absences?.excused || 0,
        unexcusedAbsences: student.sanctions?.absences?.unexcused || 0,
        totalAbsences: (student.sanctions?.absences?.excused || 0) + (student.sanctions?.absences?.unexcused || 0),
        maxAllowed: student.sanctions?.absences?.maxAllowed || 150,
        schooloRemarks: student.sanctions?.schooloRemarks || 0,
        activeSanctions: student.sanctions?.activeSanctions?.length || 0,
        lastUpdated: formatDate(student.updatedAt)
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
    res.setHeader('Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
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
            path: 'user',
            select: 'firstName lastName email studentInfo.grade studentInfo.specialization'
        })
        .populate({
            path: 'event',
            select: 'title startDate location organizer'
        });

    // Форматиране на данните за отчета
    const reportData = participations.map(participation => ({
        studentName: `${participation.user.firstName} ${participation.user.lastName}`,
        email: participation.user.email,
        grade: participation.user.studentInfo?.grade || 'N/A',
        specialization: participation.user.studentInfo?.specialization || 'N/A',
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
    res.setHeader('Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.send(buffer);
});

// Функция за генериране на обобщен отчет за ученик
export const generateStudentReport = catchAsync(async (req, res, next) => {
    const { userId, format } = req.params;

    // Валидиране на входните данни
    if (format && !['excel', 'pdf'].includes(format)) {
        return next(new AppError('Невалиден формат. Поддържаните формати са "excel" и "pdf"', 400));
    }

    // Проверка дали ученикът съществува
    const student = await User.findById(userId);

    if (!student) {
        return next(new AppError('Ученикът не е намерен', 404));
    }

    if (student.role !== 'student') {
        return next(new AppError('Потребителят не е ученик', 400));
    }

    // Събиране на данни за ученика
    const participations = await EventParticipation.find({ user: userId })
        .populate('event', 'title startDate location organizer');

    // Форматиране на данните за отсъствия и санкции
    const absencesData = {
        excusedAbsences: student.sanctions?.absences?.excused || 0,
        unexcusedAbsences: student.sanctions?.absences?.unexcused || 0,
        totalAbsences: (student.sanctions?.absences?.excused || 0) + (student.sanctions?.absences?.unexcused || 0),
        maxAllowed: student.sanctions?.absences?.maxAllowed || 150,
        schooloRemarks: student.sanctions?.schooloRemarks || 0,
        activeSanctions: student.sanctions?.activeSanctions?.map(s => ({
            type: s.type,
            reason: s.reason,
            startDate: formatDate(s.startDate),
            endDate: s.endDate ? formatDate(s.endDate) : 'Безсрочна',
            issuedBy: s.issuedBy
        })) || []
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
    const title = `Отчет за ученик: ${student.firstName} ${student.lastName}`;
    const subtitle = `Клас: ${student.studentInfo?.grade || 'N/A'}, Специалност: ${student.studentInfo?.specialization || 'N/A'}, Дата: ${formatDate(new Date())}`;

    // Генериране на отчет според избрания формат
    let buffer, filename, contentType;

    if (format === 'pdf') {
        // Извличане на допълнителни данни за PDF
        const credits = await Credit.find({ user: userId })
            .populate('validatedBy', 'firstName lastName');

        const achievements = await Achievement.find({ user: userId })
            .sort({ date: -1 });

        // Форматиране на данните за кредити
        const creditsData = credits.map(c => ({
            pillar: c.pillar,
            activity: c.activity,
            description: c.description,
            status: c.status,
            validatedBy: c.validatedBy ? `${c.validatedBy.firstName} ${c.validatedBy.lastName}` : null,
            validationDate: c.validationDate ? formatDate(c.validationDate) : null
        }));

        // Форматиране на данните за постижения
        const achievementsData = achievements.map(a => ({
            category: a.category,
            title: a.title,
            description: a.description,
            date: a.date,
            place: a.place,
            issuer: a.issuer
        }));

        // Подготовка на данните
        const studentData = {
            student,
            absencesData,
            eventsData,
            creditsData,
            achievementsData
        };

        // Генериране на PDF с всички секции
        buffer = await generateMultiSectionPdfReport(
            studentData,
            ['absences', 'events', 'credits', 'achievements'] // Можеш да контролираш кои секции да включиш
        );

        filename = `отчет_${student.firstName}_${student.lastName}_${new Date().toISOString().slice(0, 10)}.pdf`;
        contentType = 'application/pdf';
    } else {
        // За Excel използваме по-сложна логика с няколко работни листа
        const Excel = (await import('exceljs')).default;
        const workbook = new Excel.Workbook();

        // Работен лист за основна информация
        const infoSheet = workbook.addWorksheet('Информация');
        infoSheet.columns = [
            { header: 'Поле', key: 'field', width: 25 },
            { header: 'Стойност', key: 'value', width: 50 }
        ];
        infoSheet.getRow(1).font = { bold: true };

        infoSheet.addRow({ field: 'Име', value: `${student.firstName} ${student.lastName}` });
        infoSheet.addRow({ field: 'Имейл', value: student.email });
        infoSheet.addRow({ field: 'Клас', value: student.studentInfo?.grade || 'N/A' });
        infoSheet.addRow({ field: 'Специалност', value: student.studentInfo?.specialization || 'N/A' });
        infoSheet.addRow({ field: 'Среден успех', value: student.studentInfo?.averageGrade || 'Не е въведен' });

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
        filename = `student_report_${student.firstName}_${student.lastName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Изпращане на файла
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.send(buffer);
});