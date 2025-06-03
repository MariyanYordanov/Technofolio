import { useContext, useEffect, useState, useCallback } from 'react';
import AuthContext from '../../contexts/AuthContext.jsx';
import CreditContext from '../../contexts/CreditContext.jsx';
import useForm from '../../hooks/useForm.js';
import * as studentService from '../../services/studentService.js';

export default function CreditSystem() {
    const { isAuthenticated, userId, firstName, lastName } = useContext(AuthContext);
    const {
        credits,
        loading,
        error,
        addCredit,
        getStudentGradeLevel,
        getCompletedCredits,
        categories
    } = useContext(CreditContext);

    const [isAddingCredit, setIsAddingCredit] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [studentProfile, setStudentProfile] = useState(null);
    const [activities, setActivities] = useState([]);

    // Зареждане на профила на студента
    const fetchStudentProfile = useCallback(async () => {
        try {
            const profile = await studentService.getStudentProfile(userId);
            setStudentProfile(profile);
        } catch (err) {
            console.error('Error fetching student profile:', err);
            // Използваме fallback данни от AuthContext
            setStudentProfile({
                firstName: firstName || 'Потребител',
                lastName: lastName || '',
                studentInfo: {
                    grade: 'N/A',
                    specialization: 'N/A',
                    averageGrade: null
                }
            });
        }
    }, [userId, firstName, lastName]);

    useEffect(() => {
        if (isAuthenticated && userId) {
            fetchStudentProfile();
        }
    }, [isAuthenticated, userId, fetchStudentProfile]);

    // Обновяване на активностите при промяна на избрания стълб
    const updateActivities = useCallback((pillar) => {
        if (categories && categories[pillar]) {
            setActivities(categories[pillar].map(cat => cat.name));
        } else {
            setActivities([]);
        }
    }, [categories]);

    const { values, onChange, onSubmit, changeValues } = useForm(async (formValues) => {
        try {
            setIsAddingCredit(true);
            await addCredit({
                ...formValues,
                status: 'pending'
            });
            setIsAddingCredit(false);
            changeValues({
                pillar: '',
                activity: '',
                description: ''
            });
            setActivities([]);
        } catch (err) {
            console.error('Error adding credit:', err);
            setIsAddingCredit(false);
        }
    }, {
        pillar: '',
        activity: '',
        description: ''
    });

    // При промяна на стълба, обновяваме активностите
    const handlePillarChange = (e) => {
        onChange(e);
        updateActivities(e.target.value);
        // Нулираме избраната активност
        changeValues(prev => ({
            ...prev,
            activity: ''
        }));
    };

    // Изчисляване на изискванията според класа
    const getPillarRequirements = useCallback(() => {
        if (!studentProfile?.studentInfo?.grade) {
            return { total: 5, pillars: { 'Аз и другите': 0, 'Мислене': 0, 'Професия': 0 } };
        }

        const grade = parseInt(studentProfile.studentInfo.grade);

        switch (grade) {
            case 8: return { total: 5, pillars: { 'Аз и другите': 3, 'Мислене': 0, 'Професия': 0 } };
            case 9: return { total: 5, pillars: { 'Аз и другите': 0, 'Мислене': 3, 'Професия': 0 } };
            case 10: return { total: 6, pillars: { 'Аз и другите': 0, 'Мислене': 2, 'Професия': 2 } };
            case 11: return { total: 5, pillars: { 'Аз и другите': 0, 'Мислене': 0, 'Професия': 3 } };
            case 12: return { total: 6, pillars: { 'Аз и другите': 2, 'Мислене': 0, 'Професия': 2 } };
            default: return { total: 5, pillars: { 'Аз и другите': 0, 'Мислене': 0, 'Професия': 0 } };
        }
    }, [studentProfile]);

    if (loading) return <div className="loading">Зареждане на кредитна система...</div>;
    if (error) return <div className="error">{error}</div>;

    const requirements = getPillarRequirements();
    const gradeLevel = getStudentGradeLevel();
    const completedTotal = getCompletedCredits();

    // Безопасно извличане на данни от профила
    const studentInfo = studentProfile?.studentInfo || {};
    const displayFirstName = studentProfile?.firstName || firstName || 'Потребител';
    const displayLastName = studentProfile?.lastName || lastName || '';
    const grade = studentInfo.grade || 'N/A';
    const specialization = studentInfo.specialization || 'N/A';

    return (
        <section className="credit-system">
            <h1>Кредитна система</h1>

            <div className="credit-tabs">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Общ преглед</button>
                <button className={`tab-btn ${activeTab === 'credits' ? 'active' : ''}`} onClick={() => setActiveTab('credits')}>Моите кредити</button>
                <button className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>Добави кредит</button>
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="credit-overview">
                        <div className="student-info">
                            <h2>Профил</h2>
                            <div className="student-details">
                                <p>Име: {displayFirstName} {displayLastName}</p>
                                <p>Клас: {grade}</p>
                                <p>Специалност: {specialization}</p>
                                <p>Рейтинг: <span className={`rating-${gradeLevel.toLowerCase()}`}>{gradeLevel}</span></p>
                            </div>
                        </div>

                        <div className="credit-progress">
                            <h2>Напредък</h2>
                            <div className="credit-requirements">
                                <p>Необходими кредити: {requirements.total}</p>
                                <p>Изпълнени кредити: {completedTotal}/{requirements.total}</p>
                            </div>

                            <div className="credit-pillars">
                                {['Аз и другите', 'Мислене', 'Професия'].map(pillar => (
                                    <div className="pillar" key={pillar}>
                                        <h3>{pillar}</h3>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{
                                                width: `${Math.min(100, (getCompletedCredits(pillar) / Math.max(1, requirements.pillars[pillar])) * 100)}%`
                                            }}></div>
                                        </div>
                                        <p>{getCompletedCredits(pillar)}/{requirements.pillars[pillar]}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'credits' && (
                    <div className="credits-list">
                        <h2>Моите кредити</h2>
                        {credits.length === 0 ? (
                            <p className="no-credits">Нямате придобити кредити.</p>
                        ) : (
                            <div className="credits-table">
                                <div className="table-header">
                                    <div className="column">Стълб</div>
                                    <div className="column">Дейност</div>
                                    <div className="column">Описание</div>
                                    <div className="column">Статус</div>
                                </div>
                                {credits.map(credit => (
                                    <div key={credit._id} className="table-row">
                                        <div className="column">{credit.pillar}</div>
                                        <div className="column">{credit.activity}</div>
                                        <div className="column">{credit.description}</div>
                                        <div className="column">
                                            <span className={`status-${credit.status}`}>
                                                {credit.status === 'pending' ? 'В процес' : credit.status === 'validated' ? 'Одобрен' : 'Отхвърлен'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'add' && (
                    <div className="add-credit">
                        <h2>Добави нов кредит</h2>
                        {isAddingCredit && <p>Добавянето е в процес...</p>}

                        <form onSubmit={onSubmit}>
                            <div className="form-group">
                                <label htmlFor="pillar">Стълб:</label>
                                <select id="pillar" name="pillar" value={values.pillar} onChange={handlePillarChange} required>
                                    <option value="">Избери стълб</option>
                                    <option value="Аз и другите">Аз и другите</option>
                                    <option value="Мислене">Мислене</option>
                                    <option value="Професия">Професия</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="activity">Дейност:</label>
                                <select id="activity" name="activity" value={values.activity} onChange={onChange} required disabled={!values.pillar}>
                                    <option value="">Избери дейност</option>
                                    {activities.map(activity => (
                                        <option key={activity} value={activity}>{activity}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Описание:</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={values.description}
                                    onChange={onChange}
                                    required
                                    placeholder="Опишете дейността и как сте я изпълнили..."
                                    rows="4"
                                ></textarea>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary" disabled={isAddingCredit}>
                                    {isAddingCredit ? 'Запазване...' : 'Запази'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </section>
    );
}