// server/routes/authRoutes.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';  // Не забравяй да добавиш .js разширението
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d';

// Middleware за проверка на автентикация
const authMiddleware = (req, res, next) => {
    // Взимаме токена от хедъра на заявката
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Не е предоставен token за достъп' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Проверяваме валидността на токена
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ message: 'Невалиден token за достъп' });
    }
};

// GET /api/auth/me - Вземане на информация за текущо логнатия потребител
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Потребителят не е намерен' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Грешка при извличане на данни за потребителя' });
    }
});

// POST /api/auth/register - Регистрация на нов потребител
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Моля въведете валиден email'),
        body('password').isLength({ min: 6 }).withMessage('Паролата трябва да е минимум 6 символа'),
        body('firstName').notEmpty().withMessage('Името е задължително'),
        body('lastName').notEmpty().withMessage('Фамилията е задължителна'),
        body('role').isIn(['student', 'teacher', 'admin']).withMessage('Невалидна роля')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: errors.array()[0].msg });
            }

            const { email, password, role, firstName, lastName, grade, specialization } = req.body;

            // Проверка за съществуващ потребител
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Потребител с този имейл вече съществува" });
            }

            // Хеширане на паролата
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Създаване на потребител
            const user = new User({
                email,
                password: hashedPassword,
                role: role || "student",
                firstName,
                lastName
            });

            // Добавяме допълнителни полета за ученици
            if (role === 'student' && grade && specialization) {
                user.studentInfo = {
                    grade,
                    specialization
                };
            }

            await user.save();

            // Създаваме JWT токен
            const payload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });

            res.status(201).json({
                message: 'Регистрацията е успешна!',
                user: {
                    _id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    studentInfo: user.studentInfo
                },
                accessToken: token
            });
        } catch (err) {
            console.error('Грешка при регистрация:', err);
            res.status(500).json({ message: "Грешка при регистрацията", error: err.message });
        }
    }
);

// POST /api/auth/login - Вход в системата
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Моля въведете валиден email'),
        body('password').notEmpty().withMessage('Моля въведете парола')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: errors.array()[0].msg });
            }

            const { email, password } = req.body;

            // Намираме потребителя
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Невалидни данни за вход' });
            }

            // Проверяваме паролата
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Невалидни данни за вход' });
            }

            // Създаваме JWT токен
            const payload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });

            res.json({
                user: {
                    _id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    studentInfo: user.studentInfo
                },
                accessToken: token
            });
        } catch (err) {
            console.error('Грешка при вход:', err);
            res.status(500).json({ message: 'Грешка при вход в системата', error: err.message });
        }
    }
);

// POST /api/auth/request-login-link - Изпращане на линк за вход чрез имейл
router.post(
    '/request-login-link',
    [
        body('email').isEmail().withMessage('Моля въведете валиден email')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: errors.array()[0].msg });
            }

            const { email } = req.body;

            // Проверяваме дали потребителят съществува
            const user = await User.findOne({ email });
            if (!user) {
                // За сигурност не разкриваме дали имейлът съществува
                return res.json({ message: 'Ако имейлът съществува, ще получите линк за вход' });
            }

            // Създаваме временен токен с кратък живот
            const token = jwt.sign(
                { id: user.id, email: user.email, purpose: 'email-login' },
                JWT_SECRET,
                { expiresIn: '15m' }
            );

            // TODO: Имплементирай изпращане на имейл с линк
            // Тук можеш да използваш nodemailer или друга библиотека
            // за изпращане на имейли
            console.log(`Email login link for ${email}: http://localhost:5173/login/email?token=${token}`);

            res.json({ message: 'Ако имейлът съществува, ще получите линк за вход' });
        } catch (err) {
            console.error('Грешка при заявка за имейл вход:', err);
            res.status(500).json({ message: 'Грешка при обработка на заявката', error: err.message });
        }
    }
);

// GET /api/auth/verify-email - Проверка на токен от имейл линк
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ message: 'Липсващ токен' });
        }

        try {
            // Проверяваме валидността на токена
            const decoded = jwt.verify(token, JWT_SECRET);

            // Проверяваме дали токенът е създаден за имейл вход
            if (decoded.purpose !== 'email-login') {
                return res.status(401).json({ message: 'Невалиден токен' });
            }

            // Намираме потребителя
            const user = await User.findById(decoded.id);
            if (!user || user.email !== decoded.email) {
                return res.status(404).json({ message: 'Потребителят не е намерен' });
            }

            // Създаваме нов токен за автентикация
            const payload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });

            res.json({
                user: {
                    _id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    studentInfo: user.studentInfo
                },
                accessToken
            });
        } catch (error) {
            console.error('Грешка при верификация на имейл:', error);
            return res.status(401).json({ message: 'Невалиден или изтекъл токен' });
        }
    } catch (err) {
        console.error('Грешка при верификация на имейл:', err);
        res.status(500).json({ message: 'Грешка при обработка на заявката', error: err.message });
    }
});

// POST /api/auth/logout - Изход от системата
router.post('/logout', (req, res) => {
    // На клиента трябва да изчистим токена от localStorage
    // На сървъра не е нужно да правим нищо повече
    res.json({ message: 'Успешен изход от системата' });
});

// GET /api/auth/confirm-registration - Потвърждаване на регистрация
router.get('/confirm-registration', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ message: 'Липсващ токен' });
        }

        try {
            // Проверяваме валидността на токена
            const decoded = jwt.verify(token, JWT_SECRET);

            // Проверяваме дали токенът е за потвърждаване на регистрация
            if (decoded.purpose !== 'confirm-registration') {
                return res.status(401).json({ message: 'Невалиден токен' });
            }

            // Намираме потребителя
            const user = await User.findById(decoded.id);
            if (!user || user.email !== decoded.email) {
                return res.status(404).json({ message: 'Потребителят не е намерен' });
            }

            // Отбелязваме потребителя като потвърден
            user.emailConfirmed = true;
            await user.save();

            // Създаваме нов токен за автентикация
            const payload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });

            res.json({
                message: 'Регистрацията е потвърдена успешно!',
                user: {
                    _id: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    studentInfo: user.studentInfo
                },
                accessToken
            });
        } catch (error) {
            console.error('Грешка при потвърждаване на регистрация:', error);
            return res.status(401).json({ message: 'Невалиден или изтекъл токен' });
        }
    } catch (err) {
        console.error('Грешка при потвърждаване на регистрация:', err);
        res.status(500).json({ message: 'Грешка при обработка на заявката', error: err.message });
    }
});

export default router;