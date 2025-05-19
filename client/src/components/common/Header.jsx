import { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import Path from '../../paths.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function Header() {
    const {
        isAuthenticated,
        username,
        isTeacher,
        isAdmin,
        firstName,
        lastName
    } = useContext(AuthContext);

    const renderStudentMenu = () => (
        <ul className="nav-links">
            <li>
                <Link to={Path.StudentProfile}>Профил</Link>
            </li>
            <li>
                <Link to={Path.Portfolio}>Портфолио</Link>
            </li>
            <li>
                <Link to={Path.Goals}>Цели</Link>
            </li>
            <li>
                <Link to={Path.Credits}>Кредити</Link>
            </li>
            <li>
                <Link to={Path.Events}>Събития</Link>
            </li>
        </ul>
    );

    const renderTeacherMenu = () => (
        <ul className="nav-links">
            <li>
                <Link to={Path.TeacherDashboard}>Табло</Link>
            </li>
            <li>
                <Link to={Path.TeacherStudents}>Ученици</Link>
            </li>
            <li>
                <Link to={Path.TeacherCredits}>Кредити</Link>
            </li>
            <li>
                <Link to={Path.TeacherEvents}>Събития</Link>
            </li>
            <li>
                <Link to={Path.TeacherReports}>Отчети</Link>
            </li>
        </ul>
    );

    return (
        <header className="site-header">
            <div className="logo">
                <Link to={isTeacher || isAdmin ? Path.TeacherDashboard : Path.Home}>
                    <h1>Технофолио</h1>
                </Link>
            </div>

            <nav className="main-nav">
                {isAuthenticated && (
                    isTeacher || isAdmin ? renderTeacherMenu() : renderStudentMenu()
                )}
            </nav>

            <div className="user-actions">
                <ThemeToggle />

                {isAuthenticated ? (
                    <div className="user-menu">
                        <span className="username">
                            {firstName || lastName ? `${firstName} ${lastName}` : username}
                            {(isTeacher || isAdmin) && <span className="role-badge">{isAdmin ? 'Администратор' : 'Учител'}</span>}
                        </span>
                        <Link to={Path.Logout} className="btn logout-btn">Изход</Link>
                    </div>
                ) : (
                    <div className="auth-buttons">
                        <Link to={Path.Login} className="btn login-btn">Вход</Link>
                        <Link to={Path.Register} className="btn register-btn">Регистрация</Link>
                    </div>
                )}
            </div>
        </header>
    );
}