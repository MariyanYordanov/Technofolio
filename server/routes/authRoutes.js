// server/routes/authRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { register, confirmEmail, requestLoginLink, verifyEmailLogin, requestPasswordReset, resetPassword, login, getMe } from '../controllers/authController';
import authMiddleware from '../middleware/auth';
import { authLimiter, emailLimiter } from '../middleware/rateLimiter';

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

// Потвърждаване на имейл
router.get('/confirm-email/:token', confirmEmail);

// Заявка за линк за вход
router.post(
    '/request-login-link',
    emailLimiter,
    [
        body('email').isEmail().withMessage('Моля, въведете валиден имейл')
    ],
    requestLoginLink
);

// Вход с линк от имейл
router.get('/verify-email-login/:token', verifyEmailLogin);

// Заявка за нулиране на парола
router.post(
    '/forgot-password',
    emailLimiter,
    [
        body('email').isEmail().withMessage('Моля, въведете валиден имейл')
    ],
    requestPasswordReset
);

// Нулиране на парола
router.post(
    '/reset-password',
    authLimiter,
    [
        body('token').notEmpty().withMessage('Токенът е задължителен'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Паролата трябва да бъде поне 8 символа')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage('Паролата трябва да съдържа главна буква, малка буква, цифра и специален символ')
    ],
    resetPassword
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

// Защитен маршрут - получаване на информация за текущия потребител
router.get('/me', authMiddleware, getMe);

export default router;