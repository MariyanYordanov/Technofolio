// client/src/services/studentService.js
import * as request from '../utils/requestUtils.js';

const endpoints = {
    users: '/api/users',
    student: '/api/users',
    credits: '/api/credits',
    events: '/api/events',
    achievements: '/api/achievements',
    reports: '/api/reports'
};

// Извличане на текущия профил на ученика
export const getCurrentStudentProfile = async () => {
    try {
        const result = await request.get(`${endpoints.users}/me`);
        return result.student || result;
    } catch (error) {
        console.error('Error fetching current student profile:', error);
        throw error;
    }
};

// Извличане на профил на ученик по userId
export const getStudentProfile = async (userId) => {
    try {
        const result = await request.get(`${endpoints.users}/${userId}`);

        // Ако резултатът е директно user обекта с вградени student данни
        if (result && result._id) {
            // Връщаме целия user обект, който включва student информацията
            return result;
        }

        // Ако резултатът е обвит в { user: {...} }
        if (result && result.user) {
            return result.user;
        }

        // Ако резултатът има student поле
        if (result && result.student) {
            return result.student;
        }

        throw new Error('Невалиден формат на отговора');
    } catch (error) {
        console.error('Error fetching student profile:', error);
        throw error;
    }
};

// Създаване на профил на ученик (вече е вграден в User модела)
export const createStudentProfile = async () => {
    try {
        // Студентския профил се създава автоматично при регистрация
        throw new Error('Student profile is created automatically during registration');
    } catch (error) {
        console.error('Error creating student profile:', error);
        throw error;
    }
};

// Обновяване на профил на ученик
export const updateStudentProfile = async (userId, profileData) => {
    try {
        const result = await request.patch(`${endpoints.users}/${userId}/student`, profileData);
        return result.student || result;
    } catch (error) {
        console.error('Error updating student profile:', error);
        throw error;
    }
};

// Изтриване на профил на ученик - не се поддържа
export const deleteStudentProfile = async () => {
    throw new Error('Deleting student profiles is not supported');
};

// Извличане на портфолио на ученик
export const getStudentPortfolio = async (userId) => {
    try {
        const result = await request.get(`${endpoints.users}/${userId}/student`);
        return result.student?.portfolio || null;
    } catch (error) {
        console.error('Error fetching student portfolio:', error);
        throw error;
    }
};

// Обновяване/Създаване на портфолио
export const updatePortfolio = async (userId, portfolioData) => {
    try {
        const result = await request.patch(`${endpoints.users}/${userId}/student`, {
            portfolio: portfolioData
        });
        return result.student?.portfolio || null;
    } catch (error) {
        console.error('Error updating portfolio:', error);
        throw error;
    }
};

// Добавяне на препоръка към портфолио
export const addRecommendation = async (userId, recommendationData) => {
    try {
        const result = await request.post(`${endpoints.users}/${userId}/student/recommendations`, recommendationData);
        return result.student?.portfolio || null;
    } catch (error) {
        console.error('Error adding recommendation:', error);
        throw error;
    }
};

// Премахване на препоръка от портфолио
export const removeRecommendation = async (userId, recommendationId) => {
    try {
        const result = await request.del(`${endpoints.users}/${userId}/student/recommendations/${recommendationId}`);
        return result.student?.portfolio || null;
    } catch (error) {
        console.error('Error removing recommendation:', error);
        throw error;
    }
};

// Извличане на цели на ученик
export const getStudentGoals = async (userId) => {
    try {
        const result = await request.get(`${endpoints.users}/${userId}/student`);
        return result.student?.goals || {};
    } catch (error) {
        console.error('Error fetching student goals:', error);
        throw error;
    }
};

// Обновяване/Създаване на цел за определена категория
export const updateGoal = async (userId, category, goalData) => {
    try {
        const result = await request.patch(`${endpoints.users}/${userId}/student/goals/${category}`, goalData);
        return result.student?.goals || {};
    } catch (error) {
        console.error('Error updating goal:', error);
        throw error;
    }
};

// Изтриване на цел за определена категория
export const deleteGoal = async (userId, category) => {
    try {
        const result = await request.del(`${endpoints.users}/${userId}/student/goals/${category}`);
        return result.student?.goals || {};
    } catch (error) {
        console.error('Error deleting goal:', error);
        throw error;
    }
};

// Извличане на интереси на ученик
export const getStudentInterests = async (userId) => {
    try {
        const result = await request.get(`${endpoints.users}/${userId}/student`);
        return result.student?.interests || { interests: [], hobbies: [] };
    } catch (error) {
        console.error('Error fetching student interests:', error);
        throw error;
    }
};

// Обновяване/Създаване на интереси
export const updateInterests = async (userId, interestsData) => {
    try {
        const result = await request.patch(`${endpoints.users}/${userId}/student`, {
            interests: interestsData
        });
        return result.student?.interests || { interests: [], hobbies: [] };
    } catch (error) {
        console.error('Error updating interests:', error);
        throw error;
    }
};

// Извличане на постижения на ученик
export const getStudentAchievements = async (userId) => {
    try {
        const result = await request.get(`${endpoints.achievements}?studentId=${userId}`);
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
            studentId: userId
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
        const result = await request.get(`${endpoints.users}/${userId}/student`);
        return result.student?.sanctions || {
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
        queryParams.append('role', 'student');

        const url = queryParams.toString() ?
            `${endpoints.users}?${queryParams.toString()}` :
            `${endpoints.users}?role=student`;

        const result = await request.get(url);
        return result.users || [];
    } catch (error) {
        console.error('Error fetching all students:', error);
        throw error;
    }
};

// Получаване на статистики за студенти
export const getStudentsStatistics = async () => {
    try {
        const result = await request.get(`${endpoints.reports}/students/statistics`);
        return result.statistics || {};
    } catch (error) {
        console.error('Error fetching students statistics:', error);
        throw error;
    }
};

// Търсене на студенти
export const searchStudents = async (searchCriteria) => {
    try {
        const queryParams = new URLSearchParams();

        if (searchCriteria.q) queryParams.append('search', searchCriteria.q);
        if (searchCriteria.grade) queryParams.append('grade', searchCriteria.grade);
        if (searchCriteria.minGrade) queryParams.append('minGrade', searchCriteria.minGrade);
        if (searchCriteria.maxGrade) queryParams.append('maxGrade', searchCriteria.maxGrade);
        queryParams.append('role', 'student');

        const result = await request.get(`${endpoints.users}?${queryParams.toString()}`);
        return result.users || [];
    } catch (error) {
        console.error('Error searching students:', error);
        throw error;
    }
};

// Извличане на всички ментори (учители)
export const getAllMentors = async () => {
    try {
        const result = await request.get(`${endpoints.users}?role=teacher`);
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