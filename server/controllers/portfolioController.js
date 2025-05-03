import { validationResult } from 'express-validator';
import Portfolio from '../models/Portfolio.js';
import Student from '../models/Student.js';

// Получаване на портфолио на студент
export async function getStudentPortfolio(req, res, next) {
    try {
        const studentId = req.params.studentId;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Намиране на портфолиото
        let portfolio = await Portfolio.findOne({ student: studentId }).populate('mentorId', 'firstName lastName specialization');

        // Ако няма портфолио, създаваме празно
        if (!portfolio) {
            portfolio = await Portfolio.create({
                student: studentId,
                experience: '',
                projects: '',
                recommendations: []
            });
        }

        res.status(200).json(portfolio);
    } catch (error) {
        next(error);
    }
}

// Обновяване на портфолио
export async function updatePortfolio(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        const studentId = req.params.studentId;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права (само собственикът или администратор)
        if (student.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да редактирате това портфолио' });
        }

        const { experience, projects, mentorId } = req.body;

        // Проверка дали портфолиото съществува
        let portfolio = await Portfolio.findOne({ student: studentId });

        if (portfolio) {
            // Обновяване на съществуващо портфолио
            portfolio.experience = experience || portfolio.experience;
            portfolio.projects = projects || portfolio.projects;
            portfolio.mentorId = mentorId || portfolio.mentorId;
            portfolio.updatedAt = Date.now();

            await portfolio.save();
        } else {
            // Създаване на ново портфолио
            portfolio = await Portfolio.create({
                student: studentId,
                experience: experience || '',
                projects: projects || '',
                mentorId: mentorId || null
            });
        }

        res.status(200).json(portfolio);
    } catch (error) {
        next(error);
    }
}

// Добавяне на препоръка към портфолио
export async function addRecommendation(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        const studentId = req.params.studentId;
        const { text, author } = req.body;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Намиране на портфолиото
        let portfolio = await Portfolio.findOne({ student: studentId });

        if (!portfolio) {
            // Създаване на ново портфолио, ако не съществува
            portfolio = await Portfolio.create({
                student: studentId,
                experience: '',
                projects: '',
                recommendations: [{ text, author }]
            });
        } else {
            // Добавяне на препоръка към съществуващо портфолио
            portfolio.recommendations.push({ text, author });
            portfolio.updatedAt = Date.now();
            await portfolio.save();
        }

        res.status(201).json(portfolio);
    } catch (error) {
        next(error);
    }
}

// Изтриване на препоръка от портфолио
export async function removeRecommendation(req, res, next) {
    try {
        const studentId = req.params.studentId;
        const recommendationId = req.params.recommendationId;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права (само собственикът или администратор)
        if (student.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да редактирате това портфолио' });
        }

        // Намиране на портфолиото
        const portfolio = await Portfolio.findOne({ student: studentId });

        if (!portfolio) {
            return res.status(404).json({ message: 'Портфолиото не е намерено' });
        }

        // Намиране на индекса на препоръката
        const recommendationIndex = portfolio.recommendations.findIndex(
            rec => rec._id.toString() === recommendationId
        );

        if (recommendationIndex === -1) {
            return res.status(404).json({ message: 'Препоръката не е намерена' });
        }

        // Премахване на препоръката
        portfolio.recommendations.splice(recommendationIndex, 1);
        portfolio.updatedAt = Date.now();
        await portfolio.save();

        res.status(200).json(portfolio);
    } catch (error) {
        next(error);
    }
}