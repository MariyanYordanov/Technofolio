// server/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
import connectDB from './config/db.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { handleError } from './utils/AppError.js';
import xssMiddleware from './middleware/xss.js';

// Импортиране на маршрути
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import eventsRoutes from './routes/eventsRoutes.js';
import creditsRoutes from './routes/creditsRoutes.js';

// Инициализиране на app
const app = express();

// Свързване с базата данни
connectDB();

// Middleware за сигурност
app.use(helmet()); // Задава важни HTTP хедъри за сигурност
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(cookieParser()); // За работа с cookies
app.use(express.json({ limit: '10kb' })); // Ограничаване на размера на JSON заявки
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Защита от NoSQL инжекции
app.use(mongoSanitize());

// Защита от XSS атаки
app.use(xssMiddleware);

// Защита от параметърен замърсяване (HTTP Parameter Pollution)
app.use(hpp({
    whitelist: ['grade', 'specialization'] // Параметри, които могат да се повтарят
}));

// Компресия на отговорите
app.use(compression());

// Rate limiting
app.use('/api', generalLimiter);

// Маршрути за автентикация
app.use('/api/auth', authRoutes);

// Други маршрути
app.use('/api/students', studentRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/credits', creditsRoutes);

// Обикновен маршрут за тестване
app.get('/', (req, res) => {
    res.json({ message: 'Технофолио API работи!' });
});

// Middleware за обработка на неналичен маршрут
app.all('*', (req, res, next) => {
    const err = new Error(`Не може да се намери ${req.originalUrl} на този сървър!`);
    err.statusCode = 404;
    next(err);
});

// Middleware за глобална обработка на грешки
app.use(handleError);

// Стартиране на сървъра
const PORT = process.env.PORT || 3030;
const server = app.listen(PORT, () => console.log(`Сървърът работи на порт ${PORT}`));

// Обработка на нетретирани отхвърляния на Promise
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Приключване на работата...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Обработка на нетретирани грешки
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Приключване на работата...');
    console.error(err.name, err.message);
    process.exit(1);
});