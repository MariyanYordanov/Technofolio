const express = require('express');
const { body } = require('express-validator');
const creditsController = require('../controllers/creditsController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Защита на всички маршрути
router.use(authMiddleware);

// Кредитни категории
router.get('/categories', creditsController.getCreditCategories);

// Кредити на студент
router.get('/students/:studentId', creditsController.getStudentCredits);

// Добавяне на кредит
router.post(
    '/',
    [
        body('pillar').isIn(['Аз и другите', 'Мислене', 'Професия']).withMessage('Невалиден стълб'),
        body('activity').notEmpty().withMessage('Дейността е задължителна'),
        body('description').notEmpty().withMessage('Описанието е задължително')
    ],
    creditsController.addCredit
);

// Валидиране на кредит
router.patch(
    '/:creditId/validate',
    [
        body('status').isIn(['validated', 'rejected']).withMessage('Невалиден статус')
    ],
    creditsController.validateCredit
);

// Изтриване на кредит
router.delete('/:creditId', creditsController.deleteCredit);

module.exports = router;