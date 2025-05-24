import { Router } from 'express';
import { body } from 'express-validator';
import { createStudentProfile, getCurrentStudentProfile, getStudentProfileByUserId, updateStudentProfile, deleteStudentProfile } from '../controllers/studentController.js';
import { getStudentPortfolio, updatePortfolio, addRecommendation, removeRecommendation } from '../controllers/portfolioController.js';
import { getStudentGoals, updateGoal } from '../controllers/goalsController.js';
import { getStudentInterests, updateInterests } from '../controllers/interestsController.js';
import { getStudentAchievements, addAchievement, removeAchievement } from '../controllers/achievementsController.js';
import { getStudentSanctions, updateAbsences, updateSchooloRemarks, addActiveSanction, removeActiveSanction } from '../controllers/sanctionsController.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// Защита на всички маршрути
router.use(authMiddleware);

// Студентски профил
router.post(
    '/',
    [
        body('grade').isIn(['8', '9', '10', '11', '12']).withMessage('Невалиден клас'),
        body('specialization').notEmpty().withMessage('Специалността е задължителна')
    ],
    createStudentProfile
);

router.get('/me', getCurrentStudentProfile);
router.get('/:userId', getStudentProfileByUserId);
// Добавете тези routes в studentRoutes.js
router.delete('/:studentId/goals/:category', deleteGoal);
router.get('/goals', getAllGoals); // За всички цели
router.get('/goals/stats', getGoalsStatistics); // За статистики
router.post('/goals/bulk-update', bulkUpdateGoals); // Масови операции
router.get('/goals/export', exportGoalsData); // Експорт

router.put(
    '/:profileId',
    [
        body('grade').optional().isIn(['8', '9', '10', '11', '12']).withMessage('Невалиден клас'),
        body('specialization').optional().notEmpty().withMessage('Специалността е задължителна'),
        body('averageGrade').optional().isFloat({ min: 2, max: 6 }).withMessage('Средният успех трябва да е между 2 и 6')
    ],
    updateStudentProfile
);

router.delete('/:profileId', deleteStudentProfile);

// Портфолио
router.get('/:studentId/portfolio', getStudentPortfolio);

router.put(
    '/:studentId/portfolio',
    [
        body('experience').optional(),
        body('projects').optional(),
        body('mentorId').optional()
    ],
    updatePortfolio
);

router.post(
    '/:studentId/portfolio/recommendations',
    [
        body('text').notEmpty().withMessage('Текстът на препоръката е задължителен'),
        body('author').notEmpty().withMessage('Авторът на препоръката е задължителен')
    ],
    addRecommendation
);

router.delete('/:studentId/portfolio/recommendations/:recommendationId', removeRecommendation);

// Цели
router.get('/:studentId/goals', getStudentGoals);

router.put(
    '/:studentId/goals/:category',
    [
        body('description').notEmpty().withMessage('Описанието е задължително'),
        body('activities').notEmpty().withMessage('Дейностите са задължителни')
    ],
    updateGoal
);

// Интереси и хобита
router.get('/:studentId/interests', getStudentInterests);

router.put(
    '/:studentId/interests',
    [
        body('interests').optional().isArray(),
        body('hobbies').optional().isArray()
    ],
    updateInterests
);

// Постижения
router.get('/:studentId/achievements', getStudentAchievements);

router.post(
    '/:studentId/achievements',
    [
        body('category').isIn(['competition', 'olympiad', 'tournament', 'certificate', 'award', 'other']).withMessage('Невалидна категория'),
        body('title').notEmpty().withMessage('Заглавието е задължително'),
        body('date').isISO8601().withMessage('Невалидна дата')
    ],
    addAchievement
);

router.delete('/:studentId/achievements/:achievementId', removeAchievement);

// Санкции и забележки
router.get('/:studentId/sanctions', getStudentSanctions);

router.put(
    '/:studentId/sanctions/absences',
    [
        body('excused').optional().isInt({ min: 0 }).withMessage('Невалиден брой извинени отсъствия'),
        body('unexcused').optional().isInt({ min: 0 }).withMessage('Невалиден брой неизвинени отсъствия'),
        body('maxAllowed').optional().isInt({ min: 0 }).withMessage('Невалиден брой максимално допустими отсъствия')
    ],
    updateAbsences
);

router.put(
    '/:studentId/sanctions/schoolo-remarks',
    [
        body('schooloRemarks').isInt({ min: 0 }).withMessage('Невалиден брой забележки')
    ],
    updateSchooloRemarks
);

router.post(
    '/:studentId/sanctions/active',
    [
        body('type').notEmpty().withMessage('Типът на санкцията е задължителен'),
        body('reason').notEmpty().withMessage('Причината за санкцията е задължителна'),
        body('startDate').isISO8601().withMessage('Невалидна начална дата'),
        body('issuedBy').notEmpty().withMessage('Издателят на санкцията е задължителен')
    ],
    addActiveSanction
);

router.delete('/:studentId/sanctions/active/:sanctionId', removeActiveSanction);

export default router;