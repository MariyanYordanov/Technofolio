// src/contexts/AuthContext.jsx

import { createContext, useEffect, useCallback, useState, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import Path from '../paths';

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
    const [auth, setAuth] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authInitialized, setAuthInitialized] = useState(false);

    // Деструктуриране на notificationService с fallback функции
    const { success = () => { }, error: showError = () => { } } = notificationService;

    // Проверка дали потребителят е автентикиран при първоначално зареждане
    useEffect(() => {
        // Предотвратяваме многократно изпълнение
        if (authInitialized) return;

        const verifyAuth = async () => {
            try {
                const userData = await authService.getMe();
                setAuth(userData);
            } catch (err) {
                console.log('User not authenticated:', err);
                // Почистваме локалното хранилище, за да сме сигурни, че няма остатъчни токени
                localStorage.removeItem('accessToken');
                setAuth(null);
            } finally {
                setIsLoading(false);
                setAuthInitialized(true);
            }
        };

        verifyAuth();
    }, [authInitialized]);

    // Функция за изпращане на имейл за вход
    const loginSubmitHandler = async (values) => {
        try {
            setIsLoading(true);
            // Изпращаме само имейл за автентикация
            await authService.requestLoginLink(values.email);
            success('Линк за вход е изпратен на вашия имейл!');
            // Показваме съобщение за успешно изпратен имейл
        } catch (err) {
            console.log(err);
            showError(err.message || 'Неуспешен опит за изпращане на линк. Проверете имейла си.');
        } finally {
            setIsLoading(false);
        }
    };

    // Функция за обработка на връщането от имейл линка
    const handleEmailLogin = useCallback(async (token) => {
        try {
            setIsLoading(true);
            const result = await authService.verifyEmailLogin(token);
            setAuth(result.user);
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
            if (role === 'student') {
                registrationData.grade = Number(grade);
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
            setAuth(result.user);
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

    const contextValue = {
        loginSubmitHandler,
        registerSubmitHandler,
        handleEmailLogin,
        confirmRegistration,
        logoutHandler,
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
        isLoading,
        authInitialized
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

AuthContext.displayName = 'AuthContext';

// Добавяме default export, който е критичен за правилната работа на импортите
export default AuthContext;