// client/src/services/authService.js
import * as request from '../utils/requestUtils';

const endpoints = {
    login: '/users/login',
    register: '/users/register',
    logout: '/users/logout',
    profile: '/users',
};

// Login функция
export const login = async (email, password) => {
    const result = await request.post(endpoints.login, {
        email,
        password,
    });

    return result;
};

// Register функция
export const register = async (email, password, additionalData) => {
    const result = await request.post(endpoints.register, {
        email,
        password,
        ...additionalData
    });

    return result;
};

// Logout функция
export const logout = async () => {
    try {
        await request.get(endpoints.logout);
    } catch (error) {
        console.log('Logout error:', error);
        // Дори и да има грешка при logout на сървъра, изчистваме локалния токен
    }
};

// Получаване на профил по ID
export const getProfile = async (userId) => {
    const result = await request.get(`${endpoints.profile}/${userId}`);
    return result;
};

// Обновяване на профил
export const updateProfile = async (userId, userData) => {
    const result = await request.put(`${endpoints.profile}/${userId}`, userData);
    return result;
};

// Проверка дали токенът е валиден
export const validateToken = async () => {
    try {
        const result = await request.get('/users/validate');
        return { isValid: true, userData: result };
    } catch (error) {
        return { isValid: false, error };
    }
};