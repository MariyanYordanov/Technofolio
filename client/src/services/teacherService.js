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
        const result = await request.get(`${endpoints.users}/students`);
        return result.students || [];
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
export const getStudentCredits = async (userId) => {
    try {
        const result = await request.get(`${endpoints.credits}?userId=${userId}`);
        return result.credits || [];
    } catch (error) {
        console.error(`Error fetching credits for student ${userId}:`, error);
        throw error;
    }
};

// Получаване на всички кредити
export const getAllCredits = async () => {
    try {
        const result = await request.get(`${endpoints.credits}/all`);
        return result.credits || [];
    } catch (error) {
        console.error('Error fetching all credits:', error);
        throw error;
    }
};

// Получаване на портфолиото на ученик
export const getStudentPortfolio = async (userId) => {
    try {
        const result = await request.get(`${endpoints.users}/${userId}/portfolio`);
        return result.portfolio || null;
    } catch (error) {
        console.error(`Error fetching portfolio for student ${userId}:`, error);
        throw error;
    }
};

// Получаване на постиженията на ученик
export const getStudentAchievements = async (userId) => {
    try {
        const result = await request.get(`${endpoints.achievements}/user/${userId}`);
        return result.achievements || [];
    } catch (error) {
        console.error(`Error fetching achievements for student ${userId}:`, error);
        throw error;
    }
};

// Получаване на целите на ученик
export const getStudentGoals = async (userId) => {
    try {
        const result = await request.get(`${endpoints.users}/${userId}/goals`);
        return result.goals || [];
    } catch (error) {
        console.error(`Error fetching goals for student ${userId}:`, error);
        throw error;
    }
};

// Получаване на санкциите на ученик
export const getStudentSanctions = async (userId) => {
    try {
        const result = await request.get(`${endpoints.users}/${userId}/sanctions`);
        return result.sanctions || {
            absences: { excused: 0, unexcused: 0, maxAllowed: 150 },
            schooloRemarks: 0,
            activeSanctions: []
        };
    } catch (error) {
        console.error(`Error fetching sanctions for student ${userId}:`, error);
        throw error;
    }
};

// Валидиране на кредит
export const validateCredit = async (creditId, validationData) => {
    try {
        const result = await request.patch(`${endpoints.credits}/${creditId}/validate`, {
            status: validationData.status,
            validationNote: validationData.notes
        });
        return result.credit || result;
    } catch (error) {
        console.error(`Error validating credit ${creditId}:`, error);
        throw error;
    }
};

// Обновяване на отсъствия на ученик
export const updateStudentAbsences = async (userId, absencesData) => {
    try {
        const result = await request.put(`${endpoints.users}/${userId}/sanctions/absences`, absencesData);
        return result.sanctions || {};
    } catch (error) {
        console.error(`Error updating absences for student ${userId}:`, error);
        throw error;
    }
};

// Обновяване на забележки в Школо
export const updateSchooloRemarks = async (userId, remarksData) => {
    try {
        const result = await request.put(`${endpoints.users}/${userId}/sanctions/absences`, {
            schooloRemarks: remarksData.remarks
        });
        return result.sanctions || {};
    } catch (error) {
        console.error(`Error updating schoolo remarks for student ${userId}:`, error);
        throw error;
    }
};

// Добавяне на активна санкция
export const addActiveSanction = async (userId, sanctionData) => {
    try {
        const result = await request.post(`${endpoints.users}/${userId}/sanctions/active`, sanctionData);
        return result.sanctions || {};
    } catch (error) {
        console.error(`Error adding sanction for student ${userId}:`, error);
        throw error;
    }
};

// Премахване на активна санкция
export const removeActiveSanction = async (userId, sanctionId) => {
    try {
        const result = await request.del(`${endpoints.users}/${userId}/sanctions/active/${sanctionId}`);
        return result.sanctions || {};
    } catch (error) {
        console.error(`Error removing sanction for student ${userId}:`, error);
        throw error;
    }
};

// Добавяне на препоръка към ученическо портфолио
export const addRecommendation = async (userId, recommendationData) => {
    try {
        const result = await request.post(`${endpoints.users}/${userId}/portfolio/recommendations`, recommendationData);
        return result.recommendation || {};
    } catch (error) {
        console.error(`Error adding recommendation to student ${userId}:`, error);
        throw error;
    }
};

// Извличане на всички неприключени кредитни заявки
export const getPendingCredits = async () => {
    try {
        const result = await request.get(`${endpoints.credits}?status=pending`);

        // Обогатяваме данните с информация за студентите
        const creditsWithStudents = await Promise.all(
            (result.credits || []).map(async (credit) => {
                try {
                    const userResult = await request.get(`${endpoints.users}/${credit.user}`);
                    const user = userResult.user || userResult;
                    return {
                        ...credit,
                        student: user,
                        studentName: `${user.firstName} ${user.lastName}`,
                        studentId: user._id
                    };
                } catch (err) {
                    console.error(`Error fetching user for credit ${credit._id}:`, err);
                    return credit;
                }
            })
        );

        return creditsWithStudents;
    } catch (error) {
        console.error('Error fetching pending credits:', error);
        throw error;
    }
};

// Извличане на обобщена статистика за учениците
export const getStudentsStatistics = async () => {
    try {
        const result = await request.get(`${endpoints.users}/students/stats`);
        const stats = result.stats || {};

        // Изчисляваме допълнителни статистики
        const pendingCreditsResult = await request.get(`${endpoints.credits}?status=pending`);
        const pendingCreditsCount = pendingCreditsResult.credits?.length || 0;

        return {
            totalStudents: stats.total || 0,
            studentsPerGrade: stats.byGrade || {},
            studentsPerSpecialization: stats.bySpecialization || {},
            avgCredits: stats.avgCreditsPerStudent || 0,
            pendingCreditsCount
        };
    } catch (error) {
        console.error('Error fetching students statistics:', error);
        throw error;
    }
};

// Генериране на отчети
export const generateCreditsReport = async (params) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.grade) queryParams.append('grade', params.grade);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const result = await request.get(`${endpoints.reports}/absences?${queryParams.toString()}`);
        return result;
    } catch (error) {
        console.error('Error generating credits report:', error);
        throw error;
    }
};

export const generateStudentsReport = async (params) => {
    try {
        const result = await request.get(`${endpoints.reports}/user/${params.studentId || 'all'}/pdf`);
        return result;
    } catch (error) {
        console.error('Error generating students report:', error);
        throw error;
    }
};

export const generateEventsReport = async (params) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.eventId) queryParams.append('eventId', params.eventId);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        const result = await request.get(`${endpoints.reports}/events?${queryParams.toString()}`);
        return result;
    } catch (error) {
        console.error('Error generating events report:', error);
        throw error;
    }
};

// Експортиране на отчет
export const exportReport = async (reportType, params, format) => {
    try {
        let endpoint;
        const queryParams = new URLSearchParams();

        switch (reportType) {
            case 'credits':
            case 'students':
                endpoint = `${endpoints.reports}/absences`;
                break;
            case 'events':
                endpoint = `${endpoints.reports}/events`;
                break;
            default:
                endpoint = `${endpoints.reports}/absences`;
        }

        if (params.grade) queryParams.append('grade', params.grade);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        queryParams.append('format', format);

        const response = await fetch(`http://localhost:3030${endpoint}?${queryParams.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
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