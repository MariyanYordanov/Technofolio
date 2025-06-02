// server/routes/creditsRoutes.js - КОРИГИРАН
import { Router } from 'express';
import { body } from 'express-validator';
import {
    getCreditCategories,
    getStudentCredits,
    addCredit,
    validateCredit,
    deleteCredit,
    getAllCredits,
    addCreditCategory,
    updateCreditCategory,
    deleteCreditCategory,
    getCreditsStatistics,
    bulkValidateCredits
} from '../controllers/creditsController.js';
import authMiddleware from '../middleware/auth.js';
import { restrictTo } from '../middleware/auth.js';

const router = Router();

// Защита на всички маршрути
router.use(authMiddleware);

// Публични endpoints (за всички логнати)
router.get('/categories', getCreditCategories);

// Основен endpoint за кредити - с филтриране по userId
router.get('/', getAllCredits);

// Добавяне на кредит (само за студенти)
router.post(
    '/',
    [
        body('pillar').isIn(['Аз и другите', 'Мислене', 'Професия']).withMessage('Невалиден стълб'),
        body('activity').notEmpty().withMessage('Дейността е задължителна'),
        body('description').notEmpty().withMessage('Описанието е задължително')
    ],
    addCredit
);

// Действия с конкретен кредит
router.patch(
    '/:creditId/validate',
    restrictTo('teacher', 'admin'),
    [
        body('status').isIn(['validated', 'rejected']).withMessage('Невалиден статус')
    ],
    validateCredit
);

router.delete('/:creditId', deleteCredit);

// Административни endpoints
router.get('/all', restrictTo('teacher', 'admin'), getAllCredits);
router.get('/stats', restrictTo('teacher', 'admin'), getCreditsStatistics);

// Масово валидиране
router.post(
    '/bulk-validate',
    restrictTo('teacher', 'admin'),
    [
        body('creditIds').isArray().withMessage('creditIds трябва да бъде масив'),
        body('creditIds.*').isMongoId().withMessage('Невалиден credit ID'),
        body('status').isIn(['validated', 'rejected']).withMessage('Невалиден статус')
    ],
    bulkValidateCredits
);

// Управление на категории (само за админи)
router.post(
    '/categories',
    restrictTo('admin'),
    [
        body('pillar').isIn(['Аз и другите', 'Мислене', 'Професия']).withMessage('Невалиден стълб'),
        body('name').notEmpty().withMessage('Името е задължително'),
        body('description').optional().isLength({ max: 500 }).withMessage('Описанието не може да бъде по-дълго от 500 символа')
    ],
    addCreditCategory
);

router.put(
    '/categories/:categoryId',
    restrictTo('admin'),
    [
        body('pillar').optional().isIn(['Аз и другите', 'Мислене', 'Професия']).withMessage('Невалиден стълб'),
        body('name').optional().notEmpty().withMessage('Името е задължително'),
        body('description').optional().isLength({ max: 500 }).withMessage('Описанието не може да бъде по-дълго от 500 символа')
    ],
    updateCreditCategory
);

router.delete('/categories/:categoryId', restrictTo('admin'), deleteCreditCategory);

export default router;