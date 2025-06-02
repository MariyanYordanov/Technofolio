// client/src/components/teacher/TeacherCreditsManagement.jsx
import { useContext, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import * as teacherService from '../../services/teacherService.js';
import * as creditService from '../../services/creditService.js';
import useNotifications from '../../hooks/useNotifications.js';

export default function TeacherCreditsManagement() {
    const { isAuthenticated, isTeacher } = useContext(AuthContext);
    const { success, error: showError } = useNotifications();

    const [pendingCredits, setPendingCredits] = useState([]);
    const [allCredits, setAllCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [filters, setFilters] = useState({
        grade: '',
        pillar: '',
        status: '',
    });
    const [expandedCreditId, setExpandedCreditId] = useState(null);

    const pillars = ['Аз и другите', 'Мислене', 'Професия'];
    const grades = ['8', '9', '10', '11', '12'];
    const statuses = ['pending', 'validated', 'rejected'];

    // Извличане на списъка с кредити
    const fetchCredits = useCallback(async () => {
        try {
            if (!isAuthenticated || !isTeacher) {
                setError('Нямате права за достъп до тази страница.');
                setLoading(false);
                return;
            }

            setLoading(true);

            // Зареждане на чакащи кредити
            const pendingCreditsData = await teacherService.getPendingCredits();
            setPendingCredits(pendingCreditsData || []);

            // Зареждане на всички кредити
            const allCreditsData = await creditService.getAllCredits();
            setAllCredits(allCreditsData || []);

            setLoading(false);
        } catch (err) {
            console.error('Error fetching credits:', err);
            setError(err.message || 'Грешка при зареждане на кредитите.');
            showError(err.message || 'Грешка при зареждане на кредитите.');
            setLoading(false);
        }
    }, [isAuthenticated, isTeacher, showError]);

    useEffect(() => {
        fetchCredits();
    }, [fetchCredits]);

    // Функция за валидиране на кредит
    const handleValidateCredit = async (creditId, status) => {
        try {
            setLoading(true);
            await creditService.validateCredit(creditId, { status });

            // Обновяване на списъка с кредити
            fetchCredits();

            success(`Кредитът е ${status === 'validated' ? 'одобрен' : 'отхвърлен'} успешно!`);
        } catch (err) {
            console.error('Error validating credit:', err);
            showError(err.message || 'Грешка при валидиране на кредита.');
            setLoading(false);
        }
    };

    // Функция за филтриране на кредити
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Филтриране на кредитите според избраните филтри
    const filteredCredits = allCredits.filter(credit => {
        if (filters.grade && credit.student?.grade !== filters.grade) {
            return false;
        }
        if (filters.pillar && credit.pillar !== filters.pillar) {
            return false;
        }
        if (filters.status && credit.status !== filters.status) {
            return false;
        }
        return true;
    });

    // Преобразуване на статус в човешки четим текст
    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'В процес';
            case 'validated': return 'Одобрен';
            case 'rejected': return 'Отхвърлен';
            default: return status;
        }
    };

    // Разширяване/свиване на детайлите за кредит
    const toggleCreditDetails = (creditId) => {
        setExpandedCreditId(expandedCreditId === creditId ? null : creditId);
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Зареждане на кредити...</p>
            </div>
        );
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!isAuthenticated || !isTeacher) {
        return <div className="error">Нямате права за достъп до тази страница.</div>;
    }

    return (
        <section className="teacher-credits-management">
            <div className="page-header">
                <h1>Управление на кредити</h1>
            </div>

            <div className="credits-tabs">
                <button
                    className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Чакащи кредити ({pendingCredits.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    Всички кредити
                </button>
            </div>

            {/* Таб с чакащи кредити */}
            {activeTab === 'pending' && (
                <div className="pending-credits-tab">
                    {pendingCredits.length === 0 ? (
                        <p className="no-data">Няма чакащи кредити за одобрение.</p>
                    ) : (
                        <div className="credits-list">
                            {pendingCredits.map(credit => (
                                <div key={credit._id} className="credit-card">
                                    <div className="credit-header">
                                        <div className="credit-student">
                                            <span className="label">Ученик:</span>
                                            <span className="value">
                                                <Link to={`/teacher/students/${credit.studentId}/profile`}>
                                                    {credit.student?.firstName} {credit.student?.lastName}
                                                </Link>
                                            </span>
                                        </div>
                                        <div className="credit-meta">
                                            <span className="label">Клас:</span>
                                            <span className="value">{credit.student?.grade}</span>
                                        </div>
                                        <div className="credit-meta">
                                            <span className="label">Дата:</span>
                                            <span className="value">
                                                {new Date(credit.date).toLocaleDateString('bg-BG')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="credit-content">
                                        <div className="credit-pillar">
                                            <span className="label">Стълб:</span>
                                            <span className="value">{credit.pillar}</span>
                                        </div>
                                        <div className="credit-activity">
                                            <span className="label">Дейност:</span>
                                            <span className="value">{credit.activity}</span>
                                        </div>
                                        <div className="credit-description">
                                            <span className="label">Описание:</span>
                                            <span className="value">{credit.description}</span>
                                        </div>
                                    </div>
                                    <div className="credit-actions">
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
                                        <Link
                                            to={`/teacher/students/${credit.studentId}/credits`}
                                            className="btn view-student-btn"
                                        >
                                            Виж всички кредити на ученика
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Таб с всички кредити */}
            {activeTab === 'all' && (
                <div className="all-credits-tab">
                    <div className="filters-section">
                        <h3>Филтри</h3>
                        <div className="filters-row">
                            <div className="filter-group">
                                <label htmlFor="grade">Клас:</label>
                                <select
                                    id="grade"
                                    name="grade"
                                    value={filters.grade}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Всички класове</option>
                                    {grades.map(grade => (
                                        <option key={grade} value={grade}>{grade} клас</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label htmlFor="pillar">Стълб:</label>
                                <select
                                    id="pillar"
                                    name="pillar"
                                    value={filters.pillar}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Всички стълбове</option>
                                    {pillars.map(pillar => (
                                        <option key={pillar} value={pillar}>{pillar}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-group">
                                <label htmlFor="status">Статус:</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Всички статуси</option>
                                    {statuses.map(status => (
                                        <option key={status} value={status}>{getStatusText(status)}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                className="btn clear-filters-btn"
                                onClick={() => setFilters({ grade: '', pillar: '', status: '' })}
                            >
                                Изчисти филтрите
                            </button>
                        </div>
                    </div>

                    {filteredCredits.length === 0 ? (
                        <p className="no-data">Няма намерени кредити.</p>
                    ) : (
                        <div className="credits-table">
                            <div className="table-header">
                                <div className="column student-column">Ученик</div>
                                <div className="column">Клас</div>
                                <div className="column">Стълб</div>
                                <div className="column">Дейност</div>
                                <div className="column">Дата</div>
                                <div className="column">Статус</div>
                                <div className="column">Действия</div>
                            </div>

                            {filteredCredits.map(credit => (
                                <div key={credit._id}>
                                    <div
                                        className="table-row"
                                        onClick={() => toggleCreditDetails(credit._id)}
                                    >
                                        <div className="column student-column">
                                            <Link to={`/teacher/students/${credit.studentId}/profile`}>
                                                {credit.student?.firstName} {credit.student?.lastName}
                                            </Link>
                                        </div>
                                        <div className="column">{credit.student?.grade}</div>
                                        <div className="column">{credit.pillar}</div>
                                        <div className="column">{credit.activity}</div>
                                        <div className="column">
                                            {new Date(credit.date).toLocaleDateString('bg-BG')}
                                        </div>
                                        <div className="column">
                                            <span className={`status-${credit.status}`}>
                                                {getStatusText(credit.status)}
                                            </span>
                                        </div>
                                        <div className="column actions">
                                            {credit.status === 'pending' ? (
                                                <>
                                                    <button
                                                        className="btn btn-primary validate-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleValidateCredit(credit._id, 'validated');
                                                        }}
                                                    >
                                                        Одобри
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary reject-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleValidateCredit(credit._id, 'rejected');
                                                        }}
                                                    >
                                                        Отхвърли
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="validated-by">
                                                    {credit.validatedBy && `Валидиран от: ${credit.validatedBy}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {expandedCreditId === credit._id && (
                                        <div className="credit-details">
                                            <div className="detail-row">
                                                <span className="detail-label">Описание:</span>
                                                <span className="detail-value">{credit.description}</span>
                                            </div>
                                            {credit.validationNotes && (
                                                <div className="detail-row">
                                                    <span className="detail-label">Бележки:</span>
                                                    <span className="detail-value">{credit.validationNotes}</span>
                                                </div>
                                            )}
                                            <div className="detail-actions">
                                                <Link
                                                    to={`/teacher/students/${credit.studentId}/credits`}
                                                    className="btn view-student-btn"
                                                >
                                                    Виж всички кредити на ученика
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}