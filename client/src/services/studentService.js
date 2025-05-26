// client/src/services/studentService.js
import * as request from '../utils/requestUtils.js';

const endpoints = {
    students: '/api/students',
    auth: '/api/auth',
    users: '/api/users'
};

// ===== СТУДЕНТСКИ ПРОФИЛ =====

// Извличане на текущия профил на ученика
export const getCurrentStudentProfile = async () => {
    try {
        const result = await request.get(`${endpoints.students}/me`);
        return result.student;
    } catch (error) {
        console.error('Error fetching current student profile:', error);
        throw error;
    }
};

// Извличане на профил на ученик по userId
export const getStudentProfile = async (userId) => {
    try {
        const result = await request.get(`${endpoints.students}/${userId}`);
        return result.student;
    } catch (error) {
        console.error('Error fetching student profile:', error);
        throw error;
    }
};

// Създаване на профил на ученик
export const createStudentProfile = async (profileData) => {
    try {
        const result = await request.post(endpoints.students, profileData);
        return result.student;
    } catch (error) {
        console.error('Error creating student profile:', error);
        throw error;
    }
};

// Обновяване на профил на ученик
export const updateStudentProfile = async (profileId, profileData) => {
    try {
        const result = await request.put(`${endpoints.students}/${profileId}`, profileData);
        return result.student;
    } catch (error) {
        console.error('Error updating student profile:', error);
        throw error;
    }
};

// Изтриване на профил на ученик
export const deleteStudentProfile = async (profileId) => {
    try {
        const result = await request.del(`${endpoints.students}/${profileId}`);
        return result;
    } catch (error) {
        console.error('Error deleting student profile:', error);
        throw error;
    }
};

// ===== ПОРТФОЛИО =====

// Извличане на портфолио на ученик
export const getStudentPortfolio = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.students}/${studentId}/portfolio`);
        return result.portfolio;
    } catch (error) {
        console.error('Error fetching student portfolio:', error);
        throw error;
    }
};

// Обновяване/Създаване на портфолио
export const updatePortfolio = async (studentId, portfolioData) => {
    try {
        const result = await request.put(`${endpoints.students}/${studentId}/portfolio`, portfolioData);
        return result.portfolio;
    } catch (error) {
        console.error('Error updating portfolio:', error);
        throw error;
    }
};

// Добавяне на препоръка към портфолио
export const addRecommendation = async (studentId, recommendationData) => {
    try {
        const result = await request.post(`${endpoints.students}/${studentId}/portfolio/recommendations`, recommendationData);
        return result.portfolio;
    } catch (error) {
        console.error('Error adding recommendation:', error);
        throw error;
    }
};

// Премахване на препоръка от портфолио
export const removeRecommendation = async (studentId, recommendationId) => {
    try {
        const result = await request.del(`${endpoints.students}/${studentId}/portfolio/recommendations/${recommendationId}`);
        return result.portfolio;
    } catch (error) {
        console.error('Error removing recommendation:', error);
        throw error;
    }
};

// ===== ЦЕЛИ =====

// Извличане на цели на ученик
export const getStudentGoals = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.students}/${studentId}/goals`);
        return result.goals;
    } catch (error) {
        console.error('Error fetching student goals:', error);
        throw error;
    }
};

// Обновяване/Създаване на цел за определена категория
export const updateGoal = async (studentId, category, goalData) => {
    try {
        const result = await request.put(`${endpoints.students}/${studentId}/goals/${category}`, goalData);
        return result;
    } catch (error) {
        console.error('Error updating goal:', error);
        throw error;
    }
};

// Изтриване на цел за определена категория
export const deleteGoal = async (studentId, category) => {
    try {
        const result = await request.del(`${endpoints.students}/${studentId}/goals/${category}`);
        return result;
    } catch (error) {
        console.error('Error deleting goal:', error);
        throw error;
    }
};

// ===== ИНТЕРЕСИ И ХОБИТА =====

// Извличане на интереси на ученик
export const getStudentInterests = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.students}/${studentId}/interests`);
        return result.interests;
    } catch (error) {
        console.error('Error fetching student interests:', error);
        throw error;
    }
};

// Обновяване/Създаване на интереси
export const updateInterests = async (studentId, interestsData) => {
    try {
        const result = await request.put(`${endpoints.students}/${studentId}/interests`, interestsData);
        return result.interests;
    } catch (error) {
        console.error('Error updating interests:', error);
        throw error;
    }
};

// ===== ПОСТИЖЕНИЯ =====

// Извличане на постижения на ученик
export const getStudentAchievements = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.students}/${studentId}/achievements`);
        return result.achievements;
    } catch (error) {
        console.error('Error fetching student achievements:', error);
        throw error;
    }
};

// Добавяне на постижение
export const addAchievement = async (studentId, achievementData) => {
    try {
        const result = await request.post(`${endpoints.students}/${studentId}/achievements`, achievementData);
        return result.achievement;
    } catch (error) {
        console.error('Error adding achievement:', error);
        throw error;
    }
};

// Премахване на постижение
export const removeAchievement = async (studentId, achievementId) => {
    try {
        const result = await request.del(`${endpoints.students}/${studentId}/achievements/${achievementId}`);
        return result;
    } catch (error) {
        console.error('Error removing achievement:', error);
        throw error;
    }
};

// ===== САНКЦИИ И ЗАБЕЛЕЖКИ =====

// Извличане на санкции и забележки на ученик
export const getStudentSanctions = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.students}/${studentId}/sanctions`);
        return result.sanctions;
    } catch (error) {
        console.error('Error fetching student sanctions:', error);
        throw error;
    }
};

// ===== АДМИНИСТРАТИВНИ ФУНКЦИИ (за учители и админи) =====

// Получаване на всички студенти
export const getAllStudents = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);
        if (filters.grade) queryParams.append('grade', filters.grade);
        if (filters.specialization) queryParams.append('specialization', filters.specialization);
        if (filters.search) queryParams.append('search', filters.search);

        const url = queryParams.toString() ?
            `${endpoints.students}/all?${queryParams.toString()}` :
            `${endpoints.students}/all`;

        const result = await request.get(url);
        return result;
    } catch (error) {
        console.error('Error fetching all students:', error);
        throw error;
    }
};

// Получаване на статистики за студенти
export const getStudentsStatistics = async () => {
    try {
        const result = await request.get(`${endpoints.students}/stats`);
        return result.stats;
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

        const result = await request.get(`${endpoints.students}/search?${queryParams.toString()}`);
        return result.students;
    } catch (error) {
        console.error('Error searching students:', error);
        throw error;
    }
};

// ===== АДМИНИСТРАТИВНИ ФУНКЦИИ ЗА ПОРТФОЛИЯ =====

// Получаване на всички портфолия
export const getAllPortfolios = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);
        if (filters.grade) queryParams.append('grade', filters.grade);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.hasMentor) queryParams.append('hasMentor', filters.hasMentor);

        const url = queryParams.toString() ?
            `${endpoints.students}/portfolios?${queryParams.toString()}` :
            `${endpoints.students}/portfolios`;

        const result = await request.get(url);
        return result;
    } catch (error) {
        console.error('Error fetching all portfolios:', error);
        throw error;
    }
};

// Получаване на статистики за портфолия
export const getPortfoliosStatistics = async () => {
    try {
        const result = await request.get(`${endpoints.students}/portfolios/stats`);
        return result.stats;
    } catch (error) {
        console.error('Error fetching portfolios statistics:', error);
        throw error;
    }
};

// ===== АДМИНИСТРАТИВНИ ФУНКЦИИ ЗА ЦЕЛИ =====

// Получаване на всички цели
export const getAllGoals = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);
        if (filters.grade) queryParams.append('grade', filters.grade);
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.search) queryParams.append('search', filters.search);

        const url = queryParams.toString() ?
            `${endpoints.students}/goals?${queryParams.toString()}` :
            `${endpoints.students}/goals`;

        const result = await request.get(url);
        return result;
    } catch (error) {
        console.error('Error fetching all goals:', error);
        throw error;
    }
};

// Получаване на статистики за цели
export const getGoalsStatistics = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.grade) queryParams.append('grade', filters.grade);

        const url = queryParams.toString() ?
            `${endpoints.students}/goals/stats?${queryParams.toString()}` :
            `${endpoints.students}/goals/stats`;

        const result = await request.get(url);
        return result.stats;
    } catch (error) {
        console.error('Error fetching goals statistics:', error);
        throw error;
    }
};

// Експортиране на цели
export const exportGoalsData = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.grade) queryParams.append('grade', filters.grade);
        if (filters.category) queryParams.append('category', filters.category);

        const url = queryParams.toString() ?
            `${endpoints.students}/goals/export?${queryParams.toString()}` :
            `${endpoints.students}/goals/export`;

        const result = await request.get(url);
        return result.data;
    } catch (error) {
        console.error('Error exporting goals data:', error);
        throw error;
    }
};

// ===== АДМИНИСТРАТИВНИ ФУНКЦИИ ЗА ИНТЕРЕСИ =====

// Получаване на всички интереси
export const getAllInterests = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);
        if (filters.grade) queryParams.append('grade', filters.grade);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.hasInterests) queryParams.append('hasInterests', filters.hasInterests);
        if (filters.hasHobbies) queryParams.append('hasHobbies', filters.hasHobbies);

        const url = queryParams.toString() ?
            `${endpoints.students}/interests?${queryParams.toString()}` :
            `${endpoints.students}/interests`;

        const result = await request.get(url);
        return result;
    } catch (error) {
        console.error('Error fetching all interests:', error);
        throw error;
    }
};

// Получаване на статистики за интереси
export const getInterestsStatistics = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.grade) queryParams.append('grade', filters.grade);

        const url = queryParams.toString() ?
            `${endpoints.students}/interests/stats?${queryParams.toString()}` :
            `${endpoints.students}/interests/stats`;

        const result = await request.get(url);
        return result.stats;
    } catch (error) {
        console.error('Error fetching interests statistics:', error);
        throw error;
    }
};

// Експортиране на интереси
export const exportInterestsData = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.grade) queryParams.append('grade', filters.grade);

        const url = queryParams.toString() ?
            `${endpoints.students}/interests/export?${queryParams.toString()}` :
            `${endpoints.students}/interests/export`;

        const result = await request.get(url);
        return result.data;
    } catch (error) {
        console.error('Error exporting interests data:', error);
        throw error;
    }
};

// Получаване на популярни интереси и хобита
export const getPopularInterestsAndHobbies = async () => {
    try {
        const result = await request.get(`${endpoints.students}/interests/popular`);
        return result.popular;
    } catch (error) {
        console.error('Error fetching popular interests and hobbies:', error);
        throw error;
    }
};

// ===== АДМИНИСТРАТИВНИ ФУНКЦИИ ЗА ПОСТИЖЕНИЯ =====

// Получаване на всички постижения
export const getAllAchievements = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);
        if (filters.grade) queryParams.append('grade', filters.grade);
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);

        const url = queryParams.toString() ?
            `${endpoints.students}/achievements?${queryParams.toString()}` :
            `${endpoints.students}/achievements`;

        const result = await request.get(url);
        return result;
    } catch (error) {
        console.error('Error fetching all achievements:', error);
        throw error;
    }
};

// Получаване на статистики за постижения
export const getAchievementsStatistics = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.grade) queryParams.append('grade', filters.grade);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);

        const url = queryParams.toString() ?
            `${endpoints.students}/achievements/stats?${queryParams.toString()}` :
            `${endpoints.students}/achievements/stats`;

        const result = await request.get(url);
        return result.stats;
    } catch (error) {
        console.error('Error fetching achievements statistics:', error);
        throw error;
    }
};

// Експортиране на постижения
export const exportAchievementsData = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.grade) queryParams.append('grade', filters.grade);
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);

        const url = queryParams.toString() ?
            `${endpoints.students}/achievements/export?${queryParams.toString()}` :
            `${endpoints.students}/achievements/export`;

        const result = await request.get(url);
        return result.data;
    } catch (error) {
        console.error('Error exporting achievements data:', error);
        throw error;
    }
};

// ===== ДРУГИ ФУНКЦИИ =====

// Извличане на всички ментори (учители)
export const getAllMentors = async () => {
    try {
        const result = await request.get(`${endpoints.users}?role=teacher`);
        return result.users;
    } catch (error) {
        console.error('Error fetching mentors:', error);
        throw error;
    }
};

// Извличане на ментор по id
export const getMentorById = async (mentorId) => {
    try {
        const result = await request.get(`${endpoints.users}/${mentorId}`);
        return result.user;
    } catch (error) {
        console.error('Error fetching mentor:', error);
        throw error;
    }
};