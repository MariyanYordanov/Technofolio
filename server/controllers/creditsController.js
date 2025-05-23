// server/controllers/creditsController.js
import { validationResult } from 'express-validator';
import Credit from '../models/Credit.js';
import CreditCategory from '../models/CreditCategory.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import * as notificationService from '../services/notificationService.js';

// Получаване на кредитите нa ученик
export async function getStudentCredits(req, res, next) {
    try {
        const studentId = req.params.studentId;

        // Проверка дали ученикът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Ученикът не е намерен' });
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
        const student = await Student.findOne({ user: req.user.id }).populate('user', 'firstName lastName');
        if (!student) {
            return res.status(404).json({ message: 'Ученическият профил не е намерен' });
        }

        // Създаване на нов кредит
        const credit = await Credit.create({
            student: student._id,
            pillar,
            activity,
            description,
            status: 'pending'
        });

        // Известяване на учители за новата заявка за кредит
        const teachers = await User.find({ role: 'teacher' }).select('_id');

        if (teachers.length > 0) {
            const teacherIds = teachers.map(teacher => teacher._id);

            await notificationService.createBulkNotifications(teacherIds, {
                title: 'Нова заявка за кредит',
                message: `Ученикът ${student.user.firstName} ${student.user.lastName} заяви нов кредит за "${activity}".`,
                type: 'info',
                category: 'credit',
                relatedTo: {
                    model: 'Credit',
                    id: credit._id
                },
                sendEmail: false
            });
        }

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
        const credit = await Credit.findById(creditId).populate({
            path: 'student',
            populate: {
                path: 'user',
                select: 'firstName lastName'
            }
        });

        if (!credit) {
            return res.status(404).json({ message: 'Кредитът не е намерен' });
        }

        // Обновяване на статуса
        credit.status = status;
        credit.validatedBy = req.user.id;
        credit.validationDate = Date.now();
        await credit.save();

        // Известяване на ученика за промяната в статуса
        await notificationService.notifyAboutCreditStatusChange(credit, status);

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

        // Намиране на ученика
        const student = await Student.findById(credit.student);
        if (!student) {
            return res.status(404).json({ message: 'Ученикът не е намерен' });
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

// Получаване на всички кредити (за администратор)
export async function getAllCredits(req, res, next) {
    try {
        // Проверка дали потребителят има права
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ message: 'Нямате права да преглеждате всички кредити' });
        }

        // Параметри за филтриране и пагинация
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const pillar = req.query.pillar;
        const search = req.query.search;

        // Построяване на заявката
        let query = {};

        if (status && ['pending', 'validated', 'rejected'].includes(status)) {
            query.status = status;
        }

        if (pillar && ['Аз и другите', 'Мислене', 'Професия'].includes(pillar)) {
            query.pillar = pillar;
        }

        if (search) {
            query.$or = [
                { activity: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Извършване на заявката с пагинация
        const credits = await Credit.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'student',
                select: 'grade specialization',
                populate: {
                    path: 'user',
                    select: 'firstName lastName'
                }
            })
            .populate('validatedBy', 'firstName lastName');

        // Общ брой на кредитите (за пагинация)
        const total = await Credit.countDocuments(query);

        res.status(200).json({
            success: true,
            count: credits.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            credits
        });
    } catch (error) {
        next(error);
    }
}

// Добавяне на нова категория кредити (за администратор)
export async function addCreditCategory(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        // Проверка дали потребителят има права
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да добавяте категории кредити' });
        }

        const { pillar, name, description } = req.body;

        // Проверка дали категорията вече съществува
        const existingCategory = await CreditCategory.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Категория кредити с това име вече съществува' });
        }

        // Създаване на нова категория
        const category = await CreditCategory.create({
            pillar,
            name,
            description
        });

        res.status(201).json(category);
    } catch (error) {
        next(error);
    }
}

// Изтриване на категория кредити (за администратор)
export async function deleteCreditCategory(req, res, next) {
    try {
        const categoryId = req.params.categoryId;

        // Проверка дали потребителят има права
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да изтривате категории кредити' });
        }

        // Проверка дали категорията се използва
        const creditsWithCategory = await Credit.findOne({ category: categoryId });
        if (creditsWithCategory) {
            return res.status(400).json({ message: 'Тази категория не може да бъде изтрита, защото се използва в кредити' });
        }

        // Изтриване на категорията
        const result = await CreditCategory.deleteOne({ _id: categoryId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Категорията не е намерена' });
        }

        res.status(200).json({ message: 'Категорията е изтрита успешно' });
    } catch (error) {
        next(error);
    }
}