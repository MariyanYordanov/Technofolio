import { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import * as teacherService from '../../services/teacherService.js';
import * as creditService from '../../services/creditService.js';
import useNotifications from '../../hooks/useNotifications.js';
import Path from '../../paths.js';

export default function TeacherStudentDetails() {
    const { studentId } = useParams();
    const { isAuthenticated, isTeacher } = useContext(AuthContext);
    const { success, error: showError } = useNotifications();
    const [student, setStudent] = useState(null);
    const [portfolio, setPortfolio] = useState(null);
    const [credits, setCredits] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');

    // Извличане на данни за ученика
    const fetchStudentData = useCallback(async () => {
        try {
            if (!isAuthenticated || !isTeacher) {
                setError('Нямате права за достъп до тази страница.');
                setLoading(false);
                return;
            }

            setLoading(true);

            // Зареждане на профила на ученика
            const studentData = await teacherService.getStudentById(studentId);
            setStudent(studentData);

            // Зареждане на портфолиото на ученика
            try {
                const portfolioData = await teacherService.getStudentPortfolio(studentId);
                setPortfolio(portfolioData);
            } catch (err) {
                console.error('Error fetching portfolio:', err);
                // Продължаваме, дори и да няма портфолио
            }

            // Зареждане на кредитите на ученика
            try {
                const creditsData = await teacherService.getStudentCredits(studentId);
                setCredits(creditsData);
            } catch (err) {
                console.error('Error fetching credits:', err);
                // Продължаваме, дори и да няма кредити
            }

            // Зареждане на постиженията на ученика
            try {
                const achievementsData = await teacherService.getStudentAchievements(studentId);
                setAchievements(achievementsData || []);
            } catch (err) {
                console.error('Error fetching achievements:', err);
                // Продължаваме, дори и да няма постижения
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching student data:', err);
            setError(err.message || 'Грешка при зареждане на данните за ученика.');
            setLoading(false);
        }
    }, [isAuthenticated, isTeacher, studentId]);

    useEffect(() => {
        fetchStudentData();
    }, [fetchStudentData]);

    // Функция за валидиране на кредит
    const handleValidateCredit = async (creditId, status) => {
        try {
            setLoading(true);
            const updatedCredit = await creditService.validateCredit(creditId, { status });

            // Обновяване на списъка с кредити
            setCredits(prevCredits =>
                prevCredits.map(credit =>
                    credit._id === updatedCredit._id ? updatedCredit : credit
                )
            );

            success(`Кредитът е ${status === 'validated' ? 'одобрен' : 'отхвърлен'} успешно!`);
            setLoading(false);
        } catch (err) {
            console.error('Error validating credit:', err);
            showError(err.message || 'Грешка при валидиране на кредита.');
            setLoading(false);
        }
    };

    // Извеждане на статус на ученик, базиран на кредитите
    const getStudentStatus = () => {
        const validatedCreditsCount = credits.filter(credit => credit.status === 'validated').length;

        if (validatedCreditsCount >= 15) {
            return 'Мастър';
        } else if (validatedCreditsCount >= 8) {
            return 'Напреднал';
        } else {
            return 'Начинаещ';
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Зареждане на данни за ученика...</p>
            </div>
        );
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!student) {
        return <div className="error">Ученикът не е намерен.</div>;
    }

    return (
        <section className="teacher-student-details">
            <div className="student-profile-header">
                <div className="student-profile-info">
                    <h1>{student.firstName} {student.lastName}</h1>
                    <div className="student-meta">
                        <span className="student-grade">{student.grade} клас</span>
                        <span className="student-specialization">{student.specialization}</span>
                        <span className="student-status">Статус: <span className={`rating-${getStudentStatus().toLowerCase()}`}>{getStudentStatus()}</span></span>
                    </div>
                </div>
                <div className="student-profile-actions">
                    <Link to={`/teacher/students/${studentId}/credits`} className="btn btn-primary">
                        Управление на кредити
                    </Link>
                    <Link to={`/teacher/students/${studentId}/sanctions`} className="btn btn-secondary">
                        Управление на санкции
                    </Link>
                </div>
            </div>

            <div className="student-tabs">
                <button
                    className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    Профил
                </button>
                <button
                    className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
                    onClick={() => setActiveTab('portfolio')}
                >
                    Портфолио
                </button>
                <button
                    className={`tab-btn ${activeTab === 'credits' ? 'active' : ''}`}
                    onClick={() => setActiveTab('credits')}
                >
                    Кредити
                </button>
                <button
                    className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
                    onClick={() => setActiveTab('achievements')}
                >
                    Постижения
                </button>
            </div>

            <div className="student-tab-content">
                {/* Профил */}
                {activeTab === 'profile' && (
                    <div className="student-profile-tab">
                        <div className="student-details-card">
                            <h2>Основна информация</h2>
                            <div className="student-details-content">
                                <div className="detail-row">
                                    <span className="detail-label">Име:</span>
                                    <span className="detail-value">{student.firstName} {student.lastName}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Имейл:</span>
                                    <span className="detail-value">{student.email}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Клас:</span>
                                    <span className="detail-value">{student.grade}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Специалност:</span>
                                    <span className="detail-value">{student.specialization}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Среден успех:</span>
                                    <span className="detail-value">{student.averageGrade || 'Няма въведен'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Статус:</span>
                                    <span className={`detail-value rating-${getStudentStatus().toLowerCase()}`}>{getStudentStatus()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Портфолио */}
                {activeTab === 'portfolio' && (
                    <div className="student-portfolio-tab">
                        {portfolio ? (
                            <>
                                <div className="portfolio-section">
                                    <h2>Професионален опит</h2>
                                    <p>{portfolio.experience || 'Няма въведен професионален опит'}</p>
                                </div>

                                <div className="portfolio-section">
                                    <h2>Ключови проекти</h2>
                                    <p>{portfolio.projects || 'Няма въведени ключови проекти'}</p>
                                </div>

                                {portfolio.mentorId && (
                                    <div className="portfolio-section">
                                        <h2>Ментор</h2>
                                        <div className="mentor-info">
                                            <p>{portfolio.mentorName || 'Няма информация за ментора'}</p>
                                        </div>
                                    </div>
                                )}

                                {portfolio.recommendations && portfolio.recommendations.length > 0 ? (
                                    <div className="portfolio-section">
                                        <h2>Препоръки</h2>
                                        <div className="recommendations-list">
                                            {portfolio.recommendations.map((recommendation, index) => (
                                                <div key={index} className="recommendation-item">
                                                    <p className="recommendation-text">"{recommendation.text}"</p>
                                                    <p className="recommendation-author">- {recommendation.author}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="portfolio-section">
                                        <h2>Препоръки</h2>
                                        <p>Няма въведени препоръки</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="no-data">
                                <p>Ученикът няма създадено портфолио.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Кредити */}
                {activeTab === 'credits' && (
                    <div className="student-credits-tab">
                        <h2>Кредити</h2>
                        {credits.length === 0 ? (
                            <p className="no-credits">Ученикът няма въведени кредити.</p>
                        ) : (
                            <div className="credits-table">
                                <div className="table-header">
                                    <div className="column">Стълб</div>
                                    <div className="column">Дейност</div>
                                    <div className="column">Описание</div>
                                    <div className="column">Статус</div>
                                    <div className="column">Действия</div>
                                </div>

                                {credits.map(credit => (
                                    <div key={credit._id} className="table-row">
                                        <div className="column">{credit.pillar}</div>
                                        <div className="column">{credit.activity}</div>
                                        <div className="column">{credit.description}</div>
                                        <div className="column">
                                            <span className={`status-${credit.status}`}>
                                                {credit.status === 'pending' ? 'В процес' :
                                                    credit.status === 'validated' ? 'Одобрен' : 'Отхвърлен'}
                                            </span>
                                        </div>
                                        <div className="column actions">
                                            {credit.status === 'pending' && (
                                                <>
                                                    <button
                                                        className="btn btn-primary validate-btn"
                                                        onClick={() => handleValidateCredit(credit._id, 'validated')}
                                                    >
                                                        Одобри
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary reject-btn"
                                                        onClick={() => handleValidateCredit(credit._id, 'rejected')}
                                                    >
                                                        Отхвърли
                                                    </button>
                                                </>
                                            )}
                                            {credit.status !== 'pending' && (
                                                <span className="validation-info">
                                                    {credit.validatedBy ? `Валидиран от: ${credit.validatedBy}` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Постижения */}
                {activeTab === 'achievements' && (
                    <div className="student-achievements-tab">
                        <h2>Постижения</h2>
                        {achievements.length === 0 ? (
                            <p className="no-data">Ученикът няма въведени постижения.</p>
                        ) : (
                            <div className="achievements-list">
                                {achievements.map((achievement, index) => (
                                    <div key={index} className="achievement-card">
                                        <div className="achievement-header">
                                            <h3>{achievement.title}</h3>
                                            <span className="achievement-date">
                                                {new Date(achievement.date).toLocaleDateString('bg-BG')}
                                            </span>
                                        </div>
                                        <div className="achievement-body">
                                            <div className="achievement-info">
                                                <span className="category">{achievement.category}</span>
                                                {achievement.place && (
                                                    <span className="place">{achievement.place}</span>
                                                )}
                                                {achievement.issuer && (
                                                    <span className="issuer">Организатор: {achievement.issuer}</span>
                                                )}
                                            </div>
                                            {achievement.description && (
                                                <p className="description">{achievement.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}