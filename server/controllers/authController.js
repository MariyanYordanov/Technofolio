// server/controllers/authController.js
import User, { findOne, findById } from '../models/User';
import { verify, sign } from 'jsonwebtoken';
import { hash } from 'bcryptjs';
import { JWT_SECRET, JWT_EXPIRE } from '../config/config';
import { sendVerificationEmail, sendLoginLinkEmail } from '../services/emailService';
import { validationResult } from 'express-validator';

// Регистрация на потребител
export async function register(req, res) {
    try {
        // Проверка за валидационни грешки
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const { email, password, firstName, lastName, role, grade, specialization } = req.body;

        // Проверка дали потребителят вече съществува
        const existingUser = await findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Потребител с този имейл вече съществува' });
        }

        // Хеширане на паролата
        const hashedPassword = await hash(password, 12);

        // Създаване на нов потребител
        const userData = {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: role || 'student',
            emailVerified: false,
        };

        // Добавяне на grade и specialization, ако ролята е 'student'
        if (role === 'student' || !role) {
            userData.grade = grade;
            userData.specialization = specialization;
        }

        const user = new User(userData);
        await user.save();

        // Изпращане на имейл за потвърждение
        await sendVerificationEmail(user);

        res.status(201).json({
            message: 'Регистрацията е успешна! Проверете вашия имейл за потвърждение.',
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Възникна грешка при регистрацията' });
    }
}

// Потвърждаване на имейл
export async function confirmEmail(req, res) {
    try {
        const { token } = req.params;

        // Верифициране на токена
        const decoded = verify(token, JWT_SECRET);

        // Намиране на потребителя
        const user = await findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'Невалидни данни за вход' });
        }

        // Маркиране на имейла като потвърден
        user.emailVerified = true;
        await user.save();

        // Създаване на JWT токен за автентикация
        const authToken = sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRE }
        );

        res.status(200).json({
            message: 'Имейлът е потвърден успешно',
            token: authToken,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Email confirmation error:', error);
        res.status(400).json({ message: 'Невалиден или изтекъл токен' });
    }
}

// Заявка за изпращане на линк за вход
export async function requestLoginLink(req, res) {
    try {
        const { email } = req.body;

        // Намиране на потребителя
        const user = await findOne({ email });

        if (!user) {
            // За сигурност не разкриваме дали имейлът съществува
            return res.status(200).json({ message: 'Ако имейлът съществува, линк за вход ще бъде изпратен' });
        }

        // Проверка дали имейлът е потвърден
        if (!user.emailVerified) {
            // Изпращаме отново имейл за потвърждение
            await sendVerificationEmail(user);
            return res.status(200).json({
                message: 'Имейлът ви не е потвърден. Изпратихме нов линк за потвърждение.'
            });
        }

        // Изпращане на линк за вход
        await sendLoginLinkEmail(user);

        res.status(200).json({ message: 'Линк за вход е изпратен на вашия имейл' });
    } catch (error) {
        console.error('Request login link error:', error);
        res.status(500).json({ message: 'Възникна грешка при изпращане на линк за вход' });
    }
}

// Вход с линк от имейл
export async function verifyEmailLogin(req, res) {
    try {
        const { token } = req.params;

        // Верифициране на токена
        const decoded = verify(token, JWT_SECRET);

        // Намиране на потребителя
        const user = await findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: 'Невалидни данни за вход' });
        }

        // Проверка дали имейлът е потвърден
        if (!user.emailVerified) {
            return res.status(400).json({ message: 'Имейлът не е потвърден' });
        }

        // Обновяване на времето на последен вход
        user.lastLoginAt = Date.now();
        await user.save();

        // Създаване на JWT токен за автентикация
        const authToken = sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRE }
        );

        res.status(200).json({
            message: 'Успешен вход',
            token: authToken,
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Email login verification error:', error);
        res.status(400).json({ message: 'Невалиден или изтекъл токен' });
    }
}

// Останалите функции от контролера...