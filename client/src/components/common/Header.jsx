// client/src/components/common/Header.jsx
import { useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import Path from '../../paths.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function Header() {
    const {
        isAuthenticated,
        username,
        isTeacher,
        isAdmin,
        isStudent,
        firstName,
        lastName
    } = useContext(AuthContext);

    const renderStudentMenu = () => (
        <ul className="nav-links">
            <li>
                <NavLink to={Path.StudentDashboard}>Табло</NavLink>
            </li>
            <li>
                <NavLink to={Path.StudentProfile}>Профил</NavLink>
            </li>
            <li>
                <NavLink to={Path.Portfolio}>Портфолио</NavLink>
            </li>
            <li>
                <NavLink to={Path.Credits}>Кредити</NavLink>
            </li>
            <li>
                <NavLink to={Path.Events}>Събития</NavLink>
            </li>
            <li className="nav-dropdown">
                <span>Още</span>
                <ul className="dropdown-menu">
                    <li><NavLink to={Path.Goals}>Цели</NavLink></li>
                    <li><NavLink to={Path.Achievements}>Постижения</NavLink></li>
                    <li><NavLink to={Path.Interests}>Интереси</NavLink></li>
                    <li><NavLink to={Path.Sanctions}>Санкции</NavLink></li>
                </ul>
            </li>
        </ul>
    );

    const renderTeacherMenu = () => (
        <ul className="nav-links">
            <li>
                <NavLink to={Path.TeacherDashboard}>Табло</NavLink>
            </li>
            <li>
                <NavLink to={Path.TeacherStudents}>Ученици</NavLink>
            </li>
            <li>
                <NavLink to={Path.TeacherCredits}>Кредити</NavLink>
            </li>
            <li>
                <NavLink to={Path.TeacherEvents}>Събития</NavLink>
            </li>
            <li>
                <NavLink to={Path.TeacherReports}>Отчети</NavLink>
            </li>
        </ul>
    );

    const renderAdminMenu = () => (
        <ul className="nav-links">
            <li>
                <NavLink to={Path.AdminDashboard}>Табло</NavLink>
            </li>
            <li>
                <NavLink to={Path.AdminUsers}>Потребители</NavLink>
            </li>
            <li>
                <NavLink to={Path.AdminCreditCategories}>Категории</NavLink>
            </li>
            <li className="nav-dropdown">
                <span>Система</span>
                <ul className="dropdown-menu">
                    <li><NavLink to={Path.AdminSettings}>Настройки</NavLink></li>
                    <li><NavLink to={Path.AdminReports}>Отчети</NavLink></li>
                    <li><NavLink to={Path.AdminLogs}>Логове</NavLink></li>
                    <li><NavLink to={Path.AdminBackup}>Архив</NavLink></li>
                </ul>
            </li>
        </ul>
    );

    // Определяне на home path според ролята
    const getHomePath = () => {
        if (isAdmin) return Path.AdminDashboard;
        if (isTeacher) return Path.TeacherDashboard;
        if (isStudent) return Path.StudentDashboard;
        return Path.Home;
    };

    return (
        <header className="site-header">
            <div className="logo">
                <Link to={getHomePath()}>
                    <h1>Технофолио</h1>
                </Link>
            </div>

            <nav className="main-nav">
                {isAuthenticated && (
                    isAdmin ? renderAdminMenu() :
                        isTeacher ? renderTeacherMenu() :
                            renderStudentMenu()
                )}
            </nav>

            <div className="user-actions">
                <ThemeToggle />

                {isAuthenticated ? (
                    <div className="user-menu">
                        <span className="username">
                            {firstName || lastName ? `${firstName} ${lastName}` : username}
                            {(isTeacher || isAdmin) && (
                                <span className="role-badge">
                                    {isAdmin ? 'Администратор' : 'Учител'}
                                </span>
                            )}
                        </span>
                        <Link to={Path.Logout} className="btn logout-btn">Изход</Link>
                    </div>
                ) : (
                    <div className="auth-buttons">
                        <NavLink to={Path.Login} className="btn login-btn">Вход</NavLink>
                        <NavLink to={Path.Register} className="btn register-btn">Регистрация</NavLink>
                    </div>
                )}
            </div>
        </header>
    );
}