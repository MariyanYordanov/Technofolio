// server/utils/AppError.js
export class AppError extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const handleError = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // MongoDB грешки
    if (err.name === 'CastError') {
        const message = `Невалиден ${err.path}: ${err.value}`;
        error = new AppError(message, 400);
    }

    // Дублиран ключ
    if (err.code === 11000) {
        const message = `Дублиран ключ: ${Object.keys(err.keyValue).join(', ')}`;
        error = new AppError(message, 400);
    }

    // Валидационни грешки
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new AppError(message, 400);
    }

    // JWT грешки
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Невалиден токен. Моля, влезте отново.'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'error',
            message: 'Токенът е изтекъл. Моля, влезте отново.'
        });
    }

    // Грешка в production
    if (process.env.NODE_ENV === 'production') {
        if (error.isOperational) {
            return res.status(error.statusCode).json({
                status: 'error',
                message: error.message,
                errors: error.errors
            });
        }

        // Log грешката
        console.error('ERROR', err);

        // Изпращане на генерично съобщение
        return res.status(500).json({
            status: 'error',
            message: 'Нещо се обърка!'
        });
    }

    // Грешка в development
    res.status(error.statusCode || 500).json({
        status: 'error',
        message: error.message,
        error: err,
        stack: err.stack
    });
};