// server/services/reportsService.js
import User from '../models/User.js';
import Event from '../models/Event.js';
import EventParticipation from '../models/EventParticipation.js';
import Credit from '../models/Credit.js';
import Achievement from '../models/Achievement.js';
import { AppError } from '../utils/AppError.js';
import { generateExcelReport, generatePdfReport, formatDate } from '../utils/reports/reportGenerator.js';
import { generateMultiSectionPdfReport } from '../utils/reports/enhancedPdfGenerator.js';

// Генериране на отчет за отсъствия
export const generateAbsenceReportData = async (filters = {}) => {
    const { grade, startDate, endDate } = filters;

    // Създаване на query обект
    let query = { role: 'student' };

    if (grade) {
        query['studentInfo.grade'] = grade;
    }

    if (startDate || endDate) {
        query.updatedAt = {};
        if (startDate) query.updatedAt.$gte = new Date(startDate);
        if (endDate) query.updatedAt.$lte = new Date(endDate);
    }

    // Извличане на данни
    const students = await User.find(query).sort({ 'studentInfo.grade': 1, lastName: 1 });

    // Форматиране на данните
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

    const title = 'Отчет за отсъствия и санкции';
    const subtitle = `${grade ? `Клас: ${grade}, ` : ''}${formatDate(new Date())}`;

    return { reportData, headers, title, subtitle };
};

// Генериране на отчет за събития
export const generateEventsReportData = async (filters = {}) => {
    const { eventId, startDate, endDate, status } = filters;

    let query = {};

    if (eventId) {
        query.event = eventId;
    }

    if (status) {
        query.status = status;
    }

    if (startDate || endDate) {
        query.registeredAt = {};
        if (startDate) query.registeredAt.$gte = new Date(startDate);
        if (endDate) query.registeredAt.$lte = new Date(endDate);
    }

    // Извличане на данни
    const participations = await EventParticipation.find(query)
        .populate({
            path: 'user',
            select: 'firstName lastName email studentInfo.grade studentInfo.specialization'
        })
        .populate({
            path: 'event',
            select: 'title startDate location organizer'
        });

    // Форматиране
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

    let title = 'Отчет за участия в събития';
    if (eventId) {
        const event = await Event.findById(eventId);
        if (event) {
            title = `Участници в събитие: ${event.title}`;
        }
    }

    const subtitle = formatDate(new Date());

    return { reportData, headers, title, subtitle };
};

// Генериране на отчет за ученик
export const generateStudentReportData = async (userId) => {
    const student = await User.findById(userId);

    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    if (student.role !== 'student') {
        throw new AppError('Потребителят не е ученик', 400);
    }

    // Събиране на всички данни
    const [participations, credits, achievements] = await Promise.all([
        EventParticipation.find({ user: userId }).populate('event', 'title startDate location organizer'),
        Credit.find({ user: userId }).populate('validatedBy', 'firstName lastName'),
        Achievement.find({ user: userId }).sort({ date: -1 })
    ]);

    // Форматиране на данни за отсъствия
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

    // Форматиране на данни за събития
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

    // Форматиране на данни за кредити
    const creditsData = credits.map(c => ({
        pillar: c.pillar,
        activity: c.activity,
        description: c.description,
        status: c.status,
        validatedBy: c.validatedBy ? `${c.validatedBy.firstName} ${c.validatedBy.lastName}` : null,
        validationDate: c.validationDate ? formatDate(c.validationDate) : null
    }));

    // Форматиране на данни за постижения
    const achievementsData = achievements.map(a => ({
        category: a.category,
        title: a.title,
        description: a.description,
        date: a.date,
        place: a.place,
        issuer: a.issuer
    }));

    return {
        student,
        absencesData,
        eventsData,
        creditsData,
        achievementsData
    };
};

// Генериране на буфер за отчет
export const generateReportBuffer = async (data, format, type) => {
    const { reportData, headers, title, subtitle } = data;

    let buffer, filename, contentType;

    if (format === 'pdf') {
        buffer = await generatePdfReport(reportData, headers, title, subtitle);
        contentType = 'application/pdf';
    } else {
        buffer = await generateExcelReport(reportData, headers, title);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Генериране на filename според типа
    const timestamp = new Date().toISOString().slice(0, 10);
    switch (type) {
        case 'absences':
            filename = `отчет_отсъствия_${timestamp}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            break;
        case 'events':
            filename = `отчет_събития_${timestamp}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            break;
        default:
            filename = `отчет_${timestamp}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    }

    return { buffer, filename, contentType };
};

// Генериране на буфер за ученически отчет
export const generateStudentReportBuffer = async (studentData, format) => {
    const { student } = studentData;
    let buffer, filename, contentType;

    if (format === 'pdf') {
        buffer = await generateMultiSectionPdfReport(
            studentData,
            ['absences', 'events', 'credits', 'achievements']
        );
        filename = `отчет_${student.firstName}_${student.lastName}_${new Date().toISOString().slice(0, 10)}.pdf`;
        contentType = 'application/pdf';
    } else {
        // Excel логика (вече я имаш в контролера)
        const Excel = (await import('exceljs')).default;
        const workbook = new Excel.Workbook();

        // ... (целия Excel код от контролера)
        // Можеш да го преместиш тук

        buffer = await workbook.xlsx.writeBuffer();
        filename = `отчет_${student.firstName}_${student.lastName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    return { buffer, filename, contentType };
};