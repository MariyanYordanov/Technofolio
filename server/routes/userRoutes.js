// server/routes/userRoutes.js - Updated with all student functionality
import { Router } from 'express';
import { body } from 'express-validator';
import {
    // Основни user функции
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    resetUserPassword,
    deleteUser,
    changeUserRole,
    getUsersStats,
    searchUsers,
    getUsersByRole,
    bulkUpdateUsers,
    getUsersWithExpiringPasswords,
    toggleUserAccount,

    // Ученически функции
    getAllStudents,
    getStudentsStats,
    updateStudentInfo,

    // Цели
    getUserGoals,
    updateUserGoal,
    deleteUserGoal,

    // Интереси
    getUserInterests,
    updateUserInterests,

    // Портфолио
    getUserPortfolio,
    updateUserPortfolio,
    addPortfolioRecommendation,
    removePortfolioRecommendation,

    // Санкции
    getUserSanctions,
    updateUserAbsences,
    addUserSanction,
    removeUserSanction
} from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';
import { restrictTo } from '../middleware/auth.js';

const router = Router();

// Защита на всички маршрути
router.use(authMiddleware);

// ===== ПУБЛИЧНИ СТАТИСТИКИ (за учители и админи) =====
router.get('/stats', restrictTo('teacher', 'admin'), getUsersStats);
router.get('/students/stats', restrictTo('teacher', 'admin'), getStudentsStats);

// ===== ТЪРСЕНЕ И ФИЛТРИРАНЕ =====
router.get('/search', searchUsers);
router.get('/role/:role', getUsersByRole);
router.get('/expiring-passwords', restrictTo('admin'), getUsersWithExpiringPasswords);

// ===== УЧЕНИЦИ (за учители и админи) =====
router.get('/students', restrictTo('teacher', 'admin'), getAllStudents);

// ===== ОСНОВНИ USER ОПЕРАЦИИ =====
router.get('/', restrictTo('admin'), getAllUsers);

router.post(
    '/',
    restrictTo('admin'),
    [
        body('email').isEmail().withMessage('Моля, въведете валиден имейл'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Паролата трябва да бъде поне 8 символа')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage('Паролата трябва да съдържа главна буква, малка буква, цифра и специален символ'),
        body('firstName').notEmpty().withMessage('Името е задължително'),
        body('lastName').notEmpty().withMessage('Фамилията е задължителна'),
        body('role').isIn(['student', 'teacher', 'admin']).withMessage('Невалидна роля')
    ],
    createUser
);

// ===== МАСОВИ ОПЕРАЦИИ =====
router.post(
    '/bulk-update',
    restrictTo('admin'),
    [
        body('userIds').isArray().withMessage('userIds трябва да бъде масив'),
        body('userIds.*').isMongoId().withMessage('Невалиден user ID')
    ],
    bulkUpdateUsers
);

// ===== ОПЕРАЦИИ ЗА КОНКРЕТЕН ПОТРЕБИТЕЛ =====
router.get('/:id', getUserById);

router.put(
    '/:id',
    [
        body('firstName').optional().notEmpty().withMessage('Името не може да бъде празно'),
        body('lastName').optional().notEmpty().withMessage('Фамилията не може да бъде празна')
    ],
    updateUser
);

router.patch(
    '/:id/reset-password',
    restrictTo('admin'),
    [
        body('password')
            .isLength({ min: 8 })
            .withMessage('Паролата трябва да бъде поне 8 символа')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage('Паролата трябва да съдържа главна буква, малка буква, цифра и специален символ')
    ],
    resetUserPassword
);

router.patch(
    '/:id/change-role',
    restrictTo('admin'),
    [
        body('role').isIn(['student', 'teacher', 'admin']).withMessage('Невалидна роля')
    ],
    changeUserRole
);

router.patch('/:id/toggle-account', restrictTo('admin'), toggleUserAccount);

router.delete('/:id', restrictTo('admin'), deleteUser);

// ===== УЧЕНИЧЕСКИ ДАННИ =====
router.patch(
    '/:id/student-info',
    [
        body('grade').optional().isIn(['8', '9', '10', '11', '12']).withMessage('Невалиден клас'),
        body('specialization').optional().notEmpty().withMessage('Специалността е задължителна'),
        body('averageGrade').optional().isFloat({ min: 2, max: 6 }).withMessage('Средният успех трябва да е между 2 и 6')
    ],
    updateStudentInfo
);

// ===== ЦЕЛИ =====
router.get('/:id/goals', getUserGoals);

router.put(
    '/:id/goals/:category',
    [
        body('title').notEmpty().withMessage('Заглавието е задължително'),
        body('description').notEmpty().withMessage('Описанието е задължително'),
        body('activities').isArray().withMessage('Дейностите трябва да бъдат масив')
    ],
    updateUserGoal
);

router.delete('/:id/goals/:category', deleteUserGoal);

// ===== ИНТЕРЕСИ И ХОБИТА =====
router.get('/:id/interests', getUserInterests);

router.put(
    '/:id/interests',
    [
        body('interests').optional().isArray().withMessage('Интересите трябва да бъдат масив'),
        body('interests.*.category').optional().notEmpty().withMessage('Категорията е задължителна'),
        body('interests.*.subcategory').optional().notEmpty().withMessage('Подкатегорията е задължителна'),
        body('hobbies').optional().isArray().withMessage('Хобитата трябва да бъдат масив')
    ],
    updateUserInterests
);

// ===== ПОРТФОЛИО =====
router.get('/:id/portfolio', getUserPortfolio);

router.put(
    '/:id/portfolio',
    [
        body('experience').optional().isString().withMessage('Experience трябва да е текст'),
        body('projects').optional().isString().withMessage('Projects трябва да е текст'),
        body('mentorId').optional().isMongoId().withMessage('Невалиден mentor ID')
    ],
    updateUserPortfolio
);

router.post(
    '/:id/portfolio/recommendations',
    [
        body('text').notEmpty().withMessage('Текстът на препоръката е задължителен'),
        body('author').notEmpty().withMessage('Авторът на препоръката е задължителен')
    ],
    addPortfolioRecommendation
);

router.delete('/:id/portfolio/recommendations/:recommendationId', removePortfolioRecommendation);

// ===== САНКЦИИ И ОТСЪСТВИЯ =====
router.get('/:id/sanctions', restrictTo('teacher', 'admin'), getUserSanctions);

router.put(
    '/:id/sanctions/absences',
    restrictTo('teacher', 'admin'),
    [
        body('excused').optional().isInt({ min: 0 }).withMessage('Невалиден брой извинени отсъствия'),
        body('unexcused').optional().isInt({ min: 0 }).withMessage('Невалиден брой неизвинени отсъствия'),
        body('maxAllowed').optional().isInt({ min: 0 }).withMessage('Невалиден брой максимално допустими отсъствия'),
        body('schooloRemarks').optional().isInt({ min: 0 }).withMessage('Невалиден брой забележки')
    ],
    updateUserAbsences
);

router.post(
    '/:id/sanctions/active',
    restrictTo('teacher', 'admin'),
    [
        body('type').notEmpty().withMessage('Типът на санкцията е задължителен'),
        body('reason').notEmpty().withMessage('Причината за санкцията е задължителна'),
        body('startDate').isISO8601().withMessage('Невалидна начална дата'),
        body('endDate').optional().isISO8601().withMessage('Невалидна крайна дата'),
        body('issuedBy').notEmpty().withMessage('Издателят на санкцията е задължителен')
    ],
    addUserSanction
);

router.delete('/:id/sanctions/active/:sanctionId', restrictTo('teacher', 'admin'), removeUserSanction);

export default router;