// client/src/components/teacher/TeacherCredits.jsx
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import * as teacherService from '../../services/teacherService.js';
import * as creditService from '../../services/creditService.js';
import { useNotifications } from '../../contexts/NotificationContext.jsx';

export default function TeacherCredits() {
    const { studentId } = useParams();
    const { isAuthenticated, isTeacher } = useContext(AuthContext);
    const { success, error: showError } = useNotifications();
    const [student, setStudent] = useState(null);
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!isAuthenticated || !isTeacher) {
                    setError('Нямате права за достъп до тази страница.');
                    setLoading(false);
                    return;
                }

                setLoading(true);

                // Зареди данните за ученика
                const studentData = await teacherService.getStudentById(studentId);
                setStudent(studentData);

                // Зареди кредитите на ученика
                const creditsData = await creditService.getStudentCredits(studentId);
                setCredits(creditsData);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching student data:', err);
                setError('Грешка при зареждане на данните.');
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, isTeacher, studentId]);

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

    if (loading) {
        return <div className="loading">Зареждане на данни...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!student) {
        return <div className="error">Ученикът не е намерен.</div>;
    }

    return (
        <section className="teacher-credits-view">
            <h1>Кредити на {student.firstName} {student.lastName}</h1>

            <div className="student-info">
                <p className="student-grade">Клас: {student.grade}</p>
                <p className="student-specialization">Специалност: {student.specialization}</p>
            </div>

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
                                        {credit.validatedBy ? `Валидиран от: ${credit.validatedBy.firstName} ${credit.validatedBy.lastName}` : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}