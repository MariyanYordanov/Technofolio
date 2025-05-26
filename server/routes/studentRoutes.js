import { Router } from 'express';
import { body } from 'express-validator';
import {
    createStudentProfile,
    getCurrentStudentProfile,
    getStudentProfileByUserId,
    updateStudentProfile,
    deleteStudentProfile,
    getAllStudents,
    getStudentsStatistics,
    searchStudents
} from '../controllers/studentController.js';
import {
    getStudentPortfolio,
    updatePortfolio,
    addRecommendation,
    removeRecommendation,
    getAllPortfolios,
    getPortfoliosStatistics
} from '../controllers/portfolioController.js';
import {
    getStudentGoals,
    updateGoal,
    deleteGoal,
    getAllGoals,
    getGoalsStatistics,
    bulkUpdateGoals,
    exportGoalsData
} from '../controllers/goalsController.js';
import {
    getStudentInterests,
    updateInterests,
    getAllInterests,
    getInterestsStatistics,
    exportInterestsData,
    getPopularInterestsAndHobbies
} from '../controllers/interestsController.js';
import {
    getStudentAchievements,
    addAchievement,
    removeAchievement,
    getAllAchievements,
    getAchievementsStatistics,
    exportAchievementsData
} from '../controllers/achievementsController.js';
import {
    getStudentSanctions,
    updateAbsences,
    updateSchooloRemarks,
    addActiveSanction,
    removeActiveSanction,
    getSanctionsStats,
    exportSanctionsData,
    bulkUpdateAbsences,
    getStudentsWithHighAbsences
} from '../controllers/sanctionsController.js';
import authMiddleware from '../middleware/auth.js';
import { restrictTo } from '../middleware/auth.js';

const router = Router();

// Защита на всички маршрути
router.use(authMiddleware);

// ===== СТУДЕНТСКИ ПРОФИЛИ - АДМИНИСТРАТИВНИ ОПЕРАЦИИ =====
// За учители и админи - преглед на всички студенти
router.get('/all', restrictTo('teacher', 'admin'), getAllStudents);
router.get('/stats', restrictTo('teacher', 'admin'), getStudentsStatistics);
router.get('/search', restrictTo('teacher', 'admin'), searchStudents);

// ===== СТУДЕНТСКИ ПРОФИЛ - ИНДИВИДУАЛНИ ОПЕРАЦИИ =====
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
// Административни операции за портфолия
router.get('/portfolios', restrictTo('teacher', 'admin'), getAllPortfolios);
router.get('/portfolios/stats', restrictTo('teacher', 'admin'), getPortfoliosStatistics);

// Индивидуални портфолия
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
// Административни операции за цели
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

// ===== ИНТЕРЕСИ И ХОБИТА =====
// Административни операции за интереси
router.get('/interests', restrictTo('teacher', 'admin'), getAllInterests);
router.get('/interests/stats', restrictTo('teacher', 'admin'), getInterestsStatistics);
router.get('/interests/export', restrictTo('teacher', 'admin'), exportInterestsData);
router.get('/interests/popular', restrictTo('teacher', 'admin'), getPopularInterestsAndHobbies);

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

// ===== ПОСТИЖЕНИЯ =====
// Административни операции за постижения
router.get('/achievements', restrictTo('teacher', 'admin'), getAllAchievements);
router.get('/achievements/stats', restrictTo('teacher', 'admin'), getAchievementsStatistics);
router.get('/achievements/export', restrictTo('teacher', 'admin'), exportAchievementsData);

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

// ===== САНКЦИИ И ЗАБЕЛЕЖКИ =====
// Административни операции за санкции
router.get('/sanctions/stats', restrictTo('teacher', 'admin'), getSanctionsStats);
router.get('/sanctions/export', restrictTo('teacher', 'admin'), exportSanctionsData);
router.get('/sanctions/high-absences', restrictTo('teacher', 'admin'), getStudentsWithHighAbsences);
router.post(
    '/sanctions/bulk-update-absences',
    restrictTo('teacher', 'admin'),
    [
        body('updates').isArray().withMessage('Updates трябва да бъде масив')
    ],
    bulkUpdateAbsences
);

// Индивидуални санкции на ученик
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