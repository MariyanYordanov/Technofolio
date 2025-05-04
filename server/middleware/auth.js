// server/middleware/auth.js
import { verify } from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config';

export default (req, res, next) => {
    try {
        // Извличане на токена от header-а
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Неоторизиран достъп' });
        }

        const token = authHeader.split(' ')[1];

        // Верифициране на токена
        const decoded = verify(token, JWT_SECRET, {
            algorithms: ['HS256'] // Експлицитно указваме алгоритъм
        });

        // Добавяне на данните от токена към request обекта
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Сесията ви е изтекла, моля влезте отново' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Невалиден токен' });
        }

        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Неоторизиран достъп' });
    }
};