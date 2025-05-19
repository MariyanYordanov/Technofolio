// src/contexts/AuthContext.jsx

import { createContext, useEffect, useCallback, useState, useContext } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import Path from '../paths.js';

// Вградена имплементация на authService
const authService = {
    // Конфигурация на API endpoints
    endpoints: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        logout: '/api/auth/logout',
        getMe: '/api/auth/me',
        emailLogin: '/api/auth/email-login',
        confirmRegistration: '/api/auth/confirm-registration',
        requestLoginLink: '/api/auth/request-login-link',
        verifyEmailLogin: '/api/auth/verify-email',
    },

    // Помощни функции за HTTP заявки
    async request(url, method, data) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        };

        // Добавяне на authorization хедър, ако има токен
        const token = localStorage.getItem('accessToken');
        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        // Добавяне на тяло към заявката, ако има данни
        if (data) {
            options.body = JSON.stringify(data);
        }

        // Изпращане на заявката
        const response = await fetch(url, options);

        // Проверка за грешки
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Възникна грешка при комуникацията със сървъра');
        }

        // Проверка дали има съдържание
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }

        return response.text();
    },

    // Заявки към API
    async getMe() {
        try {
            const result = await this.request(this.endpoints.getMe, 'GET');

            // Ако имаме валиден отговор, връщаме данните за потребителя
            if (result && !result.error) {
                return result;
            }

            // Ако нямаме валиден отговор, хвърляме грешка
            throw new Error('Не е намерен активен потребител');
        } catch (error) {
            console.error('Error fetching current user:', error);
            throw error;
        }
    },

    async login(email, password) {
        try {
            const result = await this.request(this.endpoints.login, 'POST', { email, password });

            if (result && result.accessToken) {
                // Запазваме accessToken в localStorage за последващи заявки
                localStorage.setItem('accessToken', result.accessToken);
                return result;
            }

            throw new Error(result.message || 'Неуспешен вход');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async register(email, password, userData) {
        try {
            const result = await this.request(this.endpoints.register, 'POST', {
                email,
                password,
                ...userData
            });

            return result;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    async confirmRegistration(token) {
        try {
            const result = await this.request(`${this.endpoints.confirmRegistration}?token=${token}`, 'GET');

            if (result && result.accessToken) {
                localStorage.setItem('accessToken', result.accessToken);
            }

            return result;
        } catch (error) {
            console.error('Confirmation error:', error);
            throw error;
        }
    },

    async requestLoginLink(email) {
        try {
            const result = await this.request(this.endpoints.requestLoginLink, 'POST', { email });
            return result;
        } catch (error) {
            console.error('Error requesting login link:', error);
            throw error;
        }
    },

    async verifyEmailLogin(token) {
        try {
            const result = await this.request(`${this.endpoints.verifyEmailLogin}?token=${token}`, 'GET');

            if (result && result.accessToken) {
                localStorage.setItem('accessToken', result.accessToken);
            }

            return result;
        } catch (error) {
            console.error('Email verification error:', error);
            throw error;
        }
    },

    async logout() {
        try {
            const result = await this.request(this.endpoints.logout, 'POST');

            // Винаги изчистваме токена от localStorage, независимо от резултата
            localStorage.removeItem('accessToken');

            return result;
        } catch (error) {
            console.error('Logout error:', error);
            // Изчистваме токена дори при грешка
            localStorage.removeItem('accessToken');
            throw error;
        }
    }
};

// Създаване на контекста
const AuthContext = createContext();

// Hook за лесно използване на контекста
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth трябва да се използва в AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children, notificationService = {} }) => {
    const navigate = useNavigate();
    const location = useLocation(); // Добавяме location hook за достъп до текущия път
    const [auth, setAuth] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authInitialized, setAuthInitialized] = useState(false);

    // Деструктуриране на notificationService с fallback функции
    const { success = () => { }, error: showError = () => { } } = notificationService;

    // Проверка дали текущия път е за автентикация (вход, регистрация и т.н.)
    const isAuthPath = () => {
        const pathname = location.pathname;
        return pathname === Path.Login ||
            pathname === Path.Register ||
            pathname.startsWith(Path.EmailLogin) ||
            pathname.startsWith(Path.ConfirmRegistration) ||
            pathname === '/'; // Добавяме началната страница също
    };

    // Проверка дали потребителят е автентикиран при първоначално зареждане
    useEffect(() => {
        // Предотвратяваме многократно изпълнение
        if (authInitialized) return;

        const verifyAuth = async () => {
            // Ако сме на страница за автентикация или начална страница, не правим проверка за автентикация
            if (isAuthPath()) {
                console.log('Skipping auth check for auth path:', location.pathname);
                setIsLoading(false);
                setAuthInitialized(true);
                return;
            }

            try {
                setIsLoading(true);
                const userData = await authService.getMe();
                setAuth(userData.user || userData); // Поддръжка за различни формати
            } catch (err) {
                // Само логваме грешката, без да показваме нищо на потребителя
                console.log('User not authenticated:', err);
                localStorage.removeItem('accessToken');
                setAuth(null);
            } finally {
                setIsLoading(false);
                setAuthInitialized(true);
            }
        };

        verifyAuth();
    }, [authInitialized, location.pathname]);

    // Функция за изпращане на имейл за вход
    const loginSubmitHandler = async (values) => {
        try {
            setIsLoading(true);
            // При вход с имейл и парола
            if (values.password) {
                const result = await authService.login(values.email, values.password);
                setAuth(result.user || result);
                success('Успешен вход в системата!');
                navigate(Path.Home);
                return;
            }

            // При заявка за имейл линк
            await authService.requestLoginLink(values.email);
            success('Линк за вход е изпратен на вашия имейл!');
        } catch (err) {
            console.log(err);
            showError(err.message || 'Неуспешен опит за вход. Моля, опитайте отново.');
        } finally {
            setIsLoading(false);
        }
    };

    // Функция за обработка на връщането от имейл линка
    const handleEmailLogin = useCallback(async (token) => {
        try {
            setIsLoading(true);
            const result = await authService.verifyEmailLogin(token);
            setAuth(result.user || result);
            success('Успешен вход в системата!');
            navigate(Path.Home);
        } catch (err) {
            console.log(err);
            showError(err.message || 'Невалиден или изтекъл линк за вход.');
            navigate(Path.Login);
        } finally {
            setIsLoading(false);
        }
    }, [navigate, success, showError]);

    // Функция за регистрация
    const registerSubmitHandler = async (values) => {
        try {
            setIsLoading(true);
            const { email, password, firstName, lastName, grade, specialization, role } = values;

            const registrationData = {
                email,
                password,
                firstName,
                lastName,
                role: role || 'student',
            };

            // Добавяме grade и specialization само ако ролята е ученик
            if (role === 'student' || !role) {
                registrationData.grade = grade;
                registrationData.specialization = specialization;
            }

            // Правим заявка за регистрация
            await authService.register(email, password, registrationData);
            // При успех показваме съобщение за изпратен имейл за потвърждение
            success('Регистрацията е успешна! Моля, проверете имейла си за потвърждение.');
            navigate(Path.Login);
        } catch (err) {
            console.log(err);
            showError(err.message || 'Неуспешен опит за регистрация. Опитайте отново по-късно.');
        } finally {
            setIsLoading(false);
        }
    };

    // Функция за потвърждаване на регистрация чрез имейл
    const confirmRegistration = useCallback(async (token) => {
        try {
            setIsLoading(true);
            const result = await authService.confirmRegistration(token);
            setAuth(result.user || result);
            success('Регистрацията е потвърдена успешно!');
            navigate(Path.Home);
        } catch (err) {
            console.log(err);
            showError(err.message || 'Невалиден или изтекъл линк за потвърждение.');
            navigate(Path.Register);
        } finally {
            setIsLoading(false);
        }
    }, [navigate, success, showError]);

    // Функция за изход
    const logoutHandler = useCallback(async () => {
        try {
            setIsLoading(true);
            await authService.logout();

            // Изрично изчистваме токена от локалното хранилище
            localStorage.removeItem('accessToken');

            setAuth(null);
            success('Успешно излизане от системата!');
            navigate(Path.Login);
        } catch (err) {
            console.log(err);
            // Дори при грешка, изчистваме локалното състояние
            localStorage.removeItem('accessToken');
            setAuth(null);
            showError('Възникна проблем при излизане от системата.');
            navigate(Path.Login);
        } finally {
            setIsLoading(false);
        }
    }, [navigate, success, showError]);


    // Изчислени свойства, базирани на auth
    const isAuthenticated = !!auth;
    const isStudent = auth?.role === 'student';
    const isTeacher = auth?.role === 'teacher';
    const isAdmin = auth?.role === 'admin';

    // Редирект към съответното табло след логин, базирано на ролята
    const redirectAfterLogin = useCallback(() => {
        if (isTeacher || isAdmin) {
            navigate(Path.TeacherDashboard);
        } else {
            navigate(Path.StudentProfile);
        }
    }, [isTeacher, isAdmin, navigate]);

    const contextValue = {
        loginSubmitHandler,
        registerSubmitHandler,
        handleEmailLogin,
        confirmRegistration,
        logoutHandler,
        redirectAfterLogin,
        username: auth?.username || auth?.email,
        email: auth?.email,
        userId: auth?._id,
        firstName: auth?.firstName,
        lastName: auth?.lastName,
        studentInfo: auth?.studentInfo,
        role: auth?.role,
        isAuthenticated,
        isStudent,
        isTeacher,
        isAdmin,
        isLoading
    };
    
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

AuthContext.displayName = 'AuthContext';

export default AuthContext;