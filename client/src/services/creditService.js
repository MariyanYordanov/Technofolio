import * as request from '../lib/request';

const baseUrl = 'http://localhost:3030/data/credits';
const categoriesUrl = 'http://localhost:3030/data/creditCategories';

export const getStudentCredits = async (studentId) => {
    const query = new URLSearchParams({
        where: `studentId="${studentId}"`,
    });

    const result = await request.get(`${baseUrl}?${query}`);

    return result;
};

export const getCreditCategories = async () => {
    const result = await request.get(categoriesUrl);

    return result;
};

export const addCredit = async (studentId, creditData) => {
    const result = await request.post(baseUrl, {
        ...creditData,
        studentId,
    });

    return result;
};

export const updateCredit = async (creditId, creditData) => {
    const result = await request.put(`${baseUrl}/${creditId}`, creditData);

    return result;
};

export const deleteCredit = async (creditId) => {
    const result = await request.remove(`${baseUrl}/${creditId}`);

    return result;
};

export const validateCredit = async (creditId, validation) => {
    const result = await request.patch(`${baseUrl}/${creditId}/validate`, validation);

    return result;
};
