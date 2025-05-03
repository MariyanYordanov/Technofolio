import { validationResult } from 'express-validator';
import Credit from '../models/Credit.js';
import CreditCategory from '../models/CreditCategory.js';
import Student from '../models/Student.js';

// Получаване на кредитите на студент
export async function getStudentCredits(req, res, next) {
    try {
        const studentId = req.params.studentId;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права
        if (student.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Нямате права да преглеждате тези кредити' });
        }

        // Намиране на кредитите
        const credits = await Credit.find({ student: studentId })
            .populate('validatedBy', 'firstName lastName');

        res.status(200).json(credits);
    } catch (error) {
        next(error);
    }
}

// Получаване на категориите кредити
export async function getCreditCategories(req, res, next) {
    try {
        const categories = await CreditCategory.find().sort({ pillar: 1, name: 1 });

        res.status(200).json(categories);
    } catch (error) {
        next(error);
    }
}

// Добавяне на нов кредит
export async function addCredit(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        const { pillar, activity, description } = req.body;

        // Проверка дали студентът съществува
        const student = await Student.findOne({ user: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Студентският профил не е намерен' });
        }

        // Създаване на нов кредит
        const credit = await Credit.create({
            student: student._id,
            pillar,
            activity,
            description,
            status: 'pending'
        });

        res.status(201).json(credit);
    } catch (error) {
        next(error);
    }
}

// Валидиране на кредит (само за учители и администратори)
export async function validateCredit(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        const creditId = req.params.creditId;
        const { status } = req.body;

        // Проверка дали потребителят има права
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да валидирате кредити' });
        }

        // Намиране на кредита
        const credit = await Credit.findById(creditId);

        if (!credit) {
            return res.status(404).json({ message: 'Кредитът не е намерен' });
        }

        // Обновяване на статуса
        credit.status = status;
        credit.validatedBy = req.user.id;
        credit.validationDate = Date.now();
        await credit.save();

        res.status(200).json(credit);
    } catch (error) {
        next(error);
    }
}

// Изтриване на кредит
export async function deleteCredit(req, res, next) {
    try {
        const creditId = req.params.creditId;

        // Намиране на кредита
        const credit = await Credit.findById(creditId);

        if (!credit) {
            return res.status(404).json({ message: 'Кредитът не е намерен' });
        }

        // Намиране на студента
        const student = await Student.findById(credit.student);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права (само собственикът или администратор)
        if (student.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да изтривате този кредит' });
        }
        // Проверка дали кредитът е валидиран
        if (credit.status === 'validated' && req.user.role !== 'admin') {
            return res.status(400).json({ message: 'Не можете да изтриете валидиран кредит' });
        }

        // Изтриване на кредита
        await Credit.deleteOne({ _id: creditId });

        res.status(200).json({ message: 'Кредитът е изтрит успешно' });
    } catch (error) {
        next(error);
    }
}