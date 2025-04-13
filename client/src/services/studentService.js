import * as request from '../utils/requestUtils.js';

const baseUrl = 'http://localhost:3030/data/students';

export const getStudentProfile = async (userId) => {
    const result = await request.get(`${baseUrl}?where=_ownerId="${userId}"`);

    if (result.length > 0) {
        return result[0];
    }

    return null;
};

export const createStudentProfile = async (profileData) => {
    const result = await request.post(baseUrl, profileData);

    return result;
};

export const updateStudentProfile = async (profileId, profileData) => {
    const result = await request.put(`${baseUrl}/${profileId}`, profileData);

    return result;
};

export const getStudentPortfolio = async (studentId) => {
    const result = await request.get(`${baseUrl}/${studentId}/portfolio`);

    return result;
};

export const updatePortfolio = async (studentId, portfolioData) => {
    const result = await request.put(`${baseUrl}/${studentId}/portfolio`, portfolioData);

    return result;
};

export const getStudentInterests = async (studentId) => {
    const result = await request.get(`${baseUrl}/${studentId}/interests`);

    return result;
};

export const updateInterests = async (studentId, interestsData) => {
    const result = await request.put(`${baseUrl}/${studentId}/interests`, interestsData);

    return result;
};

export const getStudentAchievements = async (studentId) => {
    const result = await request.get(`${baseUrl}/${studentId}/achievements`);

    return result;
};

export const addAchievement = async (studentId, achievementData) => {
    const result = await request.post(`${baseUrl}/${studentId}/achievements`, achievementData);

    return result;
};

export const removeAchievement = async (studentId, achievementId) => {
    const result = await request.remove(`${baseUrl}/${studentId}/achievements/${achievementId}`);

    return result;
};

export const getStudentSanctions = async (studentId) => {
    const result = await request.get(`${baseUrl}/${studentId}/sanctions`);

    return result;
};
