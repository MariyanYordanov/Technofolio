// server/index.js - Updated without student and sanctions routes
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Импортиране на маршрути
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventsRoutes from './routes/eventsRoutes.js';
import creditsRoutes from './routes/creditsRoutes.js';
import achievementsRoutes from './routes/achievementsRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';

// Инициализиране на app
const app = express();

// Свързване с базата данни
connectDB();

// Глобален rate limiter за защита срещу DoS атаки
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минути
    max: 100, // Лимит от 100 заявки на IP за този период
    standardHeaders: true,
    legacyHeaders: false
});

// Middleware за сигурност
app.use(helmet()); // Сигурност на HTTP хедъри
app.use(mongoSanitize()); // Предотвратяване на NoSQL инжекции
app.use(xss()); // Защита срещу XSS атаки
app.use(limiter); // Rate limiting
app.use(compression()); // Компресиране на отговорите

// Middleware за обработка на заявки
app.use(express.json({ limit: '10kb' })); // Ограничаване на размера на body
app.use(cookieParser()); // Обработка на cookies

// CORS настройки - актуализирани за работа с React приложението
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true, // Важно за работа с cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Маршрути за API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Обикновен маршрут за тестване
app.get('/', (req, res) => {
    res.json({ message: 'Технофолио API работи!' });
});

// Middleware за обработка на неналичен маршрут
app.use((req, res, next) => {
    res.status(404).json({ message: 'Маршрутът не е намерен!' });
});

// Middleware за глобална обработка на грешки
app.use((error, req, res, next) => {
    console.error(error.stack);
    const status = error.statusCode || 500;
    const message = error.message || 'Възникна грешка в сървъра';
    res.status(status).json({ message });
});

// Стартиране на сървъра
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => console.log(`Сървърът работи на http://localhost:${PORT}`));