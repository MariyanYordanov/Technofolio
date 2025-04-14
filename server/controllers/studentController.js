const { validationResult } = require('express-validator');
const Student = require('../models/Student');
const User = require('../models/User');

// Създаване на студентски профил
exports.createStudentProfile = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        // Проверка дали потребителят вече има профил
        const existingStudent = await Student.findOne({ user: req.user.id });
        if (existingStudent) {
            return res.status(400).json({ message: 'Потребителят вече има студентски профил' });
        }

        const { grade, specialization, averageGrade, imageUrl } = req.body;

        const studentProfile = await Student.create({
            user: req.user.id,
            grade,
            specialization,
            averageGrade: averageGrade || 2,
            imageUrl: imageUrl || '/default-avatar.png'
        });

        res.status(201).json(studentProfile);
    } catch (error) {
        next(error);
    }
};

// Получаване на студентски профил по userId
exports.getStudentProfileByUserId = async (req, res, next) => {
    try {
        const student = await Student.findOne({ user: req.params.userId });

        if (!student) {
            return res.status(404).json({ message: 'Студентският профил не е намерен' });
        }

        res.status(200).json(student);
    } catch (error) {
        next(error);
    }
};

// Получаване на профила на текущия студент
exports.getCurrentStudentProfile = async (req, res, next) => {
    try {
        const student = await Student.findOne({ user: req.user.id });

        if (!student) {
            return res.status(404).json({ message: 'Студентският профил не е намерен' });
        }

        res.status(200).json(student);
    } catch (error) {
        next(error);
    }
};

// Обновяване на студентски профил
exports.updateStudentProfile = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        const { grade, specialization, averageGrade, imageUrl } = req.body;

        const student = await Student.findOne({ user: req.user.id });

        if (!student) {
            return res.status(404).json({ message: 'Студентският профил не е намерен' });
        }

        // Обновяване на полетата
        if (grade) student.grade = grade;
        if (specialization) student.specialization = specialization;
        if (averageGrade) student.averageGrade = averageGrade;
        if (imageUrl) student.imageUrl = imageUrl;

        await student.save();

        res.status(200).json(student);
    } catch (error) {
        next(error);
    }
};

// Изтриване на студентски профил
exports.deleteStudentProfile = async (req, res, next) => {
    try {
        const student = await Student.findOne({ user: req.user.id });

        if (!student) {
            return res.status(404).json({ message: 'Студентският профил не е намерен' });
        }

        await student.remove();

        res.status(200).json({ message: 'Студентският профил е изтрит успешно' });
    } catch (error) {
        next(error);
    }
};