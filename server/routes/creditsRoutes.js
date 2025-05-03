import { Router } from 'express';
import { body } from 'express-validator';
import { getCreditCategories, getStudentCredits, addCredit, validateCredit, deleteCredit } from '../controllers/creditsController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Защита на всички маршрути
router.use(authMiddleware);

// Кредитни категории
router.get('/categories', getCreditCategories);

// Кредити на студент
router.get('/students/:studentId', getStudentCredits);

// Добавяне на кредит
router.post(
    '/',
    [
        body('pillar').isIn(['Аз и другите', 'Мислене', 'Професия']).withMessage('Невалиден стълб'),
        body('activity').notEmpty().withMessage('Дейността е задължителна'),
        body('description').notEmpty().withMessage('Описанието е задължително')
    ],
    addCredit
);

// Валидиране на кредит
router.patch(
    '/:creditId/validate',
    [
        body('status').isIn(['validated', 'rejected']).withMessage('Невалиден статус')
    ],
    validateCredit
);

// Изтриване на кредит
router.delete('/:creditId', deleteCredit);

export default router;