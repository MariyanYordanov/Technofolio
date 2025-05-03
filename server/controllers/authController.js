import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import User from '../models/User.js';
import { JWT_SECRET, JWT_EXPIRE } from '../config/config.js';
import { validationResult } from 'express-validator';

// Регистрация на потребител
export async function register(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName, role } = req.body;

        // Проверка за съществуващ потребител
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Потребител с този имейл вече съществува' });
        }

        // Хеширане на паролата
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Създаване на новия потребител
        const user = new User({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: role || 'student'
        });

        await user.save();

        // Създаване на JWT токен
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRE }
        );

        res.status(201).json({
            message: 'Успешна регистрация',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Грешка на сървъра' });
    }
}

// Вход на потребител
export async function login(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Проверка дали потребителят съществува
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Невалидни данни за вход' });
        }

        // Проверка на паролата
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Невалидни данни за вход' });
        }

        // Създаване на JWT токен
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRE }
        );

        res.status(200).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Грешка на сървъра' });
    }
}

// Получаване на текущия потребител
export async function getMe(req, res) {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Потребителят не е намерен' });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Грешка на сървъра' });
    }
}