// server/routes/reportsRoutes.js
import { Router } from 'express';
import {
    generateAbsenceReport,
    generateEventsReport,
    generateStudentReport
} from '../controllers/reportsController.js';
import authMiddleware from '../middleware/auth.js';
import { restrictTo } from '../middleware/auth.js';

const router = Router();

// Защита на всички маршрути
router.use(authMiddleware);

// Ограничение до учители и администратори
router.use(restrictTo('teacher', 'admin'));

// Маршрут за отчет за отсъствия
router.get('/absences', generateAbsenceReport);

// Маршрут за отчет за събития
router.get('/events', generateEventsReport);

// Маршрут за обобщен отчет за ученик 
router.get('/user/:userId/:format', generateStudentReport);

export default router;