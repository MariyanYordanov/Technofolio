// server/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Общ лимитер за всички заявки
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минути
    max: 100, // максимален брой заявки от IP адрес
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Твърде много заявки от този IP адрес, моля опитайте отново по-късно.'
});

// Лимитер за автентикационни заявки
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 10, // максимален брой заявки от IP адрес
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Твърде много опити за автентикация, моля опитайте отново по-късно.'
});

// Лимитер за имейл заявки
const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 5, // максимален брой заявки от IP адрес
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Твърде много имейл заявки, моля опитайте отново по-късно.'
});

module.exports = {
    globalLimiter,
    authLimiter,
    emailLimiter
};