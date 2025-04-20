const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        // Извличане на token от хедъра
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Няма предоставен токен' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Няма предоставен токен' });
        }

        // Верифициране на токена със смислени съобщения за грешки
        let decoded;
        try {
            decoded = jwt.verify(token, config.JWT_SECRET || 'fallback-secret-key');
        } catch (jwtError) {
            console.error('JWT Verification Error:', jwtError);

            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Токенът е изтекъл' });
            }

            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Невалиден токен' });
            }

            return res.status(401).json({ message: 'Проблем с автентикацията' });
        }

        // Добавяне на потребителя към request обекта
        try {
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(401).json({ message: 'Потребителят не е намерен' });
            }

            // Прикачваме потребителя към request обекта
            req.user = user;
            next();
        } catch (dbError) {
            console.error('Database Error in Auth Middleware:', dbError);
            return res.status(500).json({ message: 'Сървърна грешка при автентикация' });
        }
    } catch (error) {
        console.error('Unhandled Error in Auth Middleware:', error);
        return res.status(500).json({ message: 'Неочаквана грешка при автентикация' });
    }
};