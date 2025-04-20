import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "../../contexts/AuthContext";

export default function AuthGuard() {
    const { isAuthenticated, isLoading, authInitialized } = useContext(AuthContext);

    // Изчакваме инициализацията на автентикацията, преди да вземем решение за пренасочване
    if (isLoading || !authInitialized) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Проверка на автентикацията...</p>
            </div>
        );
    }

    // Пренасочваме само ако автентикацията е проверена и потребителят не е автентикиран
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return <Outlet />;
}