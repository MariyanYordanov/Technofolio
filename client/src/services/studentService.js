// client/src/services/studentService.js
import * as request from '../utils/requestUtils.js';

const endpoints = {
    users: '/api/users',
    credits: '/api/credits',
    events: '/api/events',
    achievements: '/api/achievements',
    reports: '/api/reports'
};

// Извличане на текущия профил на ученика
export const getCurrentStudentProfile = async () => {
    try {
        const result = await request.get(`${endpoints.users}/me`);
        return result.user || result;
    } catch (error) {
        console.error('Error fetching current student profile:', error);
        throw error;
    }
};

// Извличане на профил на ученик по userId
export const getStudentProfile = async (userId) => {
    try {
        const result = await request.get(`${endpoints.users}/${userId}`);

        // Сървърът връща { success: true, user: {...} }
        if (result && result.user) {
            return result.user;
        }

        // Или директно user обекта
        if (result && result.id) {
            return result;
        }

        throw new Error('Невалиден формат на отговора');
    } catch (error) {
        console.error('Error fetching student profile:', error);
        throw error;
    }
};

// Обновяване на профил на ученик - използваме специалния endpoint
export const updateStudentProfile = async (userId, profileData) => {
    try {
        const result = await request.patch(`${endpoints.users}/${userId}/student-info`, profileData);
        return result.user || result;
    } catch (error) {
        console.error('Error updating student profile:', error);
        throw error;
    }
};

// Извличане на портфолио на ученик
export const getStudentPortfolio = async (userId) => {
    try {
        const result = await request.get(`${endpoints.users}/${userId}/portfolio`);
        return result.portfolio || null;
    } catch (error) {
        console.error('Error fetching student portfolio:', error);
        throw error;
    }
};

// Обновяване/Създаване на портфолио
export const updatePortfolio = async (userId, portfolioData) => {
    try {
        const result = await request.put(`${endpoints.users}/${userId}/portfolio`, portfolioData);
        return result.portfolio || null;
    } catch (error) {
        console.error('Error updating portfolio:', error);
        throw error;
    }
};

// Добавяне на препоръка към портфолио
export const addRecommendation = async (userId, recommendationData) => {
    try {
        const result = await request.post(`${endpoints.users}/${userId}/portfolio/recommendations`, recommendationData);
        return result.recommendation || null;
    } catch (error) {
        console.error('Error adding recommendation:', error);
        throw error;
    }
};

// Премахване на препоръка от портфолио
export const removeRecommendation = async (userId, recommendationId) => {
    try {
        const result = await request.del(`${endpoints.users}/${userId}/portfolio/recommendations/${recommendationId}`);
        return result;
    } catch (error) {
        console.error('Error removing recommendation:', error);
        throw error;
    }
};

// Извличане на цели на ученик
export const getStudentGoals = async (userId) => {
    try {
        const result = await request.get(`${endpoints.users}/${userId}/goals`);
        return result.goals || [];
    } catch (error) {
        console.error('Error fetching student goals:', error);
        throw error;
    }
};

// Обновяване/Създаване на цел за определена категория
export const updateGoal = async (userId, category, goalData) => {
    try {
        const result = await request.put(`${endpoints.users}/${userId}/goals/${category}`, goalData);
        return result.goal || {};
    } catch (error) {
        console.error('Error updating goal:', error);
        throw error;
    }
};

// Изтриване на цел за определена категория
export const deleteGoal = async (userId, category) => {
    try {
        const result = await request.del(`${endpoints.users}/${userId}/goals/${category}`);
        return result;
    } catch (error) {
        console.error('Error deleting goal:', error);
        throw error;
    }
};

// Извличане на интереси на ученик
export const getStudentInterests = async (userId) => {
    try {
        const result = await request.get(`${endpoints.users}/${userId}/interests`);
        return result || { interests: [], hobbies: [] };
    } catch (error) {
        console.error('Error fetching student interests:', error);
        throw error;
    }
};

// Обновяване/Създаване на интереси
export const updateInterests = async (userId, interestsData) => {
    try {
        const result = await request.put(`${endpoints.users}/${userId}/interests`, interestsData);
        return result || { interests: [], hobbies: [] };
    } catch (error) {
        console.error('Error updating interests:', error);
        throw error;
    }
};

// Извличане на постижения на ученик
export const getStudentAchievements = async (userId) => {
    try {
        const result = await request.get(`${endpoints.achievements}/user/${userId}`);
        return result.achievements || [];
    } catch (error) {
        console.error('Error fetching student achievements:', error);
        throw error;
    }
};

// Добавяне на постижение
export const addAchievement = async (userId, achievementData) => {
    try {
        const result = await request.post(endpoints.achievements, {
            ...achievementData,
            userId // Променено от studentId на userId
        });
        return result.achievement || result;
    } catch (error) {
        console.error('Error adding achievement:', error);
        throw error;
    }
};

// Премахване на постижение
export const removeAchievement = async (userId, achievementId) => {
    try {
        const result = await request.del(`${endpoints.achievements}/${achievementId}`);
        return result;
    } catch (error) {
        console.error('Error removing achievement:', error);
        throw error;
    }
};

// Извличане на санкции и забележки на ученик
export const getStudentSanctions = async (userId) => {
    try {
        const result = await request.get(`${endpoints.users}/${userId}/sanctions`);
        return result.sanctions || {
            absences: {
                excused: 0,
                unexcused: 0,
                maxAllowed: 150
            },
            schooloRemarks: 0,
            activeSanctions: []
        };
    } catch (error) {
        console.error('Error fetching student sanctions:', error);
        throw error;
    }
};

// Получаване на всички студенти (за учители)
export const getAllStudents = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);
        if (filters.grade) queryParams.append('grade', filters.grade);
        if (filters.specialization) queryParams.append('specialization', filters.specialization);
        if (filters.search) queryParams.append('search', filters.search);

        const url = queryParams.toString() ?
            `${endpoints.users}/students?${queryParams.toString()}` :
            `${endpoints.users}/students`;

        const result = await request.get(url);
        return result.students || [];
    } catch (error) {
        console.error('Error fetching all students:', error);
        throw error;
    }
};

// Получаване на статистики за студенти
export const getStudentsStatistics = async () => {
    try {
        const result = await request.get(`${endpoints.users}/students/stats`);
        return result.stats || {};
    } catch (error) {
        console.error('Error fetching students statistics:', error);
        throw error;
    }
};

// Търсене на студенти
export const searchStudents = async (searchCriteria) => {
    try {
        const queryParams = new URLSearchParams();

        if (searchCriteria.q) queryParams.append('q', searchCriteria.q);
        if (searchCriteria.grade) queryParams.append('grade', searchCriteria.grade);
        if (searchCriteria.minGrade) queryParams.append('minGrade', searchCriteria.minGrade);
        if (searchCriteria.maxGrade) queryParams.append('maxGrade', searchCriteria.maxGrade);

        const result = await request.get(`${endpoints.users}/search?${queryParams.toString()}`);
        return result.users || [];
    } catch (error) {
        console.error('Error searching students:', error);
        throw error;
    }
};

// Извличане на всички ментори (учители)
export const getAllMentors = async () => {
    try {
        const result = await request.get(`${endpoints.users}/role/teacher`);
        return result.users || [];
    } catch (error) {
        console.error('Error fetching mentors:', error);
        throw error;
    }
};

// Извличане на ментор по id
export const getMentorById = async (mentorId) => {
    try {
        const result = await request.get(`${endpoints.users}/${mentorId}`);
        return result.user || result;
    } catch (error) {
        console.error('Error fetching mentor:', error);
        throw error;
    }
};