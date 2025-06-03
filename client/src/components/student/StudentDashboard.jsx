// client/src/components/student/StudentDashboard.jsx
import { useContext, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import CreditContext from '../../contexts/CreditContext.jsx';
import * as studentService from '../../services/studentService.js';
import * as eventService from '../../services/eventService.js';
import Path from '../../paths.js';

export default function StudentDashboard() {
    const { userId, firstName, lastName, isAuthenticated } = useContext(AuthContext);
    const { credits, getCompletedCredits, getStudentGradeLevel } = useContext(CreditContext);
    const [student, setStudent] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [recentAchievements, setRecentAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        if (!isAuthenticated || !userId) return;

        try {
            setLoading(true);

            // Паралелно зареждане на данни
            const [profileData, eventsData, achievementsData] = await Promise.all([
                studentService.getStudentProfile(userId).catch(() => null),
                eventService.getAllEvents().catch(() => []),
                studentService.getStudentAchievements(userId).catch(() => [])
            ]);

            // Обработваме профила
            if (profileData && profileData.id) {
                setStudent(profileData);
            } else {
                // Ако няма профил, използваме базови данни от AuthContext
                setStudent({
                    firstName: firstName || 'Потребител',
                    lastName: lastName || '',
                    studentInfo: {
                        grade: 'N/A',
                        specialization: 'N/A',
                        averageGrade: null
                    }
                });
            }

            // Филтриране на предстоящи събития (следващите 3)
            const upcoming = (eventsData || [])
                .filter(event => new Date(event.startDate) > new Date())
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .slice(0, 3);
            setUpcomingEvents(upcoming);

            // Последните 3 постижения
            const recent = (achievementsData || [])
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3);
            setRecentAchievements(recent);

            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setLoading(false);
        }
    }, [isAuthenticated, userId, firstName, lastName]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Зареждане на таблото...</p>
            </div>
        );
    }

    const gradeLevel = getStudentGradeLevel();
    const completedCredits = getCompletedCredits();
    const pendingCredits = credits.filter(c => c.status === 'pending').length;

    // Извличаме данни безопасно
    const studentInfo = student?.studentInfo || {};
    const grade = studentInfo.grade || 'N/A';
    const specialization = studentInfo.specialization || 'N/A';
    const averageGrade = studentInfo.averageGrade || '-';
    const displayFirstName = student?.firstName || firstName || 'Потребител';
    const displayLastName = student?.lastName || lastName || '';

    return (
        <section className="student-dashboard">
            <div className="dashboard-header">
                <h1>Добре дошли, {displayFirstName} {displayLastName}!</h1>
                <p className="dashboard-subtitle">
                    {grade !== 'N/A' ? `${grade} клас` : ''}
                    {grade !== 'N/A' && specialization !== 'N/A' ? ' • ' : ''}
                    {specialization !== 'N/A' ? specialization : ''}
                </p>
            </div>

            {/* Бърз преглед */}
            <div className="quick-stats">
                <div className="stat-card">
                    <div className="stat-value">{averageGrade}</div>
                    <div className="stat-label">Среден успех</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{completedCredits}</div>
                    <div className="stat-label">Одобрени кредити</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{pendingCredits}</div>
                    <div className="stat-label">Чакащи кредити</div>
                </div>
                <div className="stat-card">
                    <div className={`stat-value rating-${gradeLevel.toLowerCase()}`}>
                        {gradeLevel}
                    </div>
                    <div className="stat-label">Рейтинг</div>
                </div>
            </div>

            {/* Бързи действия */}
            <div className="quick-actions">
                <h2>Бързи действия</h2>
                <div className="actions-grid">
                    <Link to={Path.Credits} className="action-card">
                        <span className="action-icon">📊</span>
                        <span className="action-title">Добави кредит</span>
                    </Link>
                    <Link to={Path.Portfolio} className="action-card">
                        <span className="action-icon">💼</span>
                        <span className="action-title">Портфолио</span>
                    </Link>
                    <Link to={Path.Events} className="action-card">
                        <span className="action-icon">📅</span>
                        <span className="action-title">Събития</span>
                    </Link>
                    <Link to={Path.Achievements} className="action-card">
                        <span className="action-icon">🏆</span>
                        <span className="action-title">Постижения</span>
                    </Link>
                </div>
            </div>

            <div className="dashboard-content">
                {/* Предстоящи събития */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>Предстоящи събития</h2>
                        <Link to={Path.Events} className="see-all">Виж всички →</Link>
                    </div>
                    {upcomingEvents.length === 0 ? (
                        <p className="no-data">Няма предстоящи събития</p>
                    ) : (
                        <div className="events-list">
                            {upcomingEvents.map(event => (
                                <div key={event.id} className="mini-event-card">
                                    <div className="event-date">
                                        {new Date(event.startDate).toLocaleDateString('bg-BG', {
                                            day: 'numeric',
                                            month: 'short'
                                        })}
                                    </div>
                                    <div className="event-info">
                                        <h4>{event.title}</h4>
                                        <p>{event.location}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Последни постижения */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>Последни постижения</h2>
                        <Link to={Path.Achievements} className="see-all">Виж всички →</Link>
                    </div>
                    {recentAchievements.length === 0 ? (
                        <p className="no-data">Още нямате постижения</p>
                    ) : (
                        <div className="achievements-list">
                            {recentAchievements.map(achievement => (
                                <div key={achievement.id} className="mini-achievement-card">
                                    <div className="achievement-icon">🏅</div>
                                    <div className="achievement-info">
                                        <h4>{achievement.title}</h4>
                                        <p>{achievement.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}