const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Student = require("../models/Student");
const { validationResult } = require("express-validator");
require("dotenv").config();

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: "2h" }
    );
};

// Регистрация
const register = async (req, res) => {
    try {
        // Проверка на валидационните грешки
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({
                message: "Validation failed",
                errors: errors.array()
            });
        }

        const { email, password, firstName, lastName, role, grade, specialization } = req.body;

        // Проверка дали потребителя не съществува вече
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Хеширане на паролата
        const hashedPassword = await bcrypt.hash(password, 10);

        // Създаване на потребител
        const user = await User.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: role || "student"
        });

        // Ако ролята е "student", създаваме и студентски профил
        if (role === "student" && grade && specialization) {
            await Student.create({
                user: user._id,
                grade,
                specialization,
                averageGrade: 2
            });
        }

        // Генериране на токен
        const token = generateToken(user);

        // Успех
        res.status(201).json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({
            message: "Server error during registration",
            error: err.message
        });
    }
};

// Вход
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Намиране на потребителя
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Проверка на паролата
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Генериране на токен
        const token = generateToken(user);

        // Успех
        res.status(200).json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({
            message: "Server error during login",
            error: err.message
        });
    }
};

// Заявка за линк за вход чрез имейл
const requestLoginLink = async (req, res) => {
    try {
        const { email } = req.body;

        // Проверка дали потребителят съществува
        const user = await User.findOne({ email });
        if (!user) {
            // За сигурност не разкриваме дали имейлът съществува
            return res.status(200).json({
                message: "Ако имейлът съществува, ще получите линк за вход."
            });
        }

        // Генериране на токен за едократна употреба с кратък живот
        const loginToken = jwt.sign(
            { id: user._id, email: user.email, purpose: 'login' },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: "15m" }
        );

        // Тук бихте изпратили имейл с линка, но за демонстрация само връщаме токена
        // В реално приложение, използвайте библиотека като nodemailer за изпращане на имейли

        console.log(`Login link token for ${email}: ${loginToken}`);

        res.status(200).json({
            message: "Линк за вход е изпратен на вашия имейл."
        });
    } catch (err) {
        console.error("Request login link error:", err);
        res.status(500).json({
            message: "Грешка при обработка на заявката за вход чрез имейл",
            error: err.message
        });
    }
};

// Проверка на токен от имейл линк
const verifyEmailLogin = async (req, res) => {
    try {
        const { token } = req.body;

        // Проверка на токена
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        } catch (err) {
            return res.status(401).json({ message: "Невалиден или изтекъл токен" });
        }

        // Проверка дали токенът е за вход
        if (decoded.purpose !== 'login') {
            return res.status(401).json({ message: "Невалиден тип токен" });
        }

        // Намиране на потребителя
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "Потребителят не е намерен" });
        }

        // Генериране на постоянен токен за сесията
        const accessToken = generateToken(user);

        // Връщане на данните за потребителя и токена
        res.status(200).json({
            token: accessToken,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (err) {
        console.error("Email login verification error:", err);
        res.status(500).json({
            message: "Грешка при проверка на имейл линк",
            error: err.message
        });
    }
};

// Потвърждаване на регистрация чрез имейл
const confirmRegistration = async (req, res) => {
    try {
        const { token } = req.body;

        // Проверка на токена
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        } catch (err) {
            return res.status(401).json({ message: "Невалиден или изтекъл токен" });
        }

        // Проверка дали токенът е за регистрация
        if (decoded.purpose !== 'registration') {
            return res.status(401).json({ message: "Невалиден тип токен" });
        }

        // Намиране и активиране на потребителя
        const user = await User.findByIdAndUpdate(
            decoded.id,
            { isActive: true },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "Потребителят не е намерен" });
        }

        // Генериране на постоянен токен за сесията
        const accessToken = generateToken(user);

        res.status(200).json({
            token: accessToken,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                isActive: user.isActive
            }
        });
    } catch (err) {
        console.error("Registration confirmation error:", err);
        res.status(500).json({
            message: "Грешка при потвърждаване на регистрацията",
            error: err.message
        });
    }
};

// Изход (минимално обработване, тъй като се управлява от клиента)
const logout = async (req, res) => {
    res.status(200).json({ message: "Logout successful" });
};

// Информация за текущия потребител
const getMe = async (req, res) => {
    try {
        // Потребителят е добавен от middleware за автентикация
        if (!req.user) {
            return res.status(401).json({ message: "Не сте автентикирани" });
        }

        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "Потребителят не е намерен" });
        }

        // Ако е студент, взимаме и студентската информация
        let studentInfo = null;
        if (user.role === 'student') {
            studentInfo = await Student.findOne({ user: user._id });
        }

        res.status(200).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            studentInfo
        });
    } catch (err) {
        console.error("Get user error:", err);
        res.status(500).json({
            message: "Грешка при получаване на информация за потребителя",
            error: err.message
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    getMe,
    requestLoginLink,
    verifyEmailLogin,
    confirmRegistration
};