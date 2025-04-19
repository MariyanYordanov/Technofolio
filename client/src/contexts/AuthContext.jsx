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

    // Деструктуриране на notificationService с fallback функции
    const { success = () => {}, error: showError = () => {} } = notificationService;

    // Проверка дали потребителят е автентикиран при първоначално зареждане
    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const userData = await authService.getMe();
                setAuth(userData);
            } catch (err) {
                console.log('User not authenticated:', err);
                setAuth(null);
            } finally {
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, []);

    const loginSubmitHandler = async (values) => {
        try {
            setIsLoading(true);
            const result = await authService.login(values.email, values.password);
            setAuth(result.user);
            success('Успешен вход в системата!');
            navigate(Path.Home);
        } catch (err) {
            console.log(err);
            showError(err.message || 'Неуспешен опит за вход. Проверете имейла и паролата си.');
        } finally {
            setIsLoading(false);
        }
    };

    const registerSubmitHandler = async (values) => {
        try {
            setIsLoading(true);
            const { email, password, firstName, lastName, grade, specialization } = values;

            const registrationData = {
                email,
                password,
                firstName,
                lastName,
                grade: Number(grade),
                specialization,
                role: 'student',
            };

            const result = await authService.register(email, password, registrationData);
            setAuth(result.user);
            success('Успешна регистрация!');
            navigate(Path.Home);
        } catch (err) {
            console.log(err);
            showError(err.message || 'Неуспешен опит за регистрация. Опитайте отново по-късно.');
        } finally {
            setIsLoading(false);
        }
    };

    const logoutHandler = useCallback(async () => {
        try {
            setIsLoading(true);
            await authService.logout();
            setAuth(null);
            success('Успешно излизане от системата!');
            navigate(Path.Login);
        } catch (err) {
            console.log(err);
            showError('Възникна проблем при излизане от системата.');
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
        isLoading
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