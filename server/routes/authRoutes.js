// server/routes/authRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import {
    register,
    login,
    logout,
    getMe,
    forgotPassword,
    resetPassword,
    updatePassword,
    refreshToken,
    requestLoginLink,
    verifyEmailLogin,
    confirmRegistration
} from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Регистрация
router.post(
    '/register',
    authLimiter,
    [
        body('email').isEmail().withMessage('Моля, въведете валиден имейл'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Паролата трябва да бъде поне 8 символа')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage('Паролата трябва да съдържа главна буква, малка буква, цифра и специален символ'),
        body('firstName').notEmpty().withMessage('Името е задължително'),
        body('lastName').notEmpty().withMessage('Фамилията е задължителна')
    ],
    register
);

// Вход с имейл и парола
router.post(
    '/login',
    authLimiter,
    [
        body('email').isEmail().withMessage('Моля, въведете валиден имейл'),
        body('password').notEmpty().withMessage('Паролата е задължителна')
    ],
    login
);

// Заявка за изпращане на линк за вход
router.post(
    '/request-login-link',
    authLimiter,
    [
        body('email').isEmail().withMessage('Моля, въведете валиден имейл')
    ],
    requestLoginLink
);

// Проверка на имейл линк за вход
router.get('/verify-email', verifyEmailLogin);

// Потвърждаване на регистрация
router.get('/confirm-registration', confirmRegistration);

// Изход от системата
router.post('/logout', authMiddleware, logout);

// Обновяване на токен
router.post('/refresh-token', refreshToken);

// Забравена парола
router.post(
    '/forgot-password',
    authLimiter,
    [
        body('email').isEmail().withMessage('Моля, въведете валиден имейл')
    ],
    forgotPassword
);

// Нулиране на парола
router.patch(
    '/reset-password/:token',
    authLimiter,
    [
        body('password')
            .isLength({ min: 8 })
            .withMessage('Паролата трябва да бъде поне 8 символа')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage('Паролата трябва да съдържа главна буква, малка буква, цифра и специален символ')
    ],
    resetPassword
);

// Промяна на парола
router.patch(
    '/update-password',
    authMiddleware,
    [
        body('currentPassword').notEmpty().withMessage('Текущата парола е задължителна'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Новата парола трябва да бъде поне 8 символа')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage('Паролата трябва да съдържа главна буква, малка буква, цифра и специален символ')
    ],
    updatePassword
);

// Получаване на информация за текущия потребител
router.get('/me', authMiddleware, getMe);

export default router;