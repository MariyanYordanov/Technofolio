// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

// Middleware за проверка на автентикация
const authMiddleware = (req, res, next) => {
    // Взимаме токена от хедъра на заявката
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Не е предоставен token за достъп' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Проверяваме валидността на токена
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ message: 'Невалиден token за достъп' });
    }
};

export default authMiddleware;