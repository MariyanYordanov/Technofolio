// client/src/services/authService.js
import * as request from '../utils/requestUtils.js';


const endpoints = {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    requestLoginLink: '/api/auth/request-login-link',
    verifyEmailLogin: '/api/auth/verify-email-login',
    confirmRegistration: '/api/auth/confirm-registration',
    profile: '/api/students'
};

export const getMe = async () => {
    try {
        const result = await request.get(endpoints.me);
        return result;
    } catch (error) {
        console.log('Error getting current user:', error);
        throw error;
    }
};

export const confirmRegistration = async (token) => {
    return await request.post(endpoints.confirmRegistration, { token });
};

export const requestLoginLink = async (email) => {
    return await request.post(endpoints.requestLoginLink, { email });
  };
  
  export const verifyEmailLogin = async (token) => {
    return await request.post(endpoints.verifyEmailLogin, { token });
  };

export const login = async (email, password) => {
    const result = await request.post(endpoints.login, {
        email,
        password,
    });

    return result;
};

export const register = async (email, password, additionalData) => {
    const result = await request.post(endpoints.register, {
        email,
        password,
        ...additionalData
    });

    return result;
};

export const logout = async () => {
    try {
        await request.get(endpoints.logout);
    } catch (error) {
        console.log('Logout error:', error);
        // Дори и да има грешка при logout на сървъра, изчистваме локалния токен
    }
};

export const getProfile = async (userId) => {
    const result = await request.get(`${endpoints.profile}/${userId}`);
    return result;
};

export const updateProfile = async (userId, userData) => {
    const result = await request.put(`${endpoints.profile}/${userId}`, userData);
    return result;
};

export const validateToken = async () => {
    try {
        const result = await request.get('/users/validate');
        return { isValid: true, userData: result };
    } catch (error) {
        return { isValid: false, error };
    }
};