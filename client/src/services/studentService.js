// client/src/services/studentService.js
import * as request from '../utils/requestUtils.js';

const endpoints = {
    students: '/data/students',
    portfolios: '/data/portfolios',
    goals: '/data/goals',
    interests: '/data/interests',
    achievements: '/data/achievements',
    sanctions: '/data/sanctions',
    mentors: '/data/mentors',
};

// Извличане на профил на ученик по userId
export const getStudentProfile = async (userId) => {
    try {
        const result = await request.get(`${endpoints.students}?where=_ownerId="${userId}"`);

        if (result.length > 0) {
            return result[0];
        }

        return null;
    } catch (error) {
        console.error('Error fetching student profile:', error);
        throw error;
    }
};

// Създаване на профил на ученик
export const createStudentProfile = async (profileData) => {
    try {
        const result = await request.post(endpoints.students, profileData);
        return result;
    } catch (error) {
        console.error('Error creating student profile:', error);
        throw error;
    }
};

// Обновяване на профил на ученик
export const updateStudentProfile = async (profileId, profileData) => {
    try {
        const result = await request.put(`${endpoints.students}/${profileId}`, profileData);
        return result;
    } catch (error) {
        console.error('Error updating student profile:', error);
        throw error;
    }
};

// Извличане на портфолио на ученик
export const getStudentPortfolio = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.portfolios}?where=studentId="${studentId}"`);

        if (result.length > 0) {
            return result[0];
        }

        return null;
    } catch (error) {
        console.error('Error fetching student portfolio:', error);
        throw error;
    }
};

// Обновяване/Създаване на портфолио
export const updatePortfolio = async (studentId, portfolioData) => {
    try {
        // Първо проверяваме дали вече има портфолио
        const existingPortfolio = await getStudentPortfolio(studentId);

        if (existingPortfolio) {
            // Обновяваме съществуващото портфолио
            const result = await request.put(`${endpoints.portfolios}/${existingPortfolio._id}`, {
                ...portfolioData,
                studentId
            });
            return result;
        } else {
            // Създаваме ново портфолио
            const result = await request.post(endpoints.portfolios, {
                ...portfolioData,
                studentId
            });
            return result;
        }
    } catch (error) {
        console.error('Error updating portfolio:', error);
        throw error;
    }
};

// Извличане на интереси на ученик
export const getStudentInterests = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.interests}?where=studentId="${studentId}"`);

        if (result.length > 0) {
            return result[0];
        }

        return null;
    } catch (error) {
        console.error('Error fetching student interests:', error);
        throw error;
    }
};

// Обновяване/Създаване на интереси
export const updateInterests = async (studentId, interestsData) => {
    try {
        // Първо проверяваме дали вече има интереси
        const existingInterests = await getStudentInterests(studentId);

        if (existingInterests) {
            // Обновяваме съществуващите интереси
            const result = await request.put(`${endpoints.interests}/${existingInterests._id}`, {
                ...interestsData,
                studentId
            });
            return result;
        } else {
            // Създаваме нови интереси
            const result = await request.post(endpoints.interests, {
                ...interestsData,
                studentId
            });
            return result;
        }
    } catch (error) {
        console.error('Error updating interests:', error);
        throw error;
    }
};

// Извличане на постижения на ученик
export const getStudentAchievements = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.achievements}?where=studentId="${studentId}"`);
        return result;
    } catch (error) {
        console.error('Error fetching student achievements:', error);
        throw error;
    }
};

// Добавяне на постижение
export const addAchievement = async (studentId, achievementData) => {
    try {
        const result = await request.post(endpoints.achievements, {
            ...achievementData,
            studentId
        });
        return result;
    } catch (error) {
        console.error('Error adding achievement:', error);
        throw error;
    }
};

// Премахване на постижение
export const removeAchievement = async (achievementId) => {
    try {
        const result = await request.del(`${endpoints.achievements}/${achievementId}`);
        return result;
    } catch (error) {
        console.error('Error removing achievement:', error);
        throw error;
    }
};

// Извличане на забележки и санкции на ученик
export const getStudentSanctions = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.sanctions}?where=studentId="${studentId}"`);

        if (result.length > 0) {
            return result[0];
        }

        return null;
    } catch (error) {
        console.error('Error fetching student sanctions:', error);
        throw error;
    }
};

// Извличане на цели на ученик
export const getStudentGoals = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.goals}?where=studentId="${studentId}"`);

        if (result.length > 0) {
            return result[0];
        }

        return null;
    } catch (error) {
        console.error('Error fetching student goals:', error);
        throw error;
    }
};

// Обновяване/Създаване на цели
export const updateGoals = async (studentId, goalsData) => {
    try {
        // Първо проверяваме дали вече има цели
        const existingGoals = await getStudentGoals(studentId);

        if (existingGoals) {
            // Обновяваме съществуващите цели
            const result = await request.put(`${endpoints.goals}/${existingGoals._id}`, {
                ...goalsData,
                studentId
            });
            return result;
        } else {
            // Създаваме нови цели
            const result = await request.post(endpoints.goals, {
                ...goalsData,
                studentId
            });
            return result;
        }
    } catch (error) {
        console.error('Error updating goals:', error);
        throw error;
    }
};

// Извличане на ментор по id
export const getMentorById = async (mentorId) => {
    try {
        const result = await request.get(`${endpoints.mentors}/${mentorId}`);
        return result;
    } catch (error) {
        console.error('Error fetching mentor:', error);
        throw error;
    }
};

// Извличане на всички ментори
export const getAllMentors = async () => {
    try {
        const result = await request.get(endpoints.mentors);
        return result;
    } catch (error) {
        console.error('Error fetching mentors:', error);
        throw error;
    }
};