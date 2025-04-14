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
        body('lastName').notEmpty().withMessage('Фамилията е задължителна')
    ],
    authController.register
);

// Вход
router.post('/login', authController.login);

// Изход
router.get('/logout', authController.logout);

// Текущ потребител
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;