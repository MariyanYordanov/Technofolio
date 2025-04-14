const { validationResult } = require('express-validator');
const Interest = require('../models/Interest');
const Student = require('../models/Student');

// Получаване на интересите на студент
exports.getStudentInterests = async (req, res, next) => {
    try {
        const studentId = req.params.studentId;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Намиране на интересите
        let interests = await Interest.findOne({ student: studentId });

        // Ако няма записани интереси, връщаме празен обект
        if (!interests) {
            interests = {
                interests: [],
                hobbies: []
            };
        }

        res.status(200).json(interests);
    } catch (error) {
        next(error);
    }
};

// Обновяване на интересите на студент
exports.updateInterests = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: 'Валидационна грешка',
                errors: errors.array()
            });
        }

        const studentId = req.params.studentId;
        const { interests, hobbies } = req.body;

        // Проверка дали студентът съществува
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Студентът не е намерен' });
        }

        // Проверка дали потребителят има права (само собственикът или администратор)
        if (student.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Нямате права да редактирате тези интереси' });
        }

        // Проверка дали интересите съществуват
        let interestsDoc = await Interest.findOne({ student: studentId });

        if (interestsDoc) {
            // Обновяване на съществуващи интереси
            interestsDoc.interests = interests || interestsDoc.interests;
            interestsDoc.hobbies = hobbies || interestsDoc.hobbies;
            interestsDoc.updatedAt = Date.now();
            await interestsDoc.save();
        } else {
            // Създаване на нови интереси
            interestsDoc = await Interest.create({
                student: studentId,
                interests: interests || [],
                hobbies: hobbies || []
            });
        }

        res.status(200).json(interestsDoc);
    } catch (error) {
        next(error);
    }
};