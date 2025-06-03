// client/src/components/teacher/TeacherDashboard.jsx
import { useContext, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import * as teacherService from '../../services/teacherService.js';
import useNotifications from '../../hooks/useNotifications.js';
import Path from '../../paths.js';

export default function TeacherDashboard() {
    const { isAuthenticated, isTeacher, firstName, lastName } = useContext(AuthContext);
    const { error: showError } = useNotifications();

    const [statistics, setStatistics] = useState(null);
    const [pendingCredits, setPendingCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Функция за извличане на данни за дашборда
    const fetchDashboardData = useCallback(async () => {
        try {
            if (!isAuthenticated || !isTeacher) {
                setError('Нямате права за достъп до тази страница.');
                setLoading(false);
                return;
            }

            setLoading(true);

            // Зареждане на статистика за учениците
            try {
                const statsData = await teacherService.getStudentsStatistics();
                setStatistics(statsData || {
                    totalStudents: 0,
                    studentsPerGrade: {},
                    studentsPerSpecialization: {},
                    avgCredits: 0,
                    pendingCreditsCount: 0
                });
            } catch (err) {
                console.error('Error loading statistics:', err);
            }

            // Зареждане на чакащи кредити
            try {
                const pendingCreditsData = await teacherService.getPendingCredits();
                setPendingCredits(pendingCreditsData || []);
            } catch (err) {
                console.error('Error loading pending credits:', err);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message || 'Грешка при зареждане на данните за дашборда.');
            showError(err.message || 'Грешка при зареждане на данните за дашборда.');
            setLoading(false);
        }
    }, [isAuthenticated, isTeacher, showError]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Зареждане на дашборда...</p>
            </div>
        );
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

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

            {/* Секция със статистики */}
            {statistics && (
                <div className="dashboard-statistics">
                    <h2>Обща статистика</h2>
                    <div className="statistics-grid">
                        <div className="statistic-card">
                            <div className="statistic-value">{statistics.totalStudents}</div>
                            <div className="statistic-label">Общо ученици</div>
                        </div>

                        <div className="statistic-card">
                            <div className="statistic-value">{statistics.pendingCreditsCount}</div>
                            <div className="statistic-label">Чакащи кредити</div>
                        </div>

                        <div className="statistic-card">
                            <div className="statistic-value">{statistics.avgCredits.toFixed(1)}</div>
                            <div className="statistic-label">Среден брой кредити на ученик</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Секция със чакащи кредити */}
            <div className="pending-credits-section">
                <div className="section-header">
                    <h2>Чакащи кредити за одобрение</h2>
                    <Link to="/teacher/credits" className="btn">Виж всички</Link>
                </div>

                {pendingCredits.length === 0 ? (
                    <p className="no-data">Няма чакащи кредити за одобрение.</p>
                ) : (
                    <div className="pending-credits-list">
                        {pendingCredits.slice(0, 5).map(credit => (
                            <div key={credit.id} className="pending-credit-item">
                                <div className="credit-content">
                                    <div className="credit-student">{credit.studentName}</div>
                                    <div className="credit-details">
                                        <span className="credit-pillar">{credit.pillar}</span>
                                        <span className="credit-activity">{credit.activity}</span>
                                    </div>
                                    <div className="credit-description">{credit.description}</div>
                                </div>
                                <div className="credit-actions">
                                    <Link to={`/teacher/students/${credit.studentId}/credits`} className="btn btn-primary">
                                        Преглед
                                    </Link>
                                </div>
                            </div>
                        ))}
                        {pendingCredits.length > 5 && (
                            <div className="view-more">
                                <Link to="/teacher/credits" className="btn">Виж всички ({pendingCredits.length})</Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Секция с бързи действия */}
            <div className="dashboard-actions">
                <h2>Бързи действия</h2>
                <div className="actions-grid">
                    <div className="action-card">
                        <h3>Ученици</h3>
                        <p>Преглед и управление на учениците и техните профили.</p>
                        <Link to={Path.TeacherStudents} className="btn btn-primary">
                            Управление на ученици
                        </Link>
                    </div>

                    <div className="action-card">
                        <h3>Събития</h3>
                        <p>Създаване и редактиране на учебни и извънкласни събития.</p>
                        <Link to={Path.TeacherEvents} className="btn btn-primary">
                            Управление на събития
                        </Link>
                    </div>

                    <div className="action-card">
                        <h3>Кредитна система</h3>
                        <p>Валидиране на кредити и преглед на напредъка на учениците.</p>
                        <Link to="/teacher/credits" className="btn btn-primary">
                            Преглед на кредити
                        </Link>
                    </div>

                    <div className="action-card">
                        <h3>Отчети</h3>
                        <p>Генериране на отчети за ученици, класове и кредити.</p>
                        <Link to="/teacher/reports" className="btn btn-primary">
                            Генериране на отчети
                        </Link>
                    </div>
                </div>
            </div>

            {/* Секция по класове */}
            {statistics && statistics.studentsPerGrade && Object.keys(statistics.studentsPerGrade).length > 0 && (
                <div className="grades-section">
                    <h2>Ученици по класове</h2>
                    <div className="grades-grid">
                        {Object.entries(statistics.studentsPerGrade).map(([grade, count]) => (
                            <div key={grade} className="grade-card">
                                <div className="grade-header">
                                    <h3>{grade} клас</h3>
                                    <span className="students-count">{count} ученици</span>
                                </div>
                                <div className="grade-actions">
                                    <Link to={`/teacher/students?grade=${grade}`} className="btn">
                                        Виж ученици
                                    </Link>
                                    <Link to={`/teacher/reports?grade=${grade}`} className="btn">
                                        Генерирай отчет
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Секция по специалности */}
            {statistics && statistics.studentsPerSpecialization && Object.keys(statistics.studentsPerSpecialization).length > 0 && (
                <div className="specializations-section">
                    <h2>Ученици по специалности</h2>
                    <div className="specializations-grid">
                        {Object.entries(statistics.studentsPerSpecialization).map(([specialization, count]) => (
                            <div key={specialization} className="specialization-card">
                                <div className="specialization-name">{specialization}</div>
                                <div className="specialization-count">{count} ученици</div>
                                <Link to={`/teacher/students?specialization=${encodeURIComponent(specialization)}`} className="btn">
                                    Виж ученици
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}