import { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext.jsx';
import * as teacherService from '../../services/teacherService.js';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import useForm from '../../hooks/useForm.js';

export default function TeacherSanctions() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, isTeacher } = useContext(AuthContext);
    const { success, error: showError } = useNotifications();

    const [student, setStudent] = useState(null);
    const [sanctions, setSanctions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddingSanction, setIsAddingSanction] = useState(false);
    const [isEditingAbsences, setIsEditingAbsences] = useState(false);
    const [isAddingRemark, setIsAddingRemark] = useState(false);

    // Извличане на данни за ученика и санкциите
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

            // Зареждане на санкциите на ученика
            const sanctionsData = await teacherService.getStudentSanctions(studentId);
            setSanctions(sanctionsData || {
                absences: {
                    excused: 0,
                    unexcused: 0,
                    maxAllowed: 150
                },
                schooloRemarks: 0,
                activeSanctions: []
            });

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

    // Форма за редактиране на отсъствия
    const { values: absencesValues, onChange: onAbsencesChange, onSubmit: onAbsencesSubmit } = useForm(async (formValues) => {
        try {
            setLoading(true);
            const updatedSanctions = await teacherService.updateStudentAbsences(studentId, {
                excused: parseInt(formValues.excused, 10),
                unexcused: parseInt(formValues.unexcused, 10),
                maxAllowed: parseInt(formValues.maxAllowed, 10)
            });

            setSanctions(prev => ({
                ...prev,
                absences: updatedSanctions.absences
            }));

            success('Отсъствията са обновени успешно!');
            setIsEditingAbsences(false);
            setLoading(false);
        } catch (err) {
            console.error('Error updating absences:', err);
            showError(err.message || 'Грешка при обновяване на отсъствията.');
            setLoading(false);
        }
    }, sanctions?.absences || { excused: 0, unexcused: 0, maxAllowed: 150 });

    // Форма за добавяне на забележка в Школо
    const { values: remarkValues, onChange: onRemarkChange, onSubmit: onRemarkSubmit } = useForm(async (formValues) => {
        try {
            setLoading(true);
            const updatedSanctions = await teacherService.updateSchooloRemarks(studentId, {
                remarks: parseInt(formValues.remarks, 10)
            });

            setSanctions(prev => ({
                ...prev,
                schooloRemarks: updatedSanctions.schooloRemarks
            }));

            success('Забележките в Школо са обновени успешно!');
            setIsAddingRemark(false);
            setLoading(false);
        } catch (err) {
            console.error('Error updating remarks:', err);
            showError(err.message || 'Грешка при обновяване на забележките.');
            setLoading(false);
        }
    }, { remarks: sanctions?.schooloRemarks || 0 });

    // Форма за добавяне на санкция
    const { values: sanctionValues, onChange: onSanctionChange, onSubmit: onSanctionSubmit } = useForm(async (formValues) => {
        try {
            setLoading(true);
            const updatedSanctions = await teacherService.addActiveSanction(studentId, {
                type: formValues.type,
                reason: formValues.reason,
                startDate: formValues.startDate,
                endDate: formValues.endDate || null,
                issuedBy: formValues.issuedBy
            });

            setSanctions(prev => ({
                ...prev,
                activeSanctions: updatedSanctions.activeSanctions
            }));

            success('Санкцията е добавена успешно!');
            setIsAddingSanction(false);
            setLoading(false);
        } catch (err) {
            console.error('Error adding sanction:', err);
            showError(err.message || 'Грешка при добавяне на санкцията.');
            setLoading(false);
        }
    }, {
        type: '',
        reason: '',
        startDate: '',
        endDate: '',
        issuedBy: ''
    });

    // Функция за премахване на санкция
    const handleRemoveSanction = async (sanctionId) => {
        if (!window.confirm('Сигурни ли сте, че искате да премахнете тази санкция?')) {
            return;
        }

        try {
            setLoading(true);
            const updatedSanctions = await teacherService.removeActiveSanction(studentId, sanctionId);

            setSanctions(prev => ({
                ...prev,
                activeSanctions: updatedSanctions.activeSanctions
            }));

            success('Санкцията е премахната успешно!');
            setLoading(false);
        } catch (err) {
            console.error('Error removing sanction:', err);
            showError(err.message || 'Грешка при премахване на санкцията.');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Зареждане на данни за санкциите...</p>
            </div>
        );
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!student || !sanctions) {
        return <div className="error">Ученикът или данните за санкции не са намерени.</div>;
    }

    return (
        <section className="teacher-sanctions-view">
            <div className="sanctions-header">
                <h1>Управление на санкции: {student.firstName} {student.lastName}</h1>
                <button
                    className="btn"
                    onClick={() => navigate(`/teacher/students/${studentId}/profile`)}
                >
                    Назад към профила
                </button>
            </div>

            <div className="sanctions-container">
                {/* Секция за отсъствия */}
                <div className="absences-section">
                    <div className="section-header">
                        <h2>Отсъствия</h2>
                        {!isEditingAbsences && (
                            <button
                                className="btn edit-btn"
                                onClick={() => setIsEditingAbsences(true)}
                            >
                                Редактирай
                            </button>
                        )}
                    </div>

                    {isEditingAbsences ? (
                        <form onSubmit={onAbsencesSubmit} className="absences-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="excused">Извинени:</label>
                                    <input
                                        type="number"
                                        id="excused"
                                        name="excused"
                                        value={absencesValues.excused}
                                        onChange={onAbsencesChange}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="unexcused">Неизвинени:</label>
                                    <input
                                        type="number"
                                        id="unexcused"
                                        name="unexcused"
                                        value={absencesValues.unexcused}
                                        onChange={onAbsencesChange}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="maxAllowed">Максимален брой допустими:</label>
                                    <input
                                        type="number"
                                        id="maxAllowed"
                                        name="maxAllowed"
                                        value={absencesValues.maxAllowed}
                                        onChange={onAbsencesChange}
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Запази</button>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setIsEditingAbsences(false)}
                                >
                                    Отказ
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="absences-data">
                            <div className="absences-counts">
                                <div className="absence-item">
                                    <span className="absence-label">Извинени:</span>
                                    <span className="absence-value">{sanctions.absences.excused}</span>
                                </div>

                                <div className="absence-item">
                                    <span className="absence-label">Неизвинени:</span>
                                    <span className="absence-value">{sanctions.absences.unexcused}</span>
                                </div>

                                <div className="absence-item">
                                    <span className="absence-label">Общо:</span>
                                    <span className="absence-value">
                                        {sanctions.absences.excused + sanctions.absences.unexcused}
                                    </span>
                                </div>
                            </div>

                            <div className="absences-progress">
                                <div className="progress-label">
                                    <span>Допустими: {sanctions.absences.maxAllowed}</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${Math.min(100, ((sanctions.absences.excused + sanctions.absences.unexcused) / sanctions.absences.maxAllowed) * 100)}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Секция за забележки в Школо */}
                <div className="schoolo-remarks-section">
                    <div className="section-header">
                        <h2>Забележки в Школо</h2>
                        {!isAddingRemark && (
                            <button
                                className="btn edit-btn"
                                onClick={() => setIsAddingRemark(true)}
                            >
                                Редактирай
                            </button>
                        )}
                    </div>

                    {isAddingRemark ? (
                        <form onSubmit={onRemarkSubmit} className="remarks-form">
                            <div className="form-group">
                                <label htmlFor="remarks">Брой забележки:</label>
                                <input
                                    type="number"
                                    id="remarks"
                                    name="remarks"
                                    value={remarkValues.remarks}
                                    onChange={onRemarkChange}
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Запази</button>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setIsAddingRemark(false)}
                                >
                                    Отказ
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="schoolo-data">
                            <div className="schoolo-count">
                                <span className="count-label">Брой забележки:</span>
                                <span className="count-value">{sanctions.schooloRemarks}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Секция за активни санкции */}
                <div className="active-sanctions-section">
                    <div className="section-header">
                        <h2>Активни санкции</h2>
                        {!isAddingSanction && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setIsAddingSanction(true)}
                            >
                                Добави санкция
                            </button>
                        )}
                    </div>

                    {isAddingSanction ? (
                        <form onSubmit={onSanctionSubmit} className="sanction-form">
                            <div className="form-group">
                                <label htmlFor="type">Тип санкция:</label>
                                <select
                                    id="type"
                                    name="type"
                                    value={sanctionValues.type}
                                    onChange={onSanctionChange}
                                    required
                                >
                                    <option value="">Изберете тип</option>
                                    <option value="Забележка">Забележка</option>
                                    <option value="Предупреждение за преместване">Предупреждение за преместване</option>
                                    <option value="Преместване в друга паралелка">Преместване в друга паралелка</option>
                                    <option value="Преместване в друго училище">Преместване в друго училище</option>
                                    <option value="Изключване">Изключване</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="reason">Причина:</label>
                                <textarea
                                    id="reason"
                                    name="reason"
                                    value={sanctionValues.reason}
                                    onChange={onSanctionChange}
                                    required
                                ></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="startDate">Начална дата:</label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        name="startDate"
                                        value={sanctionValues.startDate}
                                        onChange={onSanctionChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="endDate">Крайна дата (незадължително):</label>
                                    <input
                                        type="date"
                                        id="endDate"
                                        name="endDate"
                                        value={sanctionValues.endDate}
                                        onChange={onSanctionChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="issuedBy">Наложена от:</label>
                                <input
                                    type="text"
                                    id="issuedBy"
                                    name="issuedBy"
                                    value={sanctionValues.issuedBy}
                                    onChange={onSanctionChange}
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Добави</button>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setIsAddingSanction(false)}
                                >
                                    Отказ
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="sanctions-list">
                            {sanctions.activeSanctions.length === 0 ? (
                                <p className="no-sanctions">Няма активни санкции.</p>
                            ) : (
                                sanctions.activeSanctions.map((sanction, index) => (
                                    <div key={index} className="sanction-item">
                                        <div className="sanction-header">
                                            <div className="sanction-type">{sanction.type}</div>
                                            <button
                                                className="btn delete-btn"
                                                onClick={() => handleRemoveSanction(sanction._id)}
                                            >
                                                Премахни
                                            </button>
                                        </div>
                                        <div className="sanction-details">
                                            <span className="sanction-reason">{sanction.reason}</span>
                                            <span className="sanction-date">
                                                От: {new Date(sanction.startDate).toLocaleDateString('bg-BG')}
                                                {sanction.endDate && ` до: ${new Date(sanction.endDate).toLocaleDateString('bg-BG')}`}
                                            </span>
                                            <span className="sanction-issuer">
                                                Наложена от: {sanction.issuedBy}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}