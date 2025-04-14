const express = require('express');
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');
const portfolioController = require('../controllers/portfolioController');
const goalsController = require('../controllers/goalsController');
const interestsController = require('../controllers/interestsController');
const achievementsController = require('../controllers/achievementsController');
const sanctionsController = require('../controllers/sanctionsController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Защита на всички маршрути
router.use(authMiddleware);

// Студентски профил
router.post(
    '/',
    [
        body('grade').isIn(['8', '9', '10', '11', '12']).withMessage('Невалиден клас'),
        body('specialization').notEmpty().withMessage('Специалността е задължителна')
    ],
    studentController.createStudentProfile
);

router.get('/me', studentController.getCurrentStudentProfile);
router.get('/:userId', studentController.getStudentProfileByUserId);

router.put(
    '/:profileId',
    [
        body('grade').optional().isIn(['8', '9', '10', '11', '12']).withMessage('Невалиден клас'),
        body('specialization').optional().notEmpty().withMessage('Специалността е задължителна'),
        body('averageGrade').optional().isFloat({ min: 2, max: 6 }).withMessage('Средният успех трябва да е между 2 и 6')
    ],
    studentController.updateStudentProfile
);

router.delete('/:profileId', studentController.deleteStudentProfile);

// Портфолио
router.get('/:studentId/portfolio', portfolioController.getStudentPortfolio);

router.put(
    '/:studentId/portfolio',
    [
        body('experience').optional(),
        body('projects').optional(),
        body('mentorId').optional()
    ],
    portfolioController.updatePortfolio
);

router.post(
    '/:studentId/portfolio/recommendations',
    [
        body('text').notEmpty().withMessage('Текстът на препоръката е задължителен'),
        body('author').notEmpty().withMessage('Авторът на препоръката е задължителен')
    ],
    portfolioController.addRecommendation
);

router.delete('/:studentId/portfolio/recommendations/:recommendationId', portfolioController.removeRecommendation);

// Цели
router.get('/:studentId/goals', goalsController.getStudentGoals);

router.put(
    '/:studentId/goals/:category',
    [
        body('description').notEmpty().withMessage('Описанието е задължително'),
        body('activities').notEmpty().withMessage('Дейностите са задължителни')
    ],
    goalsController.updateGoal
);

// Интереси и хобита
router.get('/:studentId/interests', interestsController.getStudentInterests);

router.put(
    '/:studentId/interests',
    [
        body('interests').optional().isArray(),
        body('hobbies').optional().isArray()
    ],
    interestsController.updateInterests
);

// Постижения
router.get('/:studentId/achievements', achievementsController.getStudentAchievements);

router.post(
    '/:studentId/achievements',
    [
        body('category').isIn(['competition', 'olympiad', 'tournament', 'certificate', 'award', 'other']).withMessage('Невалидна категория'),
        body('title').notEmpty().withMessage('Заглавието е задължително'),
        body('date').isISO8601().withMessage('Невалидна дата')
    ],
    achievementsController.addAchievement
);

router.delete('/:studentId/achievements/:achievementId', achievementsController.removeAchievement);

// Санкции и забележки
router.get('/:studentId/sanctions', sanctionsController.getStudentSanctions);

router.put(
    '/:studentId/sanctions/absences',
    [
        body('excused').optional().isInt({ min: 0 }).withMessage('Невалиден брой извинени отсъствия'),
        body('unexcused').optional().isInt({ min: 0 }).withMessage('Невалиден брой неизвинени отсъствия'),
        body('maxAllowed').optional().isInt({ min: 0 }).withMessage('Невалиден брой максимално допустими отсъствия')
    ],
    sanctionsController.updateAbsences
);

router.put(
    '/:studentId/sanctions/schoolo-remarks',
    [
        body('schooloRemarks').isInt({ min: 0 }).withMessage('Невалиден брой забележки')
    ],
    sanctionsController.updateSchooloRemarks
);

router.post(
    '/:studentId/sanctions/active',
    [
        body('type').notEmpty().withMessage('Типът на санкцията е задължителен'),
        body('reason').notEmpty().withMessage('Причината за санкцията е задължителна'),
        body('startDate').isISO8601().withMessage('Невалидна начална дата'),
        body('issuedBy').notEmpty().withMessage('Издателят на санкцията е задължителен')
    ],
    sanctionsController.addActiveSanction
);

router.delete('/:studentId/sanctions/active/:sanctionId', sanctionsController.removeActiveSanction);

module.exports = router;