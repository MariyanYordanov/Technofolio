// client/src/services/creditService.js
import * as request from '../utils/requestUtils.js';

const endpoints = {
    credits: '/api/credits',
};

// Извличане на кредити на ученик
export const getStudentCredits = async (userId) => {
    try {
        // Използваме userId вместо studentId
        const result = await request.get(`${endpoints.credits}?userId=${userId}`);
        return result.credits || [];
    } catch (error) {
        console.error('Error fetching student credits:', error);
        throw error;
    }
};

// Извличане на всички кредити (за учители и админи)
export const getAllCredits = async () => {
    try {
        const result = await request.get(`${endpoints.credits}/all`);
        return result.credits || [];
    } catch (error) {
        console.error('Error fetching all credits:', error);
        throw error;
    }
};

// Извличане на категории кредити
export const getCreditCategories = async () => {
    try {
        const result = await request.get(`${endpoints.credits}/categories`);
        return result.categoriesByPillar || {};
    } catch (error) {
        console.error('Error fetching credit categories:', error);
        throw error;
    }
};

// Добавяне на кредит
export const addCredit = async (userId, creditData) => {
    try {
        // Не изпращаме studentId, сървърът ще използва req.user.id
        const result = await request.post(endpoints.credits, {
            ...creditData,
            // Премахваме date и status - сървърът ги добавя автоматично
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
        const result = await request.patch(`${endpoints.credits}/${creditId}/validate`, {
            status: validation.status,
            validationNote: validation.notes || validation.validationNote
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

// Получаване на статистики за кредити
export const getCreditsStatistics = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        if (filters.pillar) queryParams.append('pillar', filters.pillar);
        if (filters.grade) queryParams.append('grade', filters.grade);

        const url = queryParams.toString() ?
            `${endpoints.credits}/stats?${queryParams.toString()}` :
            `${endpoints.credits}/stats`;

        const result = await request.get(url);
        return result.stats || {};
    } catch (error) {
        console.error('Error fetching credits statistics:', error);
        throw error;
    }
};

// Масово валидиране на кредити
export const bulkValidateCredits = async (creditIds, validationData) => {
    try {
        const result = await request.post(`${endpoints.credits}/bulk-validate`, {
            creditIds,
            ...validationData
        });
        return result;
    } catch (error) {
        console.error('Error bulk validating credits:', error);
        throw error;
    }
};