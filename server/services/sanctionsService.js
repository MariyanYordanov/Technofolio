// server/services/sanctionsService.js
import Sanction from '../models/Sanction.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';
import * as notificationService from './notificationService.js';

// Получаване на санкциите на ученик
export const getStudentSanctions = async (studentId, currentUserId, currentUserRole) => {
    // Проверка дали ученикът съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка на права
    if (student.user._id.toString() !== currentUserId &&
        currentUserRole !== 'admin' &&
        currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате тези санкции', 403);
    }

    // Намиране на санкциите
    let sanctions = await Sanction.findOne({ student: studentId });

    // Ако няма санкции, създаваме празен обект
    if (!sanctions) {
        sanctions = {
            student: studentId,
            absences: {
                excused: 0,
                unexcused: 0,
                maxAllowed: 150
            },
            schooloRemarks: 0,
            activeSanctions: []
        };
    }

    return sanctions;
};

// Обновяване на отсъствията на ученик
export const updateStudentAbsences = async (studentId, absencesData, currentUserRole) => {
    const { excused, unexcused, maxAllowed } = absencesData;

    // Проверка на права
    if (currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да обновявате отсъствията', 403);
    }

    // Валидиране на данни
    if (excused !== undefined && (excused < 0 || !Number.isInteger(excused))) {
        throw new AppError('Невалиден брой извинени отсъствия', 400);
    }

    if (unexcused !== undefined && (unexcused < 0 || !Number.isInteger(unexcused))) {
        throw new AppError('Невалиден брой неизвинени отсъствия', 400);
    }

    if (maxAllowed !== undefined && (maxAllowed < 0 || !Number.isInteger(maxAllowed))) {
        throw new AppError('Невалиден брой максимално допустими отсъствия', 400);
    }

    // Проверка дали ученикът съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка дали санкцията съществува
    let sanction = await Sanction.findOne({ student: studentId });
    const oldExcused = sanction ? sanction.absences.excused : 0;
    const oldUnexcused = sanction ? sanction.absences.unexcused : 0;

    if (sanction) {
        // Обновяване на съществуващи санкции
        if (excused !== undefined) sanction.absences.excused = excused;
        if (unexcused !== undefined) sanction.absences.unexcused = unexcused;
        if (maxAllowed !== undefined) sanction.absences.maxAllowed = maxAllowed;
        sanction.updatedAt = Date.now();
        await sanction.save();
    } else {
        // Създаване на нови санкции
        sanction = await Sanction.create({
            student: studentId,
            absences: {
                excused: excused || 0,
                unexcused: unexcused || 0,
                maxAllowed: maxAllowed || 150
            },
            schooloRemarks: 0,
            activeSanctions: []
        });
    }

    // Ако има нови отсъствия, изпращаме известие
    const newExcused = (excused !== undefined ? excused : sanction.absences.excused) - oldExcused;
    const newUnexcused = (unexcused !== undefined ? unexcused : sanction.absences.unexcused) - oldUnexcused;

    if (newExcused > 0 || newUnexcused > 0) {
        await notificationService.notifyAboutAbsences(student, {
            _id: sanction._id,
            excused: newExcused,
            unexcused: newUnexcused
        });
    }

    // Проверка за критично ниво на отсъствия и известяване
    const totalAbsences = sanction.absences.excused + sanction.absences.unexcused;
    const criticalThreshold = sanction.absences.maxAllowed * 0.8;

    if (totalAbsences > criticalThreshold) {
        await notificationService.createNotification({
            recipient: student.user._id,
            title: 'Критично ниво на отсъствия',
            message: `Внимание! Достигнахте ${totalAbsences} отсъствия, което е над 80% от максимално допустимите ${sanction.absences.maxAllowed}.`,
            type: 'error',
            category: 'absence',
            relatedTo: {
                model: 'Sanction',
                id: sanction._id
            },
            sendEmail: true
        });
    }

    return sanction;
};

// Обновяване на забележките в Школо
export const updateSchooloRemarks = async (studentId, remarksData, currentUserRole) => {
    const { schooloRemarks } = remarksData;

    // Проверка на права
    if (currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да обновявате забележките', 403);
    }

    // Валидиране на данни
    if (schooloRemarks !== undefined && (schooloRemarks < 0 || !Number.isInteger(schooloRemarks))) {
        throw new AppError('Невалиден брой забележки', 400);
    }

    // Проверка дали ученикът съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка дали санкцията съществува
    let sanction = await Sanction.findOne({ student: studentId });
    const oldRemarks = sanction ? sanction.schooloRemarks : 0;

    if (sanction) {
        // Обновяване на съществуващи санкции
        sanction.schooloRemarks = schooloRemarks;
        sanction.updatedAt = Date.now();
        await sanction.save();
    } else {
        // Създаване на нови санкции
        sanction = await Sanction.create({
            student: studentId,
            absences: {
                excused: 0,
                unexcused: 0,
                maxAllowed: 150
            },
            schooloRemarks,
            activeSanctions: []
        });
    }

    // Известяване за нови забележки
    if (schooloRemarks > oldRemarks) {
        await notificationService.createNotification({
            recipient: student.user._id,
            title: 'Нови забележки в Школо',
            message: `Имате нови забележки в Школо. Общ брой: ${schooloRemarks}`,
            type: 'warning',
            category: 'sanction',
            relatedTo: {
                model: 'Sanction',
                id: sanction._id
            },
            sendEmail: true
        });
    }

    return sanction;
};

// Добавяне на активна санкция
export const addActiveSanction = async (studentId, sanctionData, currentUserRole) => {
    const { type, reason, startDate, endDate, issuedBy } = sanctionData;

    // Проверка на права
    if (currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да добавяте санкции', 403);
    }

    // Валидиране на данни
    if (!type || typeof type !== 'string') {
        throw new AppError('Типът на санкцията е задължителен', 400);
    }

    if (!reason || typeof reason !== 'string') {
        throw new AppError('Причината за санкцията е задължителна', 400);
    }

    if (!startDate || !Date.parse(startDate)) {
        throw new AppError('Невалидна начална дата', 400);
    }

    if (endDate && !Date.parse(endDate)) {
        throw new AppError('Невалидна крайна дата', 400);
    }

    if (endDate && new Date(endDate) <= new Date(startDate)) {
        throw new AppError('Крайната дата трябва да е след началната', 400);
    }

    if (!issuedBy || typeof issuedBy !== 'string') {
        throw new AppError('Издателят на санкцията е задължителен', 400);
    }

    // Проверка дали ученикът съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Проверка дали санкцията съществува
    let sanction = await Sanction.findOne({ student: studentId });

    const newSanctionData = {
        type: type.trim(),
        reason: reason.trim(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        issuedBy: issuedBy.trim()
    };

    if (sanction) {
        // Добавяне на нова активна санкция
        sanction.activeSanctions.push(newSanctionData);
        sanction.updatedAt = Date.now();
        await sanction.save();
    } else {
        // Създаване на нови санкции с една активна
        sanction = await Sanction.create({
            student: studentId,
            absences: {
                excused: 0,
                unexcused: 0,
                maxAllowed: 150
            },
            schooloRemarks: 0,
            activeSanctions: [newSanctionData]
        });
    }

    // Известяване на ученика за новата санкция
    const newSanction = sanction.activeSanctions[sanction.activeSanctions.length - 1];
    await notificationService.notifyAboutNewSanction(student, newSanction);

    return sanction;
};

// Премахване на активна санкция
export const removeActiveSanction = async (studentId, sanctionId, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'teacher' && currentUserRole !== 'admin') {
        throw new AppError('Нямате права да премахвате санкции', 403);
    }

    // Проверка дали ученикът съществува
    const student = await Student.findById(studentId).populate('user', 'firstName lastName');
    if (!student) {
        throw new AppError('Ученикът не е намерен', 404);
    }

    // Намиране на санкцията
    const sanction = await Sanction.findOne({ student: studentId });
    if (!sanction) {
        throw new AppError('Няма санкции за този ученик', 404);
    }

    // Намиране на индекса на санкцията в масива
    const sanctionIndex = sanction.activeSanctions.findIndex(
        s => s._id.toString() === sanctionId
    );

    if (sanctionIndex === -1) {
        throw new AppError('Активната санкция не е намерена', 404);
    }

    // Запазване на информация за санкцията преди премахването
    const removedSanction = sanction.activeSanctions[sanctionIndex];

    // Премахване на санкцията
    sanction.activeSanctions.splice(sanctionIndex, 1);
    sanction.updatedAt = Date.now();
    await sanction.save();

    // Известяване на ученика за премахнатата санкция
    await notificationService.createNotification({
        recipient: student.user._id,
        title: 'Премахната санкция',
        message: `Санкцията от тип "${removedSanction.type}" е премахната.`,
        type: 'success',
        category: 'sanction',
        sendEmail: false
    });

    return sanction;
};

// Получаване на статистика за санкциите
export const getSanctionsStatistics = async (filters, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате тази статистика', 403);
    }

    const { grade } = filters;

    let studentQuery = {};
    if (grade && ['8', '9', '10', '11', '12'].includes(grade)) {
        studentQuery.grade = grade;
    }

    // Намиране на учениците според филтъра
    const students = await Student.find(studentQuery).select('_id');
    const studentIds = students.map(s => s._id);

    // Агрегация за отсъствия
    const absencesStats = await Sanction.aggregate([
        { $match: { student: { $in: studentIds } } },
        {
            $group: {
                _id: null,
                totalExcused: { $sum: '$absences.excused' },
                totalUnexcused: { $sum: '$absences.unexcused' },
                totalSchooloRemarks: { $sum: '$schooloRemarks' },
                totalSanctions: { $sum: { $size: '$activeSanctions' } },
                totalStudents: { $sum: 1 }
            }
        }
    ]);

    // Агрегация по типове санкции
    const sanctionTypes = await Sanction.aggregate([
        { $match: { student: { $in: studentIds } } },
        { $unwind: '$activeSanctions' },
        {
            $group: {
                _id: '$activeSanctions.type',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);

    // Форматиране на резултата
    const stats = {
        absences: absencesStats.length > 0 ? {
            totalExcused: absencesStats[0].totalExcused || 0,
            totalUnexcused: absencesStats[0].totalUnexcused || 0,
            totalAbsences: (absencesStats[0].totalExcused || 0) + (absencesStats[0].totalUnexcused || 0),
            averagePerStudent: absencesStats[0].totalStudents > 0 ?
                ((absencesStats[0].totalExcused || 0) + (absencesStats[0].totalUnexcused || 0)) / absencesStats[0].totalStudents : 0
        } : {
            totalExcused: 0,
            totalUnexcused: 0,
            totalAbsences: 0,
            averagePerStudent: 0
        },
        remarks: absencesStats.length > 0 ? {
            total: absencesStats[0].totalSchooloRemarks || 0,
            averagePerStudent: absencesStats[0].totalStudents > 0 ?
                (absencesStats[0].totalSchooloRemarks || 0) / absencesStats[0].totalStudents : 0
        } : {
            total: 0,
            averagePerStudent: 0
        },
        sanctions: {
            total: absencesStats.length > 0 ? absencesStats[0].totalSanctions || 0 : 0,
            byType: sanctionTypes.map(type => ({
                type: type._id,
                count: type.count
            }))
        }
    };

    return stats;
};

// Експортиране на санкции за отчет
export const exportSanctionsData = async (filters, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права за този експорт', 403);
    }

    const { grade } = filters;

    let studentQuery = {};
    if (grade && ['8', '9', '10', '11', '12'].includes(grade)) {
        studentQuery.grade = grade;
    }

    // Намиране на учениците според филтъра
    const students = await Student.find(studentQuery)
        .select('grade specialization user')
        .populate('user', 'firstName lastName');

    // Намиране на санкциите за тези ученици
    const sanctions = await Sanction.find({
        student: { $in: students.map(s => s._id) }
    });

    // Подготовка на данните за експорт
    const exportData = students.map(student => {
        const studentSanction = sanctions.find(s => s.student.toString() === student._id.toString()) || {
            absences: { excused: 0, unexcused: 0, maxAllowed: 150 },
            schooloRemarks: 0,
            activeSanctions: []
        };

        return {
            studentName: `${student.user.firstName} ${student.user.lastName}`,
            grade: student.grade,
            specialization: student.specialization,
            excusedAbsences: studentSanction.absences.excused,
            unexcusedAbsences: studentSanction.absences.unexcused,
            totalAbsences: studentSanction.absences.excused + studentSanction.absences.unexcused,
            schooloRemarks: studentSanction.schooloRemarks,
            activeSanctions: studentSanction.activeSanctions.map(s =>
                `${s.type} (${s.reason}) от ${new Date(s.startDate).toLocaleDateString('bg-BG')}`
            ).join('; ')
        };
    });

    return exportData;
};

// Масово обновяване на отсъствия
export const bulkUpdateAbsences = async (updates, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права за масово обновяване', 403);
    }

    if (!Array.isArray(updates) || updates.length === 0) {
        throw new AppError('Невалидни данни за обновяване', 400);
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
        try {
            const { studentId, ...absencesData } = update;
            const result = await updateStudentAbsences(studentId, absencesData, currentUserRole);
            results.push({
                studentId,
                success: true,
                data: result
            });
        } catch (error) {
            errors.push({
                studentId: update.studentId,
                success: false,
                error: error.message
            });
        }
    }

    return {
        success: results.length,
        failed: errors.length,
        results,
        errors
    };
};

// Получаване на ученици с високи отсъствия
export const getStudentsWithHighAbsences = async (threshold, currentUserRole) => {
    // Проверка на права
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        throw new AppError('Нямате права да преглеждате тази информация', 403);
    }

    const thresholdValue = threshold || 0.8; // 80% по подразбиране

    const pipeline = [
        {
            $lookup: {
                from: 'students',
                localField: 'student',
                foreignField: '_id',
                as: 'studentData'
            }
        },
        { $unwind: '$studentData' },
        {
            $lookup: {
                from: 'users',
                localField: 'studentData.user',
                foreignField: '_id',
                as: 'userData'
            }
        },
        { $unwind: '$userData' },
        {
            $addFields: {
                totalAbsences: { $add: ['$absences.excused', '$absences.unexcused'] },
                absenceRate: {
                    $divide: [
                        { $add: ['$absences.excused', '$absences.unexcused'] },
                        '$absences.maxAllowed'
                    ]
                }
            }
        },
        {
            $match: {
                absenceRate: { $gte: thresholdValue }
            }
        },
        {
            $project: {
                studentName: {
                    $concat: ['$userData.firstName', ' ', '$userData.lastName']
                },
                grade: '$studentData.grade',
                specialization: '$studentData.specialization',
                totalAbsences: 1,
                excusedAbsences: '$absences.excused',
                unexcusedAbsences: '$absences.unexcused',
                maxAllowed: '$absences.maxAllowed',
                absenceRate: { $multiply: ['$absenceRate', 100] },
                schooloRemarks: 1,
                activeSanctionsCount: { $size: '$activeSanctions' }
            }
        },
        { $sort: { absenceRate: -1 } }
    ];

    const studentsWithHighAbsences = await Sanction.aggregate(pipeline);

    return studentsWithHighAbsences;
};