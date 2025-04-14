const { validationResult } = require('express-validator');
const Sanction = require('../models/Sanction');
const Student = require('../models/Student');

// Получаване на санкциите на студент
exports.getStudentSanctions = async (req, res, next) => {
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
};

// Обновяване на отсъствията на студент
exports.updateAbsences = async (req, res, next) => {
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
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права (само учител или администратор)
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да обновявате отсъствията' });
        }

        // Проверка дали санкцията съществува
        let sanction = await Sanction.findOne({ student: studentId });

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

        res.status(200).json(sanction);
    } catch (error) {
        next(error);
    }
};

// Обновяване на забележките в Школо
exports.updateSchooloRemarks = async (req, res, next) => {
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
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права (само учител или администратор)
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да обновявате забележките' });
        }

        // Проверка дали санкцията съществува
        let sanction = await Sanction.findOne({ student: studentId });

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

        res.status(200).json(sanction);
    } catch (error) {
        next(error);
    }
};

// Добавяне на активна санкция
exports.addActiveSanction = async (req, res, next) => {
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
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права (само учител или администратор)
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да добавяте санкции' });
        }

        // Проверка дали санкцията съществува
        let sanction = await Sanction.findOne({ student: studentId });

        if (sanction) {
            // Добавяне на нова активна санкция
            sanction.activeSanctions.push({
                type,
                reason,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : undefined,
                issuedBy
            });

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
                activeSanctions: [{
                    type,
                    reason,
                    startDate: new Date(startDate),
                    endDate: endDate ? new Date(endDate) : undefined,
                    issuedBy
                }]
            });
        }

        res.status(201).json(sanction);
    } catch (error) {
        next(error);
    }
};

// Премахване на активна санкция
exports.removeActiveSanction = async (req, res, next) => {
    try {
        const studentId = req.params.studentId;
        const sanctionId = req.params.sanctionId;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
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

        // Премахване на санкцията
        sanction.activeSanctions.splice(sanctionIndex, 1);
        sanction.updatedAt = Date.now();
        await sanction.save();

        res.status(200).json(sanction);
    } catch (error) {
        next(error);
    }
};