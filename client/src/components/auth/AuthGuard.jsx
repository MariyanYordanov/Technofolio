// client/src/components/auth/AuthGuard.jsx
import { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import Path from '../../paths.js';

export default function AuthGuard() {
    const { isAuthenticated, isTeacher, isAdmin } = useContext(AuthContext);
    const location = useLocation();

    // Проверка дали текущия път изисква учителска роля
    const isTeacherPath = location.pathname.startsWith('/teacher');

    // Ако не е автентикиран, пренасочва към страницата за вход
    if (!isAuthenticated) {
        return <Navigate to={Path.Login} state={{ from: location }} replace />;
    }

    // Ако страницата изисква учителска роля, но потребителят не е учител или админ
    if (isTeacherPath && !isTeacher && !isAdmin) {
        return <Navigate to={Path.StudentProfile} replace />;
    }

    // Ако всичко е наред, показва защитеното съдържание
    return <Outlet />;
}