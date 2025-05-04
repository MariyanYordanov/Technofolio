// server/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// Основен rate limiter
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минути
    max: 100, // ограничение до 100 заявки на IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Твърде много заявки от този IP адрес, моля опитайте отново след 15 минути'
    }
});

// Лимитер за вход и регистрация
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 10, // 10 опита за вход/регистрация
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Твърде много опити за вход. Моля, опитайте отново след 1 час.'
    }
});

// Лимитер за нулиране на парола
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 3, // 3 опита за нулиране на парола
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Твърде много заявки за нулиране на парола. Моля, опитайте отново след 1 час.'
    }
});