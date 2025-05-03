import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js';

export default function authMiddleware(req, res, next) {
    // Извличане на токена от хедъра
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Не е предоставен токен за автентикация' });
    }

    try {
        // Верифициране на токена
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Невалиден токен' });
    }
}