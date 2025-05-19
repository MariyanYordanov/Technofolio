// client/src/components/teacher/TeacherDashboard.jsx
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import Path from '../../paths.js';

export default function TeacherDashboard() {
    const { isAuthenticated, isTeacher, firstName, lastName } = useContext(AuthContext);

    if (!isAuthenticated || !isTeacher) {
        return (
            <div className="error">
                Нямате права за достъп до тази страница.
            </div>
        );
    }

    return (
        <section className="teacher-dashboard">
            <div className="dashboard-header">
                <h1>Учителско табло</h1>
                <p className="welcome-message">Добре дошли, {firstName} {lastName}!</p>
            </div>

            <div className="dashboard-actions">
                <div className="action-card">
                    <h2>Ученици</h2>
                    <p>Преглед и управление на учениците и техните профили.</p>
                    <Link to={Path.TeacherStudents} className="btn btn-primary">
                        Управление на ученици
                    </Link>
                </div>

                <div className="action-card">
                    <h2>Събития</h2>
                    <p>Създаване и редактиране на учебни и извънкласни събития.</p>
                    <Link to={Path.TeacherEvents} className="btn btn-primary">
                        Управление на събития
                    </Link>
                </div>

                <div className="action-card">
                    <h2>Кредитна система</h2>
                    <p>Валидиране на кредити и преглед на напредъка на учениците.</p>
                    <Link to={Path.TeacherStudents} className="btn btn-primary">
                        Преглед на кредити
                    </Link>
                </div>

                <div className="action-card">
                    <h2>Санкции и забележки</h2>
                    <p>Управление на отсъствия, забележки и санкции на учениците.</p>
                    <Link to={Path.TeacherStudents} className="btn btn-primary">
                        Въвеждане на санкции
                    </Link>
                </div>
            </div>
        </section>
    );
}