import { validationResult } from 'express-validator';
import Goals from '../models/Goals.js';
import Student from '../models/Student.js';

// Получаване на целите на студент
export async function getStudentGoals(req, res, next) {
    try {
        const studentId = req.params.studentId;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Намиране на целите
        const goals = await Goals.find({ student: studentId });

        // Форматиране на данните за клиентската част
        const formattedGoals = goals.reduce((acc, goal) => {
            if (!acc[goal.category]) {
                acc[goal.category] = {
                    title: getCategoryTitle(goal.category),
                    description: goal.description,
                    activities: goal.activities
                };
            }
            return acc;
        }, {});

        res.status(200).json(formattedGoals);
    } catch (error) {
        next(error);
    }
}

// Помощна функция за заглавия на категории
function getCategoryTitle(category) {
    const titles = {
        personalDevelopment: 'Личностно развитие',
        academicDevelopment: 'Академично развитие',
        profession: 'Професия',
        extracurricular: 'Извънкласна дейност',
        community: 'Общност',
        internship: 'Стаж'
    };
    return titles[category] || category;
}

// Създаване или обновяване на цел
export async function updateGoal(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        const studentId = req.params.studentId;
        const category = req.params.category;
        const { description, activities } = req.body;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права (само собственикът или администратор)
        if (student.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да редактирате тази цел' });
        }

        // Проверка дали целта съществува
        let goal = await Goals.findOne({ student: studentId, category });

        if (goal) {
            // Обновяване на съществуваща цел
            goal.description = description;
            goal.activities = activities;
            goal.updatedAt = Date.now();
            await goal.save();
        } else {
            // Създаване на нова цел
            goal = await Goals.create({
                student: studentId,
                category,
                title: getCategoryTitle(category),
                description,
                activities
            });
        }

        // Получаване на всички цели след обновяването
        const goals = await Goals.find({ student: studentId });

        // Форматиране на данните за клиентската част
        const formattedGoals = goals.reduce((acc, g) => {
            if (!acc[g.category]) {
                acc[g.category] = {
                    title: getCategoryTitle(g.category),
                    description: g.description,
                    activities: g.activities
                };
            }
            return acc;
        }, {});

        res.status(200).json(formattedGoals);
    } catch (error) {
        next(error);
    }
}