// server/controllers/authController.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import config from '../config/config.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { findDocumentOrFail } from '../utils/dbUtils.js';
import { sendEmail } from '../utils/email.js';

// Помощна функция за създаване на JWT токен
const signToken = (id) => {
    return jwt.sign({ id }, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRE
    });
};

// Помощна функция за създаване на refresh токен
const signRefreshToken = (id) => {
    return jwt.sign({ id }, config.REFRESH_TOKEN_SECRET, {
        expiresIn: config.REFRESH_TOKEN_EXPIRE
    });
};

// Функция за изпращане на токените като отговор
const sendTokenResponse = (user, statusCode, res) => {
    // Създаване на access token
    const token = signToken(user._id);

    // Създаване на refresh token
    const refreshToken = signRefreshToken(user._id);

    // Запазване на refresh token в базата данни
    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    // Cookie опции
    const cookieOptions = {
        expires: new Date(Date.now() + parseInt(config.JWT_EXPIRE) * 60 * 1000),
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    // Опции за refresh token cookie
    const refreshCookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дни
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    // Изпращане на cookies
    res.cookie('token', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    // Връщане на отговор
    res.status(statusCode).json({
        success: true,
        accessToken: token, // Връщаме токена и в JSON формат за клиенти, които използват localStorage
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            studentInfo: user.studentInfo
        }
    });
};

// Регистрация на потребител
export const register = catchAsync(async (req, res, next) => {
    const { email, password, firstName, lastName, role, grade, specialization } = req.body;

    // Проверка за съществуващ потребител
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('Потребител с този имейл вече съществува', 400));
    }

    // Валидиране на паролата
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return next(new AppError('Паролата трябва да съдържа минимум 8 символа, включително главна буква, малка буква и цифра', 400));
    }

    // Създаване на потребител
    const userData = {
        email,
        password,
        firstName,
        lastName,
        role: role || 'student',
        emailConfirmed: true // За улеснение при разработка, но в продукция трябва да е false
    };

    // Добавяне на studentInfo, ако ролята е student
    if ((role === 'student' || !role) && grade && specialization) {
        userData.studentInfo = {
            grade: Number(grade),
            specialization,
            averageGrade: 2
        };
    }

    const user = await User.create(userData);

    // Генериране на токен за потвърждение на имейла в реално приложение
    // В режим на разработка, автоматично потвърждаваме имейла

    // Връщане на отговор с JWT токен
    sendTokenResponse(user, 201, res);
});

// Вход на потребител
export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Проверка дали имейлът и паролата са предоставени
    if (!email || !password) {
        return next(new AppError('Моля, въведете имейл и парола', 400));
    }

    // Намиране на потребителя
    const user = await User.findOne({ email }).select('+password');

    // Проверка дали потребителят съществува
    if (!user) {
        return next(new AppError('Невалидни данни за вход', 401));
    }

    // Проверка дали акаунтът е заключен
    if (user.accountLocked) {
        return next(new AppError('Акаунтът е заключен поради твърде много неуспешни опити. Моля, опитайте по-късно или нулирайте паролата си.', 401));
    }

    // Проверка на паролата
    const isMatch = await user.checkPassword(password);

    if (!isMatch) {
        // Увеличаване на брояча на неуспешни опити
        user.incorrectLoginAttempts += 1;
        user.lastLoginAttempt = Date.now();

        // Заключване на акаунта след 5 неуспешни опита
        if (user.incorrectLoginAttempts >= 5) {
            user.accountLocked = true;
            await user.save();
            return next(new AppError('Акаунтът е заключен поради твърде много неуспешни опити. Моля, опитайте по-късно или нулирайте паролата си.', 401));
        }

        await user.save();
        return next(new AppError('Невалидни данни за вход', 401));
    }

    // Нулиране на брояча на неуспешни опити
    user.incorrectLoginAttempts = 0;
    user.lastLoginAttempt = Date.now();
    await user.save();

    // Временно прескачане на проверката за emailConfirmed в режим на разработка
    // В продукция тук трябва да има проверка дали имейлът е потвърден
    /*
    if (!user.emailConfirmed) {
        return next(new AppError('Моля, потвърдете имейла си преди да влезете в системата.', 401));
    }
    */

    // Връщане на отговор с JWT токен
    sendTokenResponse(user, 200, res);
});

// Получаване на текущия потребител
export const getMe = catchAsync(async (req, res, next) => {
    // req.user се попълва от authMiddleware
    if (!req.user) {
        return next(new AppError('Не сте влезли в профила си. Моля, влезте, за да получите достъп.', 401));
    }

    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new AppError('Потребителят не е намерен', 404));
    }

    res.status(200).json({
        success: true,
        user
    });
});

// Изход от системата
export const logout = catchAsync(async (req, res, next) => {
    // Изчистване на cookies
    res.clearCookie('token');
    res.clearCookie('refreshToken');

    // Изтриване на refresh token от базата данни
    if (req.user) {
        await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    }

    res.status(200).json({
        success: true,
        message: 'Успешен изход от системата'
    });
});

// Заявка за изпращане на линк за вход
export const requestLoginLink = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return next(new AppError('Моля, въведете валиден имейл', 400));
    }

    // Проверка дали потребителят съществува
    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('Потребител с този имейл не е намерен', 404));
    }

    // Генериране на JWT токен за имейл линк
    const token = jwt.sign(
        { id: user._id, email: user.email, purpose: 'email-login' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // URL за имейл вход
    const loginURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login/email?token=${token}`;

    // Изпращане на имейл с линк за вход
    try {
        await sendEmail({
            email: user.email,
            subject: 'Линк за вход в Технофолио',
            text: `Здравейте ${user.firstName},\n\nЗа да влезете в своя профил в Технофолио, моля, използвайте следния линк: ${loginURL}\n\nЛинкът е валиден за 1 час.\n\nПоздрави,\nЕкипът на Технофолио`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #4a4a4a; text-align: center;">Линк за вход в Технофолио</h2>
                    <p>Здравейте ${user.firstName},</p>
                    <p>За да влезете в своя профил в Технофолио, моля, използвайте бутона по-долу:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${loginURL}" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Вход в системата</a>
                    </div>
                    <p>Линкът е валиден за 1 час.</p>
                    <p style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 10px; font-size: 12px; color: #777;">
                        С уважение,<br>
                        Екипът на Технофолио
                    </p>
                </div>
            `
        });

        res.status(200).json({
            success: true,
            message: 'Линк за вход е изпратен на вашия имейл!'
        });
    } catch (error) {
        console.error('Грешка при изпращане на имейл:', error);
        return next(new AppError('Не успяхме да изпратим имейл. Моля, опитайте отново по-късно.', 500));
    }
});

// Потвърждаване на имейл линк за вход
export const verifyEmailLogin = catchAsync(async (req, res, next) => {
    const { token } = req.query;

    if (!token) {
        return next(new AppError('Липсващ или невалиден токен', 400));
    }

    try {
        // Проверка на токена
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Проверка дали токенът е за имейл вход
        if (decoded.purpose !== 'email-login') {
            return next(new AppError('Невалиден токен', 400));
        }

        // Намиране на потребителя
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new AppError('Потребителят не е намерен', 404));
        }

        // Проверка дали имейлът съвпада
        if (user.email !== decoded.email) {
            return next(new AppError('Невалиден токен', 400));
        }

        // Връщане на отговор с JWT токен
        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error('Грешка при потвърждаване на имейл линк:', error);
        return next(new AppError('Невалиден или изтекъл токен', 401));
    }
});

// Потвърждаване на регистрация
export const confirmRegistration = catchAsync(async (req, res, next) => {
    const { token } = req.query;

    if (!token) {
        return next(new AppError('Липсващ или невалиден токен', 400));
    }

    try {
        // Проверка на токена
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Проверка дали токенът е за потвърждение на регистрация
        if (decoded.purpose !== 'confirm-registration') {
            return next(new AppError('Невалиден токен', 400));
        }

        // Намиране на потребителя
        const user = await User.findById(decoded.id);
        if (!user) {
            return next(new AppError('Потребителят не е намерен', 404));
        }

        // Проверка дали имейлът съвпада
        if (user.email !== decoded.email) {
            return next(new AppError('Невалиден токен', 400));
        }

        // Потвърждаване на имейла
        user.emailConfirmed = true;
        await user.save({ validateBeforeSave: false });

        // Връщане на отговор с JWT токен
        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error('Грешка при потвърждаване на регистрация:', error);
        return next(new AppError('Невалиден или изтекъл токен', 401));
    }
});