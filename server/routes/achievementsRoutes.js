// server/routes/achievementsRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import {
    getUserAchievements,
    addAchievement,
    updateAchievement,
    deleteAchievement,
    getAllAchievements,
    getAchievementsStats
} from '../controllers/achievementsController.js';
import authMiddleware from '../middleware/auth.js';
import { restrictTo } from '../middleware/auth.js';

const router = Router();

// Защита на всички маршрути
router.use(authMiddleware);

// Административни операции
router.get('/all', restrictTo('teacher', 'admin'), getAllAchievements);
router.get('/stats', restrictTo('teacher', 'admin'), getAchievementsStats);

// Получаване на постижения на потребител
router.get('/user/:userId', getUserAchievements);

// Добавяне на ново постижение
router.post(
    '/',
    [
        body('userId').optional().isMongoId().withMessage('Невалиден user ID'),
        body('category').isIn(['competition', 'olympiad', 'tournament', 'certificate', 'award', 'other']).withMessage('Невалидна категория'),
        body('title').notEmpty().withMessage('Заглавието е задължително'),
        body('date').isISO8601().withMessage('Невалидна дата'),
        body('description').optional().isLength({ max: 1000 }).withMessage('Описанието не може да бъде по-дълго от 1000 символа'),
        body('place').optional().isLength({ max: 100 }).withMessage('Мястото не може да бъде по-дълго от 100 символа'),
        body('issuer').optional().isLength({ max: 200 }).withMessage('Издателят не може да бъде по-дълъг от 200 символа')
    ],
    addAchievement
);

// Обновяване на постижение
router.put(
    '/:id',
    [
        body('category').optional().isIn(['competition', 'olympiad', 'tournament', 'certificate', 'award', 'other']).withMessage('Невалидна категория'),
        body('title').optional().notEmpty().withMessage('Заглавието е задължително'),
        body('date').optional().isISO8601().withMessage('Невалидна дата'),
        body('description').optional().isLength({ max: 1000 }).withMessage('Описанието не може да бъде по-дълго от 1000 символа'),
        body('place').optional().isLength({ max: 100 }).withMessage('Мястото не може да бъде по-дълго от 100 символа'),
        body('issuer').optional().isLength({ max: 200 }).withMessage('Издателят не може да бъде по-дълъг от 200 символа')
    ],
    updateAchievement
);

// Изтриване на постижение
router.delete('/:id', deleteAchievement);

export default router;