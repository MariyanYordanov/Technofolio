// client/src/components/admin/AdminDashboard.jsx
import { useContext, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import * as adminService from '../../services/adminService.js';
import { useNotifications } from '../../contexts/NotificationContext.jsx';

export default function AdminDashboard() {
    const { isAuthenticated, isAdmin, firstName, lastName } = useContext(AuthContext);
    const { error: showError } = useNotifications();

    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStatistics = useCallback(async () => {
        try {
            if (!isAuthenticated || !isAdmin) {
                setError('Нямате права за достъп до тази страница.');
                setLoading(false);
                return;
            }

            setLoading(true);

            // Събиране на статистики от различни източници
            const [usersStats, creditsStats, eventsStats] = await Promise.all([
                adminService.getUsersStatistics(),
                adminService.getCreditsStatistics(),
                adminService.getEventsStatistics()
            ]);

            setStatistics({
                users: usersStats,
                credits: creditsStats,
                events: eventsStats
            });

            setLoading(false);
        } catch (err) {
            console.error('Error fetching statistics:', err);
            setError(err.message || 'Грешка при зареждане на статистиките.');
            showError(err.message || 'Грешка при зареждане на статистиките.');
            setLoading(false);
        }
    }, [isAuthenticated, isAdmin, showError]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Зареждане на таблото...</p>
            </div>
        );
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!isAuthenticated || !isAdmin) {
        return (
            <div className="error">
                Нямате права за достъп до административния панел.
            </div>
        );
    }

    return (
        <section className="admin-dashboard">
            <div className="dashboard-header">
                <h1>Административно табло</h1>
                <p className="welcome-message">Добре дошли, {firstName} {lastName}!</p>
            </div>

            {/* Обща статистика */}
            {statistics && (
                <div className="dashboard-statistics">
                    <h2>Обща статистика</h2>
                    <div className="statistics-grid">
                        <div className="statistic-card">
                            <div className="statistic-value">{statistics.users.total}</div>
                            <div className="statistic-label">Общо потребители</div>
                        </div>
                        <div className="statistic-card">
                            <div className="statistic-value">{statistics.users.students}</div>
                            <div className="statistic-label">Ученици</div>
                        </div>
                        <div className="statistic-card">
                            <div className="statistic-value">{statistics.users.teachers}</div>
                            <div className="statistic-label">Учители</div>
                        </div>
                        <div className="statistic-card">
                            <div className="statistic-value">{statistics.credits.total}</div>
                            <div className="statistic-label">Общо кредити</div>
                        </div>
                        <div className="statistic-card">
                            <div className="statistic-value">{statistics.credits.pending}</div>
                            <div className="statistic-label">Чакащи кредити</div>
                        </div>
                        <div className="statistic-card">
                            <div className="statistic-value">{statistics.events.total}</div>
                            <div className="statistic-label">Общо събития</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Бързи действия */}
            <div className="admin-actions">
                <h2>Управление</h2>
                <div className="actions-grid">
                    <div className="action-card">
                        <h3>Потребители</h3>
                        <p>Управление на потребителски акаунти, роли и права.</p>
                        <Link to="/admin/users" className="btn btn-primary">
                            Управление на потребители
                        </Link>
                    </div>

                    <div className="action-card">
                        <h3>Кредитни категории</h3>
                        <p>Добавяне и редактиране на категории за кредитната система.</p>
                        <Link to="/admin/credit-categories" className="btn btn-primary">
                            Управление на категории
                        </Link>
                    </div>

                    <div className="action-card">
                        <h3>Системни настройки</h3>
                        <p>Конфигуриране на системни параметри и настройки.</p>
                        <Link to="/admin/settings" className="btn btn-primary">
                            Системни настройки
                        </Link>
                    </div>

                    <div className="action-card">
                        <h3>Отчети и анализи</h3>
                        <p>Генериране на подробни отчети и статистически анализи.</p>
                        <Link to="/admin/reports" className="btn btn-primary">
                            Отчети
                        </Link>
                    </div>

                    <div className="action-card">
                        <h3>Системен лог</h3>
                        <p>Преглед на системни събития и потребителска активност.</p>
                        <Link to="/admin/logs" className="btn btn-primary">
                            Системен лог
                        </Link>
                    </div>

                    <div className="action-card">
                        <h3>Архивиране</h3>
                        <p>Архивиране и възстановяване на данни.</p>
                        <Link to="/admin/backup" className="btn btn-primary">
                            Архивиране
                        </Link>
                    </div>
                </div>
            </div>

            {/* Последни активности */}
            <div className="recent-activities">
                <h2>Последни активности</h2>
                <div className="activities-list">
                    <p className="no-data">Функционалността за последни активности ще бъде добавена скоро.</p>
                </div>
            </div>
        </section>
    );
}