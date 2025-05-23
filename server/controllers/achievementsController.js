import { validationResult } from 'express-validator';
import Achievement from '../models/Achievement.js';
import Student from '../models/Student.js';

// Получаване на постиженията на ученик
export async function getStudentAchievements(req, res, next) {
    try {
        const studentId = req.params.studentId;

        // Проверка дали ученикът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Ученикът не е намерен' });
        }

        // Намиране на постиженията
        const achievements = await Achievement.find({ student: studentId })
            .sort({ date: -1 });

        res.status(200).json(achievements);
    } catch (error) {
        next(error);
    }
}

// Добавяне на ново постижение
export async function addAchievement(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        const studentId = req.params.studentId;
        const { category, title, description, date, place, issuer } = req.body;

        // Проверка дали ученикът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Ученикът не е намерен' });
        }

        // Проверка дали потребителят има права (само собственикът или администратор)
        if (student.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да добавяте постижения за този ученик' });
        }

        // Създаване на ново постижение
        const achievement = await Achievement.create({
            student: studentId,
            category,
            title,
            description: description || '',
            date: new Date(date),
            place: place || '',
            issuer: issuer || ''
        });

        res.status(201).json(achievement);
    } catch (error) {
        next(error);
    }
}

// Изтриване на постижение
export async function removeAchievement(req, res, next) {
    try {
        const studentId = req.params.studentId;
        const achievementId = req.params.achievementId;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Ученикът не е намерен' });
        }

        // Намиране на постижението
        const achievement = await Achievement.findById(achievementId);
        if (!achievement) {
            return res.status(404).json({ message: 'Постижението не е намерено' });
        }

        // Проверка дали постижението принадлежи на правилния студент
        if (achievement.student.toString() !== studentId) {
            return res.status(400).json({ message: 'Постижението не принадлежи на този ученик' });
        }

        // Проверка дали потребителят има права (само собственикът или администратор)
        if (student.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да изтривате постижения за този ученик' });
        }

        // Изтриване на постижението - .remove() е остарял метод
        await Achievement.deleteOne({ _id: achievementId });

        res.status(200).json({ message: 'Постижението е изтрито успешно' });
    } catch (error) {
        next(error);
    }
}