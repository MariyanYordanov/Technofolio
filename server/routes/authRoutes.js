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
    verifyTwoFactor,
    enableTwoFactor,
    confirmTwoFactor,
    refreshToken
} from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';  // Премахнат emailLimiter

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

// Заявка за нулиране на парола
router.post(
    '/forgot-password',
    authLimiter,  // Заменено emailLimiter с authLimiter
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

// Изход от системата
router.post('/logout', authMiddleware, logout);

// Обновяване на токен
router.post('/refresh-token', refreshToken);

// Двуфакторна автентикация
router.post('/verify-two-factor', verifyTwoFactor);
router.post('/enable-two-factor', authMiddleware, enableTwoFactor);
router.post('/confirm-two-factor', authMiddleware, confirmTwoFactor);

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

// Защитен маршрут - получаване на информация за текущия потребител
router.get('/me', authMiddleware, getMe);

export default router;