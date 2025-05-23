// server/controllers/authController.js
import { validationResult } from 'express-validator';
import config from '../config/config.js';
import { catchAsync } from '../utils/catchAsync.js';
import * as authService from '../services/authService.js';

// Функция за изпращане на токените като cookies
const sendTokenResponse = (tokenData, statusCode, res) => {
    const { token, refreshToken, user } = tokenData;

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
        accessToken: token, // За клиенти, които не поддържат cookies
        user
    });
};

// Регистрация на потребител
export const register = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const tokenData = await authService.registerUser(req.body);
    sendTokenResponse(tokenData, 201, res);
});

// Вход на потребител
export const login = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const result = await authService.loginUser(req.body);

    // Ако е необходима 2FA
    if (result.requiresTwoFactor) {
        return res.status(200).json({
            success: true,
            requiresTwoFactor: true,
            tempToken: result.tempToken
        });
    }

    // Обикновен login
    sendTokenResponse(result, 200, res);
});

// Валидиране на 2FA код
export const verifyTwoFactor = catchAsync(async (req, res, next) => {
    const { tempToken, code } = req.body;

    const tokenData = await authService.verifyUserTwoFactor(tempToken, code);
    sendTokenResponse(tokenData, 200, res);
});

// Активиране на двуфакторна автентикация
export const enableTwoFactor = catchAsync(async (req, res, next) => {
    const result = await authService.enableUserTwoFactor(req.user.id);

    res.status(200).json({
        success: true,
        message: 'Сканирайте QR кода с Authenticator приложение',
        tempToken: result.tempToken,
        qrCode: result.qrCode
    });
});

// Потвърждаване на двуфакторна автентикация
export const confirmTwoFactor = catchAsync(async (req, res, next) => {
    const { tempToken, token } = req.body;

    const result = await authService.confirmUserTwoFactor(tempToken, token);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// Обновяване на токена с refresh token
export const refreshToken = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.cookies || req.body;

    const result = await authService.refreshUserToken(refreshToken);

    // Cookie опции
    const cookieOptions = {
        expires: new Date(Date.now() + parseInt(config.JWT_EXPIRE) * 60 * 1000),
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    // Изпращане на cookie
    res.cookie('token', result.token, cookieOptions);

    res.status(200).json({
        success: true,
        token: result.token
    });
});

// Изход от системата
export const logout = catchAsync(async (req, res, next) => {
    // Изчистване на cookies
    res.clearCookie('token');
    res.clearCookie('refreshToken');

    const result = await authService.logoutUser(req.user?.id);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// Забравена парола
export const forgotPassword = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { email } = req.body;
    const result = await authService.forgotUserPassword(email);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// Нулиране на паролата
export const resetPassword = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { token } = req.params;
    const { password } = req.body;

    const tokenData = await authService.resetUserPassword(token, password);
    sendTokenResponse(tokenData, 200, res);
});

// Заявка за линк за вход чрез имейл
export const requestLoginLink = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { email } = req.body;
    const result = await authService.requestUserLoginLink(email);

    res.status(200).json({
        success: true,
        message: result.message
    });
});

// Проверка на имейл линк за вход
export const verifyEmailLogin = catchAsync(async (req, res, next) => {
    const { token } = req.query;

    const tokenData = await authService.verifyEmailLogin(token);
    sendTokenResponse(tokenData, 200, res);
});

// Потвърждение на регистрация
export const confirmRegistration = catchAsync(async (req, res, next) => {
    const { token } = req.query;

    const tokenData = await authService.confirmUserRegistration(token);
    sendTokenResponse(tokenData, 200, res);
});

// Промяна на паролата
export const updatePassword = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Валидационна грешка',
            errors: errors.array()
        });
    }

    const { currentPassword, newPassword } = req.body;

    const tokenData = await authService.updateUserPassword(req.user.id, currentPassword, newPassword);
    sendTokenResponse(tokenData, 200, res);
});

// Получаване на текущия потребител
export const getMe = catchAsync(async (req, res, next) => {
    const result = await authService.getCurrentUser(req.user.id);

    res.status(200).json({
        success: true,
        user: result.user
    });
});

// Проверка на валидността на токена
export const checkTokenValidity = catchAsync(async (req, res) => {
    // Ако middleware authMiddleware е успешно преминал, токенът е валиден
    res.status(200).json({
        success: true,
        message: 'Токенът е валиден',
        user: {
            id: req.user._id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            role: req.user.role
        }
    });
});