// client/src/services/creditService.js
import * as request from '../utils/requestUtils.js';

const endpoints = {
    credits: '/data/credits',
    categories: '/data/creditCategories',
};

// Извличане на кредити на ученик
export const getStudentCredits = async (studentId) => {
    try {
        const queryParams = new URLSearchParams({
            where: `studentId="${studentId}"`,
        }).toString();

        const result = await request.get(`${endpoints.credits}?${queryParams}`);
        return result;
    } catch (error) {
        console.error('Error fetching student credits:', error);
        throw error;
    }
};

// Извличане на категории кредити
export const getCreditCategories = async () => {
    try {
        const result = await request.get(endpoints.categories);
        return result;
    } catch (error) {
        console.error('Error fetching credit categories:', error);
        throw error;
    }
};

// Добавяне на кредит
export const addCredit = async (studentId, creditData) => {
    try {
        const result = await request.post(endpoints.credits, {
            ...creditData,
            studentId,
            date: new Date().toISOString(),
            status: 'pending',
        });
        return result;
    } catch (error) {
        console.error('Error adding credit:', error);
        throw error;
    }
};

// Обновяване на кредит
export const updateCredit = async (creditId, creditData) => {
    try {
        const result = await request.put(`${endpoints.credits}/${creditId}`, creditData);
        return result;
    } catch (error) {
        console.error('Error updating credit:', error);
        throw error;
    }
};

// Изтриване на кредит
export const deleteCredit = async (creditId) => {
    try {
        const result = await request.del(`${endpoints.credits}/${creditId}`);
        return result;
    } catch (error) {
        console.error('Error deleting credit:', error);
        throw error;
    }
};

// Валидиране на кредит (за учители и администратори)
export const validateCredit = async (creditId, validation) => {
    try {
        const result = await request.patch(`${endpoints.credits}/${creditId}/validate`, {
            ...validation,
            validationDate: new Date().toISOString()
        });
        return result;
    } catch (error) {
        console.error('Error validating credit:', error);
        throw error;
    }
};

// Извличане на непроверени кредити (за учители и администратори)
export const getPendingCredits = async () => {
    try {
        const queryParams = new URLSearchParams({
            where: 'status="pending"',
        }).toString();

        const result = await request.get(`${endpoints.credits}?${queryParams}`);
        return result;
    } catch (error) {
        console.error('Error fetching pending credits:', error);
        throw error;
    }
};

// Извличане на всички кредити за клас (за учители и администратори)
export const getCreditsForClass = async (grade) => {
    try {
        const queryParams = new URLSearchParams({
            grade: grade,
        }).toString();

        const result = await request.get(`${endpoints.credits}/class?${queryParams}`);
        return result;
    } catch (error) {
        console.error('Error fetching credits for class:', error);
        throw error;
    }
};