// client/src/services/creditService.js
import * as request from '../utils/requestUtils.js';

const endpoints = {
    credits: '/api/credits',
};

// Извличане на кредити на ученик
export const getStudentCredits = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.credits}?studentId=${studentId}`);
        return result.credits || [];
    } catch (error) {
        console.error('Error fetching student credits:', error);
        throw error;
    }
};

// Извличане на всички кредити (за учители и админи)
export const getAllCredits = async () => {
    try {
        const result = await request.get(endpoints.credits);
        return result.credits || [];
    } catch (error) {
        console.error('Error fetching all credits:', error);
        throw error;
    }
};

// Извличане на категории кредити

// Добавяне на кредит
export const addCredit = async (studentId, creditData) => {
    try {
        const result = await request.post(endpoints.credits, {
            ...creditData,
            studentId,
            date: new Date().toISOString(),
            status: 'pending',
        });
        return result.credit || result;
    } catch (error) {
        console.error('Error adding credit:', error);
        throw error;
    }
};

// Обновяване на кредит
export const updateCredit = async (creditId, creditData) => {
    try {
        const result = await request.patch(`${endpoints.credits}/${creditId}`, creditData);
        return result.credit || result;
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
        const result = await request.patch(`${endpoints.credits}/${creditId}`, {
            status: validation.status,
            validationNotes: validation.notes,
            validatedAt: new Date().toISOString()
        });
        return result.credit || result;
    } catch (error) {
        console.error('Error validating credit:', error);
        throw error;
    }
};

// Извличане на непроверени кредити (за учители и администратори)
export const getPendingCredits = async () => {
    try {
        const result = await request.get(`${endpoints.credits}?status=pending`);
        return result.credits || [];
    } catch (error) {
        console.error('Error fetching pending credits:', error);
        throw error;
    }
};

// Извличане на всички кредити за клас (за учители и администратори)
export const getCreditsForClass = async (grade) => {
    try {
        const result = await request.get(`${endpoints.credits}?grade=${grade}`);
        return result.credits || [];
    } catch (error) {
        console.error('Error fetching credits for class:', error);
        throw error;
    }
};