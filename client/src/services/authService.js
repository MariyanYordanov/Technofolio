import * as request from '../lib/request';

const baseUrl = 'http://localhost:3030/users';

export const login = async (email, password) => {
    const result = await request.post(`${baseUrl}/login`, {
        email,
        password,
    });

    return result;
};

export const register = (email, password, additionalData) => request.post(`${baseUrl}/register`, {
    email,
    password,
    ...additionalData
});

export const logout = () => request.get(`${baseUrl}/logout`);

export const getProfile = (userId) => request.get(`${baseUrl}/${userId}`);

export const updateProfile = (userId, userData) => request.put(`${baseUrl}/${userId}`, userData);