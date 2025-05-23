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

    useEffect(() => {
        if (authInitialized) return;

        const isAuthPath = () => {
            const pathname = location.pathname;
            return [
                Path.Login,
                Path.Register,
                Path.EmailLogin,
                Path.ConfirmRegistration,
                "/"
            ].some(path => pathname.startsWith(path));
        };

        const verifyAuth = async () => {
            if (isAuthPath()) {
                setIsLoading(false);
                setAuthInitialized(true);
                return;
            }

            try {
                setIsLoading(true);
                const result = await authService.getMe();
                setAuth(result.user || result);
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
    }, [authInitialized, location.pathname]);

    const loginSubmitHandler = async (values) => {
        try {
            setIsLoading(true);
            if (values.password) {
                const result = await authService.login(values.email, values.password);
                setAuth(result.user || result);
                success("Успешен вход в системата!");
                navigate(Path.Home);
                return;
            }

            await authService.requestLoginLink(values.email);
            success("Линк за вход е изпратен на вашия имейл!");
        } catch (err) {
            console.log(err);
            showError(err.message || "Неуспешен опит за вход.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailLogin = useCallback(async (token) => {
        try {
            setIsLoading(true);
            const result = await authService.verifyEmailLogin(token);
            setAuth(result.user || result);
            success("Успешен вход в системата!");
            navigate(Path.Home);
        } catch (err) {
            console.log(err);
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
            success("Регистрацията е успешна!");
            navigate(Path.Login);
        } catch (err) {
            console.log(err);
            showError(err.message || "Неуспешна регистрация.");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmRegistration = useCallback(async (token) => {
        try {
            setIsLoading(true);
            const result = await authService.confirmRegistration(token);
            setAuth(result.user || result);
            success("Регистрацията е потвърдена успешно!");
            navigate(Path.Home);
        } catch (err) {
            console.log(err);
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
            localStorage.removeItem("accessToken");
            setAuth(null);
            success("Успешно излизане от системата!");
            navigate(Path.Login);
        } catch (err) {
            console.log(err);
            localStorage.removeItem("accessToken");
            setAuth(null);
            showError("Грешка при излизане.");
            navigate(Path.Login);
        } finally {
            setIsLoading(false);
        }
    }, [navigate, success, showError]);

    const redirectAfterLogin = useCallback(() => {
        if (auth?.role === "teacher" || auth?.role === "admin") {
            navigate(Path.TeacherDashboard);
        } else {
            navigate(Path.StudentProfile);
        }
    }, [auth?.role, navigate]);

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
        isAuthenticated: !!auth,
        isStudent: auth?.role === "student",
        isTeacher: auth?.role === "teacher",
        isAdmin: auth?.role === "admin",
        isLoading
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
