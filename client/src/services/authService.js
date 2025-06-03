// client/src/services/authService.js
import * as request from '../utils/requestUtils';

const endpoints = {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    getMe: '/api/auth/me',
    confirmRegistration: '/api/auth/confirm-registration',
    requestLoginLink: '/api/auth/request-login-link',
    verifyEmailLogin: '/api/auth/verify-email',
};

// Заявка за получаване на информация за текущо логнатия потребител
export const getMe = async () => {
    try {
        const result = await request.get(endpoints.getMe);

        if (result && result.success && result.user) {
            return {
                ...result.user,
                id: result.user.id
            };
        }

        throw new Error('Не е намерен активен потребител');
    } catch (error) {
        console.error('Error fetching current user:', error);
        throw error;
    }
};

// Заявка за вход с имейл и парола
export const login = async (email, password) => {
    try {
        const result = await request.post(endpoints.login, {
            email,
            password
        });

        if (result && result.success && result.accessToken && result.user) {
            return {
                accessToken: result.accessToken,
                ...result.user
            };
        }

        throw new Error(result.message || 'Неуспешен вход');
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// Заявка за регистрация
export const register = async (email, password, userData) => {
    try {
        const result = await request.post(endpoints.register, {
            email,
            password,
            ...userData
        });

        return result;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

// Потвърждаване на регистрация с токен
export const confirmRegistration = async (token) => {
    try {
        const result = await request.get(`${endpoints.confirmRegistration}?token=${token}`);

        if (result && result.success && result.accessToken && result.user) {
            return {
                accessToken: result.accessToken,
                ...result.user
            };
        }

        throw new Error('Невалиден токен за потвърждение');
    } catch (error) {
        console.error('Confirmation error:', error);
        throw error;
    }
};

// Заявка за изпращане на линк за вход
export const requestLoginLink = async (email) => {
    try {
        const result = await request.post(endpoints.requestLoginLink, { email });
        return result;
    } catch (error) {
        console.error('Error requesting login link:', error);
        throw error;
    }
};

// Проверка на токен от имейл вход
export const verifyEmailLogin = async (token) => {
    try {
        const result = await request.get(`${endpoints.verifyEmailLogin}?token=${token}`);

        if (result && result.success && result.accessToken && result.user) {
            return {
                accessToken: result.accessToken,
                ...result.user
            };
        }

        throw new Error('Невалиден токен за вход');
    } catch (error) {
        console.error('Email verification error:', error);
        throw error;
    }
};

// Изход от системата
export const logout = async () => {
    try {
        const result = await request.post(endpoints.logout);
        return result;
    } catch (error) {
        console.error('Logout error:', error);
        // Дори при грешка, изчистваме локалния токен
        throw error;
    }
};