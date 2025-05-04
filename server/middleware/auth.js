// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/User.js';
import config from '../config/config.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';

// Middleware за проверка на автентикация
const authMiddleware = catchAsync(async (req, res, next) => {
    let token;

    // Проверка за токен в headers или cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return next(new AppError('Не сте влезли в профила си. Моля, влезте, за да получите достъп.', 401));
    }

    // Верификация на токена
    const decoded = await promisify(jwt.verify)(token, config.JWT_SECRET);

    // Проверка дали потребителят все още съществува
    const user = await User.findById(decoded.id);

    if (!user) {
        return next(new AppError('Потребителят, свързан с този токен, вече не съществува.', 401));
    }

    // Проверка дали потребителят е променил паролата си след издаването на токена
    if (user.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('Потребителят наскоро промени паролата си. Моля, влезте отново.', 401));
    }

    // Прикачване на потребителя към request обекта
    req.user = user;
    next();
});

// Middleware за ограничаване на достъпа според ролята
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Нямате разрешение да изпълните това действие', 403));
        }
        next();
    };
};

export default authMiddleware;