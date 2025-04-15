// client/src/contexts/AuthContext.jsx
import { createContext, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import usePersistedState from "../hooks/usePersistedState";
import { useNotifications } from './NotificationContext';
import Path from '../paths';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [auth, setAuth] = usePersistedState('auth', {});
    const { success, error } = useNotifications();

    useEffect(() => {
        const validateToken = async () => {
            try {
                if (auth.accessToken) {
                    await authService.getProfile(auth._id);
                }
            } catch (err) {
                console.log('Invalid token, logging out:', err);
                logoutHandler();
            }
        };

        validateToken();
    }, [auth._id, auth.accessToken, logoutHandler]);

    const loginSubmitHandler = async (values) => {
        try {
            const result = await authService.login(values.email, values.password);
            setAuth(result);
            localStorage.setItem('accessToken', result.accessToken);
            success('Успешен вход в системата!');
            navigate(Path.Home);
        } catch (err) {
            console.log(err);
            error(err.message || 'Неуспешен опит за вход. Проверете имейла и паролата си.');
        }
    };

    const registerSubmitHandler = async (values) => {
        try {
            // Извличаме нужната информация за регистрация
            const { email, password, firstName, lastName, grade, specialization } = values;

            const registrationData = {
                email,
                password,
                firstName,
                lastName,
                grade: Number(grade),
                specialization,
                role: 'student', // По подразбиране регистрираме ученик
            };

            const result = await authService.register(email, password, registrationData);
            setAuth(result);
            localStorage.setItem('accessToken', result.accessToken);
            success('Успешна регистрация!');
            navigate(Path.Home);
        } catch (err) {
            console.log(err);
            error(err.message || 'Неуспешен опит за регистрация. Опитайте отново по-късно.');
        }
    };

    const logoutHandler = useCallback(async () => {
        try {
            await authService.logout();
        } catch (err) {
            console.log(err);
        } finally {
            setAuth({});
            localStorage.removeItem('accessToken');
            success('Успешно излизане от системата!');
            navigate(Path.Login);
        }
    }, [navigate, setAuth, success]);

    const values = {
        loginSubmitHandler,
        registerSubmitHandler,
        logoutHandler,
        username: auth.username || auth.email,
        email: auth.email,
        userId: auth._id,
        firstName: auth.firstName,
        lastName: auth.lastName,
        studentInfo: auth.studentInfo,
        role: auth.role,
        isAuthenticated: !!auth.accessToken,
        isStudent: auth.role === 'student',
        isTeacher: auth.role === 'teacher',
        isAdmin: auth.role === 'admin',
    };

    return (
        <AuthContext.Provider value={values}>
            {children}
        </AuthContext.Provider>
    );
};

AuthContext.displayName = 'AuthContext';
