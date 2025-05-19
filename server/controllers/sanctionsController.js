// server/controllers/sanctionsController.js
import { validationResult } from 'express-validator';
import Sanction from '../models/Sanction.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import * as notificationService from '../services/notificationService.js';

// Получаване на санкциите на студент
export async function getStudentSanctions(req, res, next) {
    try {
        const studentId = req.params.studentId;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Намиране на санкциите
        let sanctions = await Sanction.findOne({ student: studentId });

        // Ако няма санкции, създаваме празен обект
        if (!sanctions) {
            sanctions = {
                absences: {
                    excused: 0,
                    unexcused: 0,
                    maxAllowed: 150
                },
                schooloRemarks: 0,
                activeSanctions: []
            };
        }

        res.status(200).json(sanctions);
    } catch (error) {
        next(error);
    }
}

// Обновяване на отсъствията на студент
export async function updateAbsences(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        const studentId = req.params.studentId;
        const { excused, unexcused, maxAllowed } = req.body;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId).populate('user', 'firstName lastName');
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права (само учител или администратор)
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да обновявате отсъствията' });
        }

        // Проверка дали санкцията съществува
        let sanction = await Sanction.findOne({ student: studentId });

        // Проверка дали има увеличение на отсъствията
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
        if ((excused !== undefined && excused > oldExcused) ||
            (unexcused !== undefined && unexcused > oldUnexcused)) {
            await notificationService.notifyAboutAbsences(student, {
                _id: sanction._id,
                excused: excused !== undefined ? excused - oldExcused : 0,
                unexcused: unexcused !== undefined ? unexcused - oldUnexcused : 0
            });
        }

        // Проверка за критично ниво на отсъствия и известяване
        if (sanction.absences.excused + sanction.absences.unexcused > sanction.absences.maxAllowed * 0.8) {
            await notificationService.createNotification({
                recipient: student.user._id,
                title: 'Критично ниво на отсъствия',
                message: `Внимание! Достигнахте ${sanction.absences.excused + sanction.absences.unexcused} отсъствия, което е над 80% от максимално допустимите ${sanction.absences.maxAllowed}.`,
                type: 'error',
                category: 'absence',
                relatedTo: {
                    model: 'Sanction',
                    id: sanction._id
                },
                sendEmail: true
            });
        }

        res.status(200).json(sanction);
    } catch (error) {
        next(error);
    }
}

// Обновяване на забележките в Школо
export async function updateSchooloRemarks(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        const studentId = req.params.studentId;
        const { schooloRemarks } = req.body;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId).populate('user', 'firstName lastName');
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права (само учител или администратор)
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да обновявате забележките' });
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

        res.status(200).json(sanction);
    } catch (error) {
        next(error);
    }
}

// Добавяне на активна санкция
export async function addActiveSanction(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        const studentId = req.params.studentId;
        const { type, reason, startDate, endDate, issuedBy } = req.body;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId).populate('user', 'firstName lastName');
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права (само учител или администратор)
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да добавяте санкции' });
        }

        // Проверка дали санкцията съществува
        let sanction = await Sanction.findOne({ student: studentId });

        const newSanctionData = {
            type,
            reason,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
            issuedBy
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

        // Известяване на родителите (ако има информация за тях)
        // Тук би трябвало да има допълнителна логика за известяване на родителите

        res.status(201).json(sanction);
    } catch (error) {
        next(error);
    }
}

// Премахване на активна санкция
export async function removeActiveSanction(req, res, next) {
    try {
        const studentId = req.params.studentId;
        const sanctionId = req.params.sanctionId;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId).populate('user', 'firstName lastName');
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права (само учител или администратор)
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да премахвате санкции' });
        }

        // Намиране на санкцията
        const sanction = await Sanction.findOne({ student: studentId });

        if (!sanction) {
            return res.status(404).json({ message: 'Няма санкции за този студент' });
        }

        // Намиране на индекса на санкцията в масива
        const sanctionIndex = sanction.activeSanctions.findIndex(
            s => s._id.toString() === sanctionId
        );

        if (sanctionIndex === -1) {
            return res.status(404).json({ message: 'Активната санкция не е намерена' });
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

        res.status(200).json(sanction);
    } catch (error) {
        next(error);
    }
}

// Получаване на статистика за санкциите и отсъствията
export async function getSanctionsStats(req, res, next) {
    try {
        // Проверка дали потребителят има права (само администратор или учител)
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Нямате права да преглеждате тази статистика' });
        }

        // Възможност за филтриране по клас
        const grade = req.query.grade;

        let studentQuery = {};
        if (grade && ['8', '9', '10', '11', '12'].includes(grade)) {
            studentQuery.grade = grade;
        }

        // Намиране на студентите според филтъра
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

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        next(error);
    }
}

// Експортиране на санкции за отчет
export async function exportSanctionsData(req, res, next) {
    try {
        // Проверка дали потребителят има права (само администратор или учител)
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Нямате права за този експорт' });
        }

        // Филтър по клас
        const grade = req.query.grade;

        let studentQuery = {};
        if (grade && ['8', '9', '10', '11', '12'].includes(grade)) {
            studentQuery.grade = grade;
        }

        // Намиране на студентите според филтъра
        const students = await Student.find(studentQuery)
            .select('grade specialization user')
            .populate('user', 'firstName lastName');

        // Намиране на санкциите за тези студенти
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

        res.status(200).json({
            success: true,
            data: exportData
        });
    } catch (error) {
        next(error);
    }
}