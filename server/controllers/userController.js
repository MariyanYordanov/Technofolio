// server/controllers/userController.js
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';

// Получаване на всички потребители (с пагинация и филтри)
export const getAllUsers = catchAsync(async (req, res, next) => {
    // Извличане на параметри от заявката
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const role = req.query.role;
    const search = req.query.search;

    // Създаване на query обект
    let query = {};

    // Добавяне на филтър по роля
    if (role && ['student', 'teacher', 'admin'].includes(role)) {
        query.role = role;
    }

    // Добавяне на филтър по име или имейл
    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    // Извършване на заявката
    const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Общ брой потребители за пагинация
    const total = await User.countDocuments(query);

    res.status(200).json({
        success: true,
        count: users.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        users
    });
});

// Получаване на потребител по ID
export const getUserById = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('Потребителят не е намерен', 404));
    }

    // Ако потребителят е ученик, вземаме допълнителна информация от Student модела
    let studentData = null;
    if (user.role === 'student') {
        studentData = await Student.findOne({ user: user._id });
    }

    res.status(200).json({
        success: true,
        user,
        studentData
    });
});

// Създаване на нов потребител (от админ)
export const createUser = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { email, password, firstName, lastName, role } = req.body;

    // Проверка за съществуващ потребител
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('Потребител с този имейл вече съществува', 400));
    }

    // Създаване на потребител
    const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role: role || 'student',
        emailConfirmed: true // Админи могат да създават потвърдени потребители директно
    });

    res.status(201).json({
        success: true,
        user
    });
});

// Обновяване на потребител
export const updateUser = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { firstName, lastName, role, accountLocked, emailConfirmed } = req.body;

    // Намиране на потребителя
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('Потребителят не е намерен', 404));
    }

    // Проверка дали админ се опитва да промени друг админ
    if (user.role === 'admin' && req.user.id !== user.id) {
        return next(new AppError('Администратор не може да променя данните на друг администратор', 403));
    }

    // Обновяване на полетата
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role && ['student', 'teacher', 'admin'].includes(role)) user.role = role;
    if (accountLocked !== undefined) user.accountLocked = accountLocked;
    if (emailConfirmed !== undefined) user.emailConfirmed = emailConfirmed;

    // Запазване на промените
    await user.save();

    res.status(200).json({
        success: true,
        user
    });
});

// Задаване на нова парола на потребител (от админ)
export const resetUserPassword = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('Потребителят не е намерен', 404));
    }

    // Проверка дали админ се опитва да промени паролата на друг админ
    if (user.role === 'admin' && req.user.id !== user.id) {
        return next(new AppError('Администратор не може да променя паролата на друг администратор', 403));
    }

    // Задаване на нова парола
    user.password = password;
    user.passwordChangedAt = Date.now();
    user.accountLocked = false;
    user.incorrectLoginAttempts = 0;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Паролата е успешно променена'
    });
});

// Изтриване на потребител
export const deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('Потребителят не е намерен', 404));
    }

    // Проверка дали админ се опитва да изтрие друг админ
    if (user.role === 'admin') {
        return next(new AppError('Администратор не може да бъде изтрит', 403));
    }

    // Изтриване на свързани данни (студентски профил, ако е ученик)
    if (user.role === 'student') {
        await Student.deleteOne({ user: user._id });
        // Тук можете да добавите изтриване на други свързани данни (кредити, цели, и т.н.)
    }

    // Изтриване на потребителя
    await User.deleteOne({ _id: user._id });

    res.status(200).json({
        success: true,
        message: 'Потребителят е успешно изтрит'
    });
});

// Смяна на ролята на потребител
export const changeUserRole = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('Потребителят не е намерен', 404));
    }

    // Проверка дали админ се опитва да променя ролята на друг админ
    if (user.role === 'admin' && req.user.id !== user.id) {
        return next(new AppError('Администратор не може да променя ролята на друг администратор', 403));
    }

    // Валидиране на ролята
    if (!['student', 'teacher', 'admin'].includes(role)) {
        return next(new AppError('Невалидна роля', 400));
    }

    // Смяна на ролята
    user.role = role;
    await user.save();

    res.status(200).json({
        success: true,
        user
    });
});

// Получаване на статистика за потребителите
export const getUsersStats = catchAsync(async (req, res, next) => {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const registrationsThisMonth = await User.countDocuments({
        createdAt: { $gte: new Date(new Date().setDate(1)) }
    });

    res.status(200).json({
        success: true,
        stats: {
            totalUsers,
            totalStudents,
            totalTeachers,
            totalAdmins,
            registrationsThisMonth
        }
    });
});