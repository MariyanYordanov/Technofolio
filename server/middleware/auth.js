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

        // Верифициране на токена
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Добавяне на потребителя към request обекта
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({ message: 'Потребителят не е намерен' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Невалиден токен' });
    }
};