// server/controllers/authController.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import config from '../config/config.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { findDocumentOrFail } from '../utils/dbUtils.js';
import { sendEmail, resetPasswordEmailTemplate } from '../utils/email.js';
import { generateTOTP, verifyTOTP } from '../utils/totp.js';

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

// Функция за изпращане на токените като cookies
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
        token, // Все още връщаме токена за клиенти, които не поддържат cookies
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        }
    });
};

// Регистрация на потребител
export const register = catchAsync(async (req, res, next) => {
    const { email, password, firstName, lastName, role } = req.body;

    // Проверка за съществуващ потребител
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('Потребител с този имейл вече съществува', 400));
    }

    // Валидиране на паролата
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return next(new AppError('Паролата трябва да съдържа минимум 8 символа, включително главна буква, малка буква, цифра и специален символ', 400));
    }

    // Създаване на потребител
    const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role: role || 'student'
    });

    // Генериране на токен за потвърждение на имейла
    const confirmationToken = jwt.sign(
        { id: user._id, email: user.email, purpose: 'confirm-registration' },
        config.JWT_SECRET,
        { expiresIn: '24h' }
    );

    // Създаване на URL за потвърждение
    const confirmURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirm-email/${confirmationToken}`;

    try {
        // Изпращане на имейл за потвърждение
        await sendEmail({
            email: user.email,
            subject: 'Потвърждение на регистрация в Технофолио',
            text: `Здравейте ${firstName},\n\nБлагодарим Ви за регистрацията в Технофолио. Моля, потвърдете имейла си като последвате линка: ${confirmURL}\n\nПоздрави,\nЕкипът на Технофолио`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a4a4a; text-align: center;">Потвърждение на регистрация</h2>
          <p>Здравейте ${firstName},</p>
          <p>Благодарим Ви за регистрацията в Технофолио.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmURL}" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Потвърдете имейла си</a>
          </div>
          <p style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 10px; font-size: 12px; color: #777;">
            С уважение,<br>
            Екипът на Технофолио
          </p>
        </div>
      `
        });
    } catch (error) {
        console.error('Грешка при изпращане на имейл за потвърждение:', error);
    }

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

    // Проверка за 2FA ако е активирана
    if (user.twoFactorEnabled) {
        const tempToken = jwt.sign(
            { id: user._id, requiresTwoFactor: true },
            config.JWT_SECRET,
            { expiresIn: '5m' }
        );

        return res.status(200).json({
            success: true,
            requiresTwoFactor: true,
            tempToken
        });
    }

    // Връщане на отговор с JWT токен
    sendTokenResponse(user, 200, res);
});

// Валидиране на 2FA код
export const verifyTwoFactor = catchAsync(async (req, res, next) => {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
        return next(new AppError('Моля, предоставете временен токен и код', 400));
    }

    try {
        // Проверка на временния токен
        const decoded = jwt.verify(tempToken, config.JWT_SECRET);

        if (!decoded.requiresTwoFactor) {
            return next(new AppError('Невалиден токен', 401));
        }

        // Намиране на потребителя
        const user = await findDocumentOrFail(User, decoded.id, 'Потребителят не е намерен');

        // Проверка на 2FA кода
        const isValidCode = verifyTOTP(user.twoFactorSecret, code);

        if (!isValidCode) {
            return next(new AppError('Невалиден код за двуфакторна автентикация', 401));
        }

        // Връщане на отговор с JWT токен
        sendTokenResponse(user, 200, res);

    } catch (error) {
        return next(new AppError('Невалиден или изтекъл токен', 401));
    }
});

// Активиране на двуфакторна автентикация
export const enableTwoFactor = catchAsync(async (req, res, next) => {
    // Генериране на TOTP тайна
    const { secret, qrCode } = await generateTOTP();

    // Запазване на тайната временно (не в базата данни още)
    const tempToken = jwt.sign(
        { id: req.user.id, tempSecret: secret },
        config.JWT_SECRET,
        { expiresIn: '10m' }
    );

    res.status(200).json({
        success: true,
        message: 'Сканирайте QR кода с Authenticator приложение',
        tempToken,
        qrCode
    });
});

// Потвърждаване на двуфакторна автентикация
export const confirmTwoFactor = catchAsync(async (req, res, next) => {
    const { tempToken, token } = req.body;

    if (!tempToken || !token) {
        return next(new AppError('Моля, предоставете временен токен и код', 400));
    }

    try {
        // Проверка на временния токен
        const decoded = jwt.verify(tempToken, config.JWT_SECRET);

        // Намиране на потребителя
        const user = await findDocumentOrFail(User, decoded.id, 'Потребителят не е намерен');

        // Проверка на TOTP кода
        const isValidCode = verifyTOTP(decoded.tempSecret, token);

        if (!isValidCode) {
            return next(new AppError('Невалиден код', 401));
        }

        // Активиране на 2FA и запазване на тайната
        user.twoFactorEnabled = true;
        user.twoFactorSecret = decoded.tempSecret;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Двуфакторната автентикация е активирана успешно'
        });

    } catch (error) {
        return next(new AppError('Невалиден или изтекъл токен', 401));
    }
});

// Обновяване на токена с refresh token
export const refreshToken = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.cookies || req.body;

    if (!refreshToken) {
        return next(new AppError('Липсващ refresh token', 401));
    }

    try {
        // Проверка на refresh token
        const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);

        // Намиране на потребителя
        const user = await User.findById(decoded.id).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            return next(new AppError('Невалиден refresh token', 401));
        }

        // Създаване на нов access token
        const token = signToken(user._id);

        // Cookie опции
        const cookieOptions = {
            expires: new Date(Date.now() + parseInt(config.JWT_EXPIRE) * 60 * 1000),
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'strict'
        };

        // Изпращане на cookie
        res.cookie('token', token, cookieOptions);

        res.status(200).json({
            success: true,
            token
        });

    } catch (error) {
        return next(new AppError('Невалиден или изтекъл refresh token', 401));
    }
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

// Забравена парола
export const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    // Намиране на потребителя
    const user = await User.findOne({ email });

    if (!user) {
        return next(new AppError('Няма потребител с този имейл адрес', 404));
    }

    // Генериране на токен за нулиране на паролата
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Хеширане на токена и запазване в базата данни
    user.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 минути

    await user.save({ validateBeforeSave: false });

    // Създаване на URL за нулиране на паролата
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    try {
        // Изпращане на имейл
        const template = resetPasswordEmailTemplate(user.firstName, resetURL);

        await sendEmail({
            email: user.email,
            subject: 'Нулиране на парола (валидно 10 минути)',
            text: template.text,
            html: template.html
        });

        res.status(200).json({
            success: true,
            message: 'Изпратен е имейл с инструкции за нулиране на паролата'
        });
    } catch (error) {
        // Ако възникне грешка, премахваме токените
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('Възникна грешка при изпращането на имейла. Моля, опитайте отново по-късно!', 500));
    }
});

// Нулиране на паролата
export const resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    // Хеширане на токена от URL
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Намиране на потребителя по токена
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError('Невалиден или изтекъл токен', 400));
    }

    // Валидиране на новата парола
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return next(new AppError('Паролата трябва да съдържа минимум 8 символа, включително главна буква, малка буква, цифра и специален символ', 400));
    }

    // Задаване на нова парола и изчистване на токените
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    user.accountLocked = false;
    user.incorrectLoginAttempts = 0;

    await user.save();

    // Връщане на отговор с JWT токен
    sendTokenResponse(user, 200, res);
});

// Получаване на текущия потребител
export const getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new AppError('Потребителят не е намерен', 404));
    }

    res.status(200).json({
        success: true,
        user
    });
});

// Промяна на паролата
export const updatePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    // Намиране на потребителя с паролата
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
        return next(new AppError('Потребителят не е намерен', 404));
    }

    // Проверка на текущата парола
    const isMatch = await user.checkPassword(currentPassword);

    if (!isMatch) {
        return next(new AppError('Текущата парола е грешна', 401));
    }

    // Валидиране на новата парола
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return next(new AppError('Паролата трябва да съдържа минимум 8 символа, включително главна буква, малка буква, цифра и специален символ', 400));
    }

    // Задаване на нова парола
    user.password = newPassword;
    user.passwordChangedAt = Date.now();

    await user.save();

    // Връщане на отговор с JWT токен
    sendTokenResponse(user, 200, res);
});

// Функция за изпращане на имейл линк за вход
export const requestLoginLink = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    // Проверка дали потребителят съществува
    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('Потребител с този имейл не е намерен', 404));
    }

    // Генериране на токен за вход
    const loginToken = jwt.sign(
        { id: user._id, email: user.email, purpose: 'email-login' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Създаване на URL за вход
    const loginURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login/email?token=${loginToken}`;

    try {
        // Изпращане на имейл с линк за вход
        await sendEmail({
            email: user.email,
            subject: 'Вход в Технофолио',
            text: `Здравейте ${user.firstName},\n\nИзползвайте следния линк за вход в Технофолио: ${loginURL}\n\nЛинкът е валиден 1 час.\n\nПоздрави,\nЕкипът на Технофолио`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a4a4a; text-align: center;">Вход в Технофолио</h2>
          <p>Здравейте ${user.firstName},</p>
          <p>Използвайте бутона по-долу за вход в системата:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginURL}" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Вход в Технофолио</a>
          </div>
          <p>Линкът е валиден 1 час.</p>
          <p style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 10px; font-size: 12px; color: #777;">
            С уважение,<br>
            Екипът на Технофолио
          </p>
        </div>
      `
        });

        res.status(200).json({
            success: true,
            message: 'Имейл с линк за вход е изпратен успешно!'
        });
    } catch (error) {
        console.error('Грешка при изпращане на имейл:', error);
        return next(new AppError('Възникна грешка при изпращането на имейла. Моля, опитайте отново по-късно!', 500));
    }
});

// Функция за верификация на имейл линка за вход
export const verifyEmailLogin = catchAsync(async (req, res, next) => {
    const { token } = req.query;

    if (!token) {
        return next(new AppError('Липсва токен за верификация', 400));
    }

    try {
        // Проверка на токена
        const decoded = jwt.verify(token, config.JWT_SECRET);

        if (decoded.purpose !== 'email-login') {
            return next(new AppError('Невалиден токен за вход', 400));
        }

        // Намиране на потребителя
        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new AppError('Потребителят не е намерен', 404));
        }

        // Генериране на access token
        const accessToken = signToken(user._id);

        // Връщане на отговор с токена и данните за потребителя
        res.status(200).json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        return next(new AppError('Невалиден или изтекъл токен', 401));
    }
});

// Функция за потвърждаване на регистрация
export const confirmRegistration = catchAsync(async (req, res, next) => {
    const { token } = req.query;

    if (!token) {
        return next(new AppError('Липсва токен за потвърждение', 400));
    }

    try {
        // Проверка на токена
        const decoded = jwt.verify(token, config.JWT_SECRET);

        if (decoded.purpose !== 'confirm-registration') {
            return next(new AppError('Невалиден тип на токена', 400));
        }

        // Намиране на потребителя
        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new AppError('Потребителят не е намерен', 404));
        }

        // Потвърждаване на имейла
        user.emailConfirmed = true;
        await user.save({ validateBeforeSave: false });

        // Генериране на access token
        const accessToken = signToken(user._id);

        // Връщане на отговор с токена и данните за потребителя
        res.status(200).json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        return next(new AppError('Невалиден или изтекъл токен', 401));
    }
});