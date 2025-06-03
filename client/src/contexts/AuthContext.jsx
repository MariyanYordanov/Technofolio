// client/src/contexts/AuthContext.jsx
import { createContext, useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as authService from "../services/authService.js";
import Path from "../paths.js";

const AuthContext = createContext();
AuthContext.displayName = "AuthContext";

export const AuthProvider = ({ children, notificationService = {} }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [auth, setAuth] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authInitialized, setAuthInitialized] = useState(false);

    const { success = () => { }, error: showError = () => { } } = notificationService;

    // Проверка дали сме на публичен път
    const isAuthPath = useCallback(() => {
        const pathname = location.pathname;
        const publicPaths = [
            Path.Home,
            Path.Login,
            Path.Register,
            Path.EmailLogin,
            Path.ConfirmRegistration
        ];
        return publicPaths.some(path => pathname === path || pathname.startsWith(path));
    }, [location.pathname]);

    // Проверка на автентикация при зареждане
    useEffect(() => {
        if (authInitialized) return;

        const verifyAuth = async () => {
            // Ако сме на публичен път, не проверяваме автентикацията
            if (isAuthPath()) {
                setIsLoading(false);
                setAuthInitialized(true);
                return;
            }

            try {
                setIsLoading(true);
                const token = localStorage.getItem("accessToken");

                if (!token) {
                    setAuth(null);
                    setIsLoading(false);
                    setAuthInitialized(true);
                    return;
                }

                const result = await authService.getMe();
                // Сървърът връща директно user обекта
                setAuth(result);
            } catch (err) {
                console.log("User not authenticated:", err);
                localStorage.removeItem("accessToken");
                setAuth(null);
            } finally {
                setIsLoading(false);
                setAuthInitialized(true);
            }
        };

        verifyAuth();
    }, [authInitialized, isAuthPath]);

    const loginSubmitHandler = async (values) => {
        try {
            setIsLoading(true);

            if (values.password) {
                // Стандартен вход с имейл и парола
                const result = await authService.login(values.email, values.password);

                // Сървърът връща { accessToken, ...userFields }
                const { accessToken, ...userData } = result;

                if (accessToken) {
                    localStorage.setItem("accessToken", accessToken);
                    setAuth(userData);
                    success("Успешен вход в системата!");

                    // Пренасочване според ролята
                    if (userData.role === 'admin') {
                        navigate(Path.AdminDashboard);
                    } else if (userData.role === 'teacher') {
                        navigate(Path.TeacherDashboard);
                    } else {
                        navigate(Path.StudentDashboard);
                    }
                } else {
                    throw new Error("Не е получен токен за достъп");
                }
            } else {
                // Вход с имейл линк
                await authService.requestLoginLink(values.email);
                success("Линк за вход е изпратен на вашия имейл!");
            }
        } catch (err) {
            console.error("Login error:", err);
            showError(err.message || "Неуспешен опит за вход.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailLogin = useCallback(async (token) => {
        try {
            setIsLoading(true);
            const result = await authService.verifyEmailLogin(token);

            // Сървърът връща { accessToken, ...userFields }
            const { accessToken, ...userData } = result;

            if (accessToken) {
                localStorage.setItem("accessToken", accessToken);
                setAuth(userData);
                success("Успешен вход в системата!");

                // Пренасочване според ролята
                if (userData.role === 'admin') {
                    navigate(Path.AdminDashboard);
                } else if (userData.role === 'teacher') {
                    navigate(Path.TeacherDashboard);
                } else {
                    navigate(Path.StudentDashboard);
                }
            }
        } catch (err) {
            console.error("Email login error:", err);
            showError(err.message || "Невалиден или изтекъл линк.");
            navigate(Path.Login);
        } finally {
            setIsLoading(false);
        }
    }, [navigate, success, showError]);

    const registerSubmitHandler = async (values) => {
        try {
            setIsLoading(true);
            const { email, password, firstName, lastName, grade, specialization, role } = values;

            const registrationData = {
                email,
                password,
                firstName,
                lastName,
                role: role || "student",
                ...(role === "student" || !role ? { grade, specialization } : {})
            };

            await authService.register(email, password, registrationData);
            success("Регистрацията е успешна! Моля, влезте в системата.");
            navigate(Path.Login);
        } catch (err) {
            console.error("Registration error:", err);
            showError(err.message || "Неуспешна регистрация.");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmRegistration = useCallback(async (token) => {
        try {
            setIsLoading(true);
            const result = await authService.confirmRegistration(token);

            // Сървърът връща { accessToken, ...userFields }
            const { accessToken, ...userData } = result;

            if (accessToken) {
                localStorage.setItem("accessToken", accessToken);
                setAuth(userData);
                success("Регистрацията е потвърдена успешно!");

                // Пренасочване според ролята
                if (userData.role === 'admin') {
                    navigate(Path.AdminDashboard);
                } else if (userData.role === 'teacher') {
                    navigate(Path.TeacherDashboard);
                } else {
                    navigate(Path.StudentDashboard);
                }
            }
        } catch (err) {
            console.error("Confirmation error:", err);
            showError(err.message || "Невалиден или изтекъл линк.");
            navigate(Path.Register);
        } finally {
            setIsLoading(false);
        }
    }, [navigate, success, showError]);

    const logoutHandler = useCallback(async () => {
        try {
            setIsLoading(true);
            await authService.logout();
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            localStorage.removeItem("accessToken");
            setAuth(null);
            setIsLoading(false);
            success("Успешно излизане от системата!");
            navigate(Path.Home);
        }
    }, [navigate, success]);

    const values = {
        loginSubmitHandler,
        registerSubmitHandler,
        handleEmailLogin,
        confirmRegistration,
        logoutHandler,
        username: auth?.username || auth?.email,
        email: auth?.email,
        userId: auth?.id,
        firstName: auth?.firstName,
        lastName: auth?.lastName,
        role: auth?.role,
        isAuthenticated: !!auth,
        isStudent: auth?.role === "student",
        isTeacher: auth?.role === "teacher",
        isAdmin: auth?.role === "admin",
        isLoading
    };

    return (
        <AuthContext.Provider value={values}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;