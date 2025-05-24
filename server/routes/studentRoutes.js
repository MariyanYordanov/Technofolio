import { Router } from 'express';
import { body } from 'express-validator';
import { createStudentProfile, getCurrentStudentProfile, getStudentProfileByUserId, updateStudentProfile, deleteStudentProfile } from '../controllers/studentController.js';
import { getStudentPortfolio, updatePortfolio, addRecommendation, removeRecommendation } from '../controllers/portfolioController.js';
import { getStudentGoals, updateGoal, bulkUpdateGoals, exportGoalsData, getGoalsStatistics, getAllGoals, deleteGoal } from '../controllers/goalsController.js';
import { getStudentInterests, updateInterests, getAllInterests, getInterestsStatistics, exportInterestsData, getPopularInterestsAndHobbies } from '../controllers/interestsController.js';
import { getStudentAchievements, addAchievement, removeAchievement, getAllAchievements, getAchievementsStatistics, exportAchievementsData } from '../controllers/achievementsController.js';
import { getStudentSanctions, updateAbsences, updateSchooloRemarks, addActiveSanction, removeActiveSanction } from '../controllers/sanctionsController.js';
import authMiddleware from '../middleware/auth.js';
import { restrictTo } from '../middleware/auth.js';

const router = Router();

// Защита на всички маршрути
router.use(authMiddleware);

// ===== СТУДЕНТСКИ ПРОФИЛ =====
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

// ===== ПОРТФОЛИО =====
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

// ===== ЦЕЛИ =====
// Индивидуални цели на ученик
router.get('/:studentId/goals', getStudentGoals);

router.put(
    '/:studentId/goals/:category',
    [
        body('description').notEmpty().withMessage('Описанието е задължително'),
        body('activities').notEmpty().withMessage('Дейностите са задължителни')
    ],
    updateGoal
);

router.delete('/:studentId/goals/:category', deleteGoal);

// Административни операции за цели (само за учители и админи)
router.get('/goals', restrictTo('teacher', 'admin'), getAllGoals);
router.get('/goals/stats', restrictTo('teacher', 'admin'), getGoalsStatistics);
router.get('/goals/export', restrictTo('teacher', 'admin'), exportGoalsData);
router.post(
    '/goals/bulk-update',
    restrictTo('admin'),
    [
        body('updates').isArray().withMessage('Updates трябва да бъде масив'),
        body('updates.*.studentId').notEmpty().withMessage('Student ID е задължително'),
        body('updates.*.category').notEmpty().withMessage('Категорията е задължителна'),
        body('updates.*.description').notEmpty().withMessage('Описанието е задължително'),
        body('updates.*.activities').isArray().withMessage('Дейностите трябва да бъдат масив')
    ],
    bulkUpdateGoals
);

// ===== ИНТЕРЕСИ И ХОБИТА =====
// Индивидуални интереси на ученик
router.get('/:studentId/interests', getStudentInterests);

router.put(
    '/:studentId/interests',
    [
        body('interests').optional().isArray().withMessage('Интересите трябва да бъдат масив'),
        body('hobbies').optional().isArray().withMessage('Хобитата трябва да бъдат масив')
    ],
    updateInterests
);

// Административни операции за интереси (само за учители и админи)
router.get('/interests', restrictTo('teacher', 'admin'), getAllInterests);
router.get('/interests/stats', restrictTo('teacher', 'admin'), getInterestsStatistics);
router.get('/interests/export', restrictTo('teacher', 'admin'), exportInterestsData);
router.get('/interests/popular', restrictTo('teacher', 'admin'), getPopularInterestsAndHobbies);

// ===== ПОСТИЖЕНИЯ =====
// Индивидуални постижения на ученик
router.get('/:studentId/achievements', getStudentAchievements);

router.post(
    '/:studentId/achievements',
    [
        body('category').isIn(['competition', 'olympiad', 'tournament', 'certificate', 'award', 'other']).withMessage('Невалидна категория'),
        body('title').notEmpty().withMessage('Заглавието е задължително'),
        body('date').isISO8601().withMessage('Невалидна дата'),
        body('description').optional().isLength({ max: 1000 }).withMessage('Описанието не може да бъде по-дълго от 1000 символа'),
        body('place').optional().isLength({ max: 100 }).withMessage('Мястото не може да бъде по-дълго от 100 символа'),
        body('issuer').optional().isLength({ max: 200 }).withMessage('Издателят не може да бъде по-дълъг от 200 символа')
    ],
    addAchievement
);

router.delete('/:studentId/achievements/:achievementId', removeAchievement);

// Административни операции за постижения (само за учители и админи)
router.get('/achievements', restrictTo('teacher', 'admin'), getAllAchievements);
router.get('/achievements/stats', restrictTo('teacher', 'admin'), getAchievementsStatistics);
router.get('/achievements/export', restrictTo('teacher', 'admin'), exportAchievementsData);

// ===== САНКЦИИ И ЗАБЕЛЕЖКИ =====
router.get('/:studentId/sanctions', getStudentSanctions);

router.put(
    '/:studentId/sanctions/absences',
    restrictTo('teacher', 'admin'),
    [
        body('excused').optional().isInt({ min: 0 }).withMessage('Невалиден брой извинени отсъствия'),
        body('unexcused').optional().isInt({ min: 0 }).withMessage('Невалиден брой неизвинени отсъствия'),
        body('maxAllowed').optional().isInt({ min: 0 }).withMessage('Невалиден брой максимално допустими отсъствия')
    ],
    updateAbsences
);

router.put(
    '/:studentId/sanctions/schoolo-remarks',
    restrictTo('teacher', 'admin'),
    [
        body('schooloRemarks').isInt({ min: 0 }).withMessage('Невалиден брой забележки')
    ],
    updateSchooloRemarks
);

router.post(
    '/:studentId/sanctions/active',
    restrictTo('teacher', 'admin'),
    [
        body('type').notEmpty().withMessage('Типът на санкцията е задължителен'),
        body('reason').notEmpty().withMessage('Причината за санкцията е задължителна'),
        body('startDate').isISO8601().withMessage('Невалидна начална дата'),
        body('endDate').optional().isISO8601().withMessage('Невалидна крайна дата'),
        body('issuedBy').notEmpty().withMessage('Издателят на санкцията е задължителен')
    ],
    addActiveSanction
);

router.delete('/:studentId/sanctions/active/:sanctionId', restrictTo('teacher', 'admin'), removeActiveSanction);

export default router;