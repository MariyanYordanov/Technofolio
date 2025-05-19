// server/routes/userRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    resetUserPassword,
    deleteUser,
    changeUserRole,
    getUsersStats
} from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';
import { restrictTo } from '../middleware/auth.js';

const router = Router();

// Защита на всички маршрути
router.use(authMiddleware);

// Ограничение само за администратори (с изключение на getUserById, който може да се използва от учители)
router.use(restrictTo('admin'));

// Маршрут за статистика
router.get('/stats', getUsersStats);

// Маршрут за получаване на всички потребители
router.get('/', getAllUsers);

// Маршрут за получаване на потребител по ID (достъпен и за учители)
router.get('/:id', getUserById);

// Маршрут за създаване на потребител
router.post(
    '/',
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

// Маршрут за обновяване на потребител
router.put(
    '/:id',
    [
        body('firstName').optional().notEmpty().withMessage('Името не може да бъде празно'),
        body('lastName').optional().notEmpty().withMessage('Фамилията не може да бъде празна'),
        body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Невалидна роля')
    ],
    updateUser
);

// Маршрут за задаване на нова парола
router.patch(
    '/:id/reset-password',
    [
        body('password')
            .isLength({ min: 8 })
            .withMessage('Паролата трябва да бъде поне 8 символа')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage('Паролата трябва да съдържа главна буква, малка буква, цифра и специален символ')
    ],
    resetUserPassword
);

// Маршрут за смяна на ролята
router.patch(
    '/:id/change-role',
    [
        body('role').isIn(['student', 'teacher', 'admin']).withMessage('Невалидна роля')
    ],
    changeUserRole
);

// Маршрут за изтриване на потребител
router.delete('/:id', deleteUser);

export default router;