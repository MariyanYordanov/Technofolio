const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Регистрация - тъй като Auth.js не включва регистрация, трябва да я имплементираме
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Моля въведете валиден email'),
        body('password').isLength({ min: 6 }).withMessage('Паролата трябва да е минимум 6 символа'),
        body('firstName').notEmpty().withMessage('Името е задължително'),
        body('lastName').notEmpty().withMessage('Фамилията е задължителна')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: errors.array()[0].msg });
            }

            const { email, password, role, firstName, lastName } = req.body;

            // Проверка за съществуващ потребител
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Потребител с този имейл вече съществува" });
            }

            // Хеширане на паролата
            const hashedPassword = await bcrypt.hash(password, 10);

            // Създаване на потребител
            const user = await User.create({
                email,
                password: hashedPassword,
                role: role || "student",
                firstName,
                lastName
            });

            res.status(201).json({
                message: 'Регистрацията е успешна!',
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName
                }
            });
        } catch (err) {
            console.error('Грешка при регистрация:', err);
            res.status(500).json({ message: "Грешка при регистрацията", error: err.message });
        }
    }
);

module.exports = router;