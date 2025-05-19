// client/src/services/teacherService.js
import * as request from '../utils/requestUtils.js';

const endpoints = {
    students: '/api/teacher/students',
    student: '/api/teacher/students',
    credits: '/api/credits/students',
    validateCredit: '/api/credits',
};

// Получаване на всички ученици
export const getAllStudents = async () => {
    try {
        const result = await request.get(endpoints.students);
        return result;
    } catch (error) {
        console.error('Error fetching students:', error);
        throw error;
    }
};

// Получаване на конкретен ученик по ID
export const getStudentById = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.student}/${studentId}`);
        return result;
    } catch (error) {
        console.error(`Error fetching student with ID ${studentId}:`, error);
        throw error;
    }
};

// Получаване на кредитите на ученик
export const getStudentCredits = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.credits}/${studentId}`);
        return result;
    } catch (error) {
        console.error(`Error fetching credits for student ${studentId}:`, error);
        throw error;
    }
};

// Получаване на постиженията на ученик
export const getStudentAchievements = async (studentId) => {
    try {
        const result = await request.get(`/api/students/${studentId}/achievements`);
        return result;
    } catch (error) {
        console.error(`Error fetching achievements for student ${studentId}:`, error);
        throw error;
    }
};

// Получаване на целите на ученик
export const getStudentGoals = async (studentId) => {
    try {
        const result = await request.get(`/api/students/${studentId}/goals`);
        return result;
    } catch (error) {
        console.error(`Error fetching goals for student ${studentId}:`, error);
        throw error;
    }
};

// Валидиране на кредит
export const validateCredit = async (creditId, validationData) => {
    try {
        const result = await request.patch(`${endpoints.validateCredit}/${creditId}/validate`, validationData);
        return result;
    } catch (error) {
        console.error(`Error validating credit ${creditId}:`, error);
        throw error;
    }
};

// Обновяване на отсъствия на ученик
export const updateStudentAbsences = async (studentId, absencesData) => {
    try {
        const result = await request.put(`/api/students/${studentId}/sanctions/absences`, absencesData);
        return result;
    } catch (error) {
        console.error(`Error updating absences for student ${studentId}:`, error);
        throw error;
    }
};

// Добавяне на забележка към Школо
export const updateSchooloRemarks = async (studentId, remarksData) => {
    try {
        const result = await request.put(`/api/students/${studentId}/sanctions/schoolo-remarks`, remarksData);
        return result;
    } catch (error) {
        console.error(`Error updating schoolo remarks for student ${studentId}:`, error);
        throw error;
    }
};

// Добавяне на санкция
export const addActiveSanction = async (studentId, sanctionData) => {
    try {
        const result = await request.post(`/api/students/${studentId}/sanctions/active`, sanctionData);
        return result;
    } catch (error) {
        console.error(`Error adding sanction for student ${studentId}:`, error);
        throw error;
    }
};

export default {
    getAllStudents,
    getStudentById,
    getStudentCredits,
    getStudentAchievements,
    getStudentGoals,
    validateCredit,
    updateStudentAbsences,
    updateSchooloRemarks,
    addActiveSanction
};