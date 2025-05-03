import { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import Path from '../../paths.js';

export default function Header() {
    const {
        isAuthenticated,
        username,
    } = useContext(AuthContext);

    return (
        <header className="site-header">
            <div className="logo">
                <Link to={Path.Home}>
                    <h1>Технофолио</h1>
                </Link>
            </div>

            <nav className="main-nav">
                {isAuthenticated && (
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
                )}
            </nav>

            <div className="user-actions">
                {isAuthenticated ? (
                    <div className="user-menu">
                        <span className="username">{username}</span>
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