// client/src/services/teacherService.js
import * as request from '../utils/requestUtils.js';

const endpoints = {
    users: '/api/users',
    credits: '/api/credits',
    events: '/api/events',
    achievements: '/api/achievements',
    reports: '/api/reports',
    notifications: '/api/notifications'
};

// Получаване на всички ученици
export const getAllStudents = async () => {
    try {
        const result = await request.get(`${endpoints.users}?role=student`);
        return result.users || [];
    } catch (error) {
        console.error('Error fetching students:', error);
        throw error;
    }
};

// Получаване на конкретен ученик по ID
export const getStudentById = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.users}/${studentId}`);
        return result.user || result;
    } catch (error) {
        console.error(`Error fetching student with ID ${studentId}:`, error);
        throw error;
    }
};

// Получаване на кредитите на конкретен ученик
export const getStudentCredits = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.credits}?studentId=${studentId}`);
        return result.credits || [];
    } catch (error) {
        console.error(`Error fetching credits for student ${studentId}:`, error);
        throw error;
    }
};

// Получаване на всички кредити (не само за определен ученик)
export const getAllCredits = async () => {
    try {
        const result = await request.get(endpoints.credits);
        return result.credits || [];
    } catch (error) {
        console.error('Error fetching all credits:', error);
        throw error;
    }
};

// Получаване на портфолиото на ученик
export const getStudentPortfolio = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.users}/${studentId}`);
        return result.user?.student?.portfolio || null;
    } catch (error) {
        console.error(`Error fetching portfolio for student ${studentId}:`, error);
        throw error;
    }
};

// Получаване на постиженията на ученик
export const getStudentAchievements = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.achievements}?studentId=${studentId}`);
        return result.achievements || [];
    } catch (error) {
        console.error(`Error fetching achievements for student ${studentId}:`, error);
        throw error;
    }
};

// Получаване на целите на ученик
export const getStudentGoals = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.users}/${studentId}`);
        return result.user?.student?.goals || {};
    } catch (error) {
        console.error(`Error fetching goals for student ${studentId}:`, error);
        throw error;
    }
};

// Получаване на санкциите на ученик
export const getStudentSanctions = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.users}/${studentId}`);
        return result.user?.student?.sanctions || {
            absences: { excused: 0, unexcused: 0, maxAllowed: 150 },
            schooloRemarks: 0,
            activeSanctions: []
        };
    } catch (error) {
        console.error(`Error fetching sanctions for student ${studentId}:`, error);
        throw error;
    }
};

// Валидиране на кредит
export const validateCredit = async (creditId, validationData) => {
    try {
        const result = await request.patch(`${endpoints.credits}/${creditId}`, {
            status: validationData.status,
            validationNotes: validationData.notes
        });
        return result.credit || result;
    } catch (error) {
        console.error(`Error validating credit ${creditId}:`, error);
        throw error;
    }
};

// Обновяване на отсъствия на ученик
export const updateStudentAbsences = async (studentId, absencesData) => {
    try {
        const result = await request.patch(`${endpoints.users}/${studentId}/student`, {
            'sanctions.absences': absencesData
        });
        return result.user?.student?.sanctions || {};
    } catch (error) {
        console.error(`Error updating absences for student ${studentId}:`, error);
        throw error;
    }
};

// Обновяване на забележки в Школо
export const updateSchooloRemarks = async (studentId, remarksData) => {
    try {
        const result = await request.patch(`${endpoints.users}/${studentId}/student`, {
            'sanctions.schooloRemarks': remarksData.remarks
        });
        return result.user?.student?.sanctions || {};
    } catch (error) {
        console.error(`Error updating schoolo remarks for student ${studentId}:`, error);
        throw error;
    }
};

// Добавяне на активна санкция
export const addActiveSanction = async (studentId, sanctionData) => {
    try {
        const user = await request.get(`${endpoints.users}/${studentId}`);
        const currentSanctions = user.user?.student?.sanctions?.activeSanctions || [];

        const newSanction = {
            _id: Date.now().toString(), // временно ID
            ...sanctionData,
            dateAdded: new Date().toISOString()
        };

        const result = await request.patch(`${endpoints.users}/${studentId}/student`, {
            'sanctions.activeSanctions': [...currentSanctions, newSanction]
        });

        return result.user?.student?.sanctions || {};
    } catch (error) {
        console.error(`Error adding sanction for student ${studentId}:`, error);
        throw error;
    }
};

// Премахване на активна санкция
export const removeActiveSanction = async (studentId, sanctionId) => {
    try {
        const user = await request.get(`${endpoints.users}/${studentId}`);
        const currentSanctions = user.user?.student?.sanctions?.activeSanctions || [];
        const filteredSanctions = currentSanctions.filter(s => s._id !== sanctionId);

        const result = await request.patch(`${endpoints.users}/${studentId}/student`, {
            'sanctions.activeSanctions': filteredSanctions
        });

        return result.user?.student?.sanctions || {};
    } catch (error) {
        console.error(`Error removing sanction for student ${studentId}:`, error);
        throw error;
    }
};

// Добавяне на препоръка към ученическо портфолио
export const addRecommendation = async (studentId, recommendationData) => {
    try {
        const result = await request.post(`${endpoints.users}/${studentId}/student/recommendations`, recommendationData);
        return result.user?.student?.portfolio || {};
    } catch (error) {
        console.error(`Error adding recommendation to student ${studentId}:`, error);
        throw error;
    }
};

// Обновяване на статус на ученическо постижение
export const updateAchievementStatus = async (achievementId, statusData) => {
    try {
        const result = await request.patch(`${endpoints.achievements}/${achievementId}`, statusData);
        return result.achievement || result;
    } catch (error) {
        console.error(`Error updating achievement status ${achievementId}:`, error);
        throw error;
    }
};

// Извличане на всички неприключени кредитни заявки
export const getPendingCredits = async () => {
    try {
        const result = await request.get(`${endpoints.credits}?status=pending`);
        return result.credits || [];
    } catch (error) {
        console.error('Error fetching pending credits:', error);
        throw error;
    }
};

// Извличане на обобщена статистика за учениците
export const getStudentsStatistics = async () => {
    try {
        const result = await request.get(`${endpoints.reports}/students/statistics`);
        return result.statistics || {};
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

        const result = await request.get(`${endpoints.reports}/credits?${queryParams.toString()}`);
        return result.report || {};
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

        const result = await request.get(`${endpoints.reports}/students?${queryParams.toString()}`);
        return result.report || {};
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

        const result = await request.get(`${endpoints.reports}/events?${queryParams.toString()}`);
        return result.report || {};
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

        const result = await request.get(`${endpoints.reports}/achievements?${queryParams.toString()}`);
        return result.report || {};
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

        const result = await request.get(`${endpoints.reports}/sanctions?${queryParams.toString()}`);
        return result.report || {};
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

        const endpoint = `${endpoints.reports}/${reportType}/export?${queryParams.toString()}`;
        const response = await fetch(`http://localhost:3030${endpoint}`, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
            },
            credentials: 'include'
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

// Helper функция за auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default {
    getAllStudents,
    getStudentById,
    getStudentCredits,
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
    exportReport
};