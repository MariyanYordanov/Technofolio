// index.js
import 'dotenv/config'; // Вместо require('dotenv').config();
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

// Импортиране на маршрути
import authRoutes from './routes/authRoutes.js'; // Добавяме authRoutes
import studentRoutes from './routes/studentRoutes.js';
import eventsRoutes from './routes/eventsRoutes.js';
import creditsRoutes from './routes/creditsRoutes.js';

// Инициализиране на app
const app = express();

// Свързване с базата данни
connectDB();

// Middleware
app.use(express.json()); // Използваме express.json() вместо импортираната функция json

// CORS настройки
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Маршрути за автентикация
app.use('/api/auth', authRoutes); // Използваме authRoutes вместо handlers

// Други маршрути
app.use('/api/students', studentRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/credits', creditsRoutes);

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
app.listen(PORT, () => console.log(`Сървърът работи на порт ${PORT}`));