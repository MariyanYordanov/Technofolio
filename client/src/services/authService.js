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

// Получаване на информация за текущия потребител
export const getMe = async () => {
    try {
        const result = await request.get(endpoints.me);
        return result;
    } catch (error) {
        console.log('Error getting current user:', error);
        throw error;
    }
};

// Потвърждаване на регистрация с токен
export const confirmRegistration = async (token) => {
    try {
        return await request.post(endpoints.confirmRegistration, { token });
    } catch (error) {
        console.log('Error confirming registration:', error);
        throw error;
    }
};

// Заявка за линк за вход чрез имейл
export const requestLoginLink = async (email) => {
    try {
        const result = await request.post(endpoints.requestLoginLink, { email });
        // Сървърната част връща 200 дори ако имейлът не съществува от съображения за сигурност
        return result;
    } catch (error) {
        console.log('Error requesting login link:', error);
        throw error;
    }
};

// Проверка на токен от имейл линк за вход
export const verifyEmailLogin = async (token) => {
    try {
        const result = await request.post(endpoints.verifyEmailLogin, { token });

        // Ако имаме токен в отговора, съхраняваме го
        if (result && result.token) {
            localStorage.setItem('accessToken', result.token);
        }

        return result;
    } catch (error) {
        console.log('Error verifying email login:', error);
        throw error;
    }
};

// Вход със стандартен метод
export const login = async (email, password) => {
    try {
        const result = await request.post(endpoints.login, {
            email,
            password,
        });

        // Съхраняване на токена в локалното хранилище
        if (result && result.token) {
            localStorage.setItem('accessToken', result.token);
        }

        return result;
    } catch (error) {
        console.log('Login error:', error);
        throw error;
    }
};

// Регистрация
export const register = async (email, password, additionalData) => {
    try {
        // Създаваме обект с всички данни за регистрация
        const registrationData = {
            email,
            password,
            ...additionalData
        };

        const result = await request.post(endpoints.register, registrationData);

        // Съхраняване на токена в локалното хранилище
        if (result && result.token) {
            localStorage.setItem('accessToken', result.token);
        }

        return result;
    } catch (error) {
        console.log('Registration error:', error);
        throw error;
    }
};

// Изход
export const logout = async () => {
    try {
        await request.get(endpoints.logout);
        // Изчистваме токена независимо от резултата
        localStorage.removeItem('accessToken');
    } catch (error) {
        console.log('Logout error:', error);
        // Дори и да има грешка при logout на сървъра, изчистваме локалния токен
        localStorage.removeItem('accessToken');
        throw error;
    }
};

// Получаване на профил по потребителско ID
export const getProfile = async (userId) => {
    try {
        const result = await request.get(`${endpoints.profile}/${userId}`);
        return result;
    } catch (error) {
        console.log('Error getting profile:', error);
        throw error;
    }
};

// Обновяване на профил
export const updateProfile = async (userId, userData) => {
    try {
        const result = await request.put(`${endpoints.profile}/${userId}`, userData);
        return result;
    } catch (error) {
        console.log('Error updating profile:', error);
        throw error;
    }
};

// Проверка за валидност на токена
export const validateToken = async () => {
    try {
        const result = await request.get('/users/validate');
        return { isValid: true, userData: result };
    } catch (error) {
        return { isValid: false, error };
    }
};