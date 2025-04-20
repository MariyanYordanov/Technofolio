const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Регистрация
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Моля въведете валиден email'),
        body('password').isLength({ min: 6 }).withMessage('Паролата трябва да е минимум 6 символа'),
        body('firstName').notEmpty().withMessage('Името е задължително'),
        body('lastName').notEmpty().withMessage('Фамилията е задължителна'),
        body('role').isIn(['student', 'teacher', 'admin']).withMessage('Невалидна роля')
    ],
    authController.register
);

// Вход
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Моля въведете валиден email'),
        body('password').notEmpty().withMessage('Паролата е задължителна')
    ],
    authController.login
);

// Вход чрез имейл линк - заявка
router.post(
    '/request-login-link',
    [
        body('email').isEmail().withMessage('Моля въведете валиден email')
    ],
    authController.requestLoginLink
);

// Вход чрез имейл линк - проверка
router.post(
    '/verify-email-login',
    [
        body('token').notEmpty().withMessage('Токенът е задължителен')
    ],
    authController.verifyEmailLogin
);

// Потвърждаване на регистрация
router.post(
    '/confirm-registration',
    [
        body('token').notEmpty().withMessage('Токенът е задължителен')
    ],
    authController.confirmRegistration
);

// Изход
router.get('/logout', authController.logout);

// Текущ потребител
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;