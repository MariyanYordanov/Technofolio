// client/src/services/teacherService.js
import * as request from '../utils/requestUtils.js';

const endpoints = {
    students: '/api/teacher/students',
    student: '/api/teacher/students',
    credits: '/api/credits',
    creditsStudent: '/api/credits/students',
    validateCredit: '/api/credits',
    portfolios: '/api/portfolios',
    achievements: '/api/achievements',
    sanctions: '/api/sanctions',
    goals: '/api/goals',
    attendance: '/api/attendance',
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

// Получаване на всички кредити (не само за определен ученик)
export const getAllCredits = async () => {
    try {
        const result = await request.get(endpoints.credits);
        return result;
    } catch (error) {
        console.error('Error fetching all credits:', error);
        throw error;
    }
};

// Получаване на портфолиото на ученик
export const getStudentPortfolio = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.portfolios}?where=studentId="${studentId}"`);
        if (result && result.length > 0) {
            return result[0];
        }
        return null;
    } catch (error) {
        console.error(`Error fetching portfolio for student ${studentId}:`, error);
        throw error;
    }
};

// Получаване на постиженията на ученик
export const getStudentAchievements = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.achievements}?where=studentId="${studentId}"`);
        return result || [];
    } catch (error) {
        console.error(`Error fetching achievements for student ${studentId}:`, error);
        throw error;
    }
};

// Получаване на целите на ученик
export const getStudentGoals = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.goals}?where=studentId="${studentId}"`);
        if (result && result.length > 0) {
            return result[0];
        }
        return null;
    } catch (error) {
        console.error(`Error fetching goals for student ${studentId}:`, error);
        throw error;
    }
};

// Получаване на санкциите на ученик
export const getStudentSanctions = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.sanctions}?where=studentId="${studentId}"`);
        if (result && result.length > 0) {
            return result[0];
        }
        return null;
    } catch (error) {
        console.error(`Error fetching sanctions for student ${studentId}:`, error);
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
        const result = await request.patch(`${endpoints.sanctions}/${studentId}/absences`, absencesData);
        return result;
    } catch (error) {
        console.error(`Error updating absences for student ${studentId}:`, error);
        throw error;
    }
};

// Обновяване на забележки в Школо
export const updateSchooloRemarks = async (studentId, remarksData) => {
    try {
        const result = await request.patch(`${endpoints.sanctions}/${studentId}/schoolo-remarks`, remarksData);
        return result;
    } catch (error) {
        console.error(`Error updating schoolo remarks for student ${studentId}:`, error);
        throw error;
    }
};

// Добавяне на активна санкция
export const addActiveSanction = async (studentId, sanctionData) => {
    try {
        const result = await request.post(`${endpoints.sanctions}/${studentId}/active`, sanctionData);
        return result;
    } catch (error) {
        console.error(`Error adding sanction for student ${studentId}:`, error);
        throw error;
    }
};

// Премахване на активна санкция
export const removeActiveSanction = async (studentId, sanctionId) => {
    try {
        const result = await request.del(`${endpoints.sanctions}/${studentId}/active/${sanctionId}`);
        return result;
    } catch (error) {
        console.error(`Error removing sanction for student ${studentId}:`, error);
        throw error;
    }
};

// Добавяне на препоръка към ученическо портфолио
export const addRecommendation = async (portfolioId, recommendationData) => {
    try {
        const result = await request.post(`${endpoints.portfolios}/${portfolioId}/recommendations`, recommendationData);
        return result;
    } catch (error) {
        console.error(`Error adding recommendation to portfolio ${portfolioId}:`, error);
        throw error;
    }
};

// Обновяване на статус на ученическо постижение
export const updateAchievementStatus = async (achievementId, statusData) => {
    try {
        const result = await request.patch(`${endpoints.achievements}/${achievementId}/status`, statusData);
        return result;
    } catch (error) {
        console.error(`Error updating achievement status ${achievementId}:`, error);
        throw error;
    }
};

// Извличане на всички неприключени кредитни заявки
export const getPendingCredits = async () => {
    try {
        const result = await request.get(`${endpoints.validateCredit}?where=status="pending"`);
        return result;
    } catch (error) {
        console.error('Error fetching pending credits:', error);
        throw error;
    }
};

// Извличане на обобщена статистика за учениците
export const getStudentsStatistics = async () => {
    try {
        const result = await request.get(`${endpoints.students}/statistics`);
        return result;
    } catch (error) {
        console.error('Error fetching students statistics:', error);
        throw error;
    }
};

// Генериране на отчет за кредити
export const generateCreditsReport = async (params) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.grade) queryParams.append('grade', params.grade);
        if (params.specialization) queryParams.append('specialization', params.specialization);
        if (params.pillar) queryParams.append('pillar', params.pillar);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const result = await request.get(`${endpoints.credits}/report?${queryParams.toString()}`);
        return result;
    } catch (error) {
        console.error('Error generating credits report:', error);
        throw error;
    }
};

// Генериране на отчет за ученици
export const generateStudentsReport = async (params) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.grade) queryParams.append('grade', params.grade);
        if (params.specialization) queryParams.append('specialization', params.specialization);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const result = await request.get(`${endpoints.students}/report?${queryParams.toString()}`);
        return result;
    } catch (error) {
        console.error('Error generating students report:', error);
        throw error;
    }
};

// Генериране на отчет за събития
export const generateEventsReport = async (params) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.grade) queryParams.append('grade', params.grade);
        if (params.specialization) queryParams.append('specialization', params.specialization);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const result = await request.get(`/api/events/report?${queryParams.toString()}`);
        return result;
    } catch (error) {
        console.error('Error generating events report:', error);
        throw error;
    }
};

// Генериране на отчет за постижения
export const generateAchievementsReport = async (params) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.grade) queryParams.append('grade', params.grade);
        if (params.specialization) queryParams.append('specialization', params.specialization);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const result = await request.get(`${endpoints.achievements}/report?${queryParams.toString()}`);
        return result;
    } catch (error) {
        console.error('Error generating achievements report:', error);
        throw error;
    }
};

// Генериране на отчет за санкции
export const generateSanctionsReport = async (params) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.grade) queryParams.append('grade', params.grade);
        if (params.specialization) queryParams.append('specialization', params.specialization);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const result = await request.get(`${endpoints.sanctions}/report?${queryParams.toString()}`);
        return result;
    } catch (error) {
        console.error('Error generating sanctions report:', error);
        throw error;
    }
};

// Експортиране на отчет
export const exportReport = async (reportType, params, format) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.grade) queryParams.append('grade', params.grade);
        if (params.specialization) queryParams.append('specialization', params.specialization);
        if (params.pillar) queryParams.append('pillar', params.pillar);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        queryParams.append('format', format);

        const endpoint = `/api/reports/${reportType}/export?${queryParams.toString()}`;
        const response = await fetch(`${request.serverUrl}${endpoint}`, {
            method: 'GET',
            headers: {
                ...request.defaultHeaders,
                ...request.getAuthHeaders(),
            },
        });

        if (!response.ok) {
            throw new Error(`Грешка при експортиране на отчета: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${reportType}_report.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return true;
    } catch (error) {
        console.error(`Error exporting ${reportType} report:`, error);
        throw error;
    }
};

// Експортиране на данни за класен ръководител
export const exportClassData = async (classId) => {
    try {
        const result = await request.get(`${endpoints.students}/class/${classId}/export`);
        return result;
    } catch (error) {
        console.error(`Error exporting data for class ${classId}:`, error);
        throw error;
    }
};

export default {
    getAllStudents,
    getStudentById,
    //getStudentCredits,
    getStudentPortfolio,
    getStudentAchievements,
    getStudentGoals,
    getStudentSanctions,
    validateCredit,
    updateStudentAbsences,
    updateSchooloRemarks,
    addActiveSanction,
    removeActiveSanction,
    addRecommendation,
    updateAchievementStatus,
    getPendingCredits,
    getStudentsStatistics,
    generateCreditsReport,
    generateStudentsReport,
    generateEventsReport,
    generateAchievementsReport,
    generateSanctionsReport,
    exportReport,
    exportClassData
};