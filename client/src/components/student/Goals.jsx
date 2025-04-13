import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import * as studentService from '../../services/studentService';
import useForm from '../../hooks/useForm';

export default function Goals() {
    const navigate = useNavigate();
    const { userId, isAuthenticated } = useContext(AuthContext);
    const [goals, setGoals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState(null);

    const fetchGoals = useCallback(async () => {
        try {
            setLoading(true);
            const studentProfile = await studentService.getStudentProfile(userId);

            if (!studentProfile) {
                navigate('/profile');
                return;
            }

            // Симулираме зареждане на цели за момента
            const goalsData = {
                personalDevelopment: {
                    title: "Личностно развитие",
                    description: "Развиване на лидерски умения",
                    activities: "Участие в училищния парламент, организиране на училищни събития"
                },
                academicDevelopment: {
                    title: "Академично развитие",
                    description: "Повишаване на средния успех до 5.50",
                    activities: "Редовно учене, участие в олимпиади по математика и физика"
                },
                profession: {
                    title: "Професия",
                    description: "Изграждане на основни умения в програмирането",
                    activities: "Разработка на личен проект, участие в SoftUni курсове"
                },
                extracurricular: {
                    title: "Извънкласна дейност",
                    description: "Развиване на спортни умения",
                    activities: "Редовни тренировки по футбол, участие в училищния отбор"
                },
                community: {
                    title: "Общност",
                    description: "Активно участие в училищния живот",
                    activities: "Доброволчество, помощ на съученици"
                },
                internship: {
                    title: "Стаж",
                    description: "Придобиване на реален опит в IT компания",
                    activities: "Кандидатстване за летни стажове, подготовка на CV"
                }
            };

            setGoals(goalsData);
            setLoading(false);
        } catch (err) {
            console.log(err);
            setError('Грешка при зареждане на целите.');
            setLoading(false);
        }
    }, [userId, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchGoals();
        }
    }, [isAuthenticated, fetchGoals]);

    const { values, onChange, onSubmit, changeValues } = useForm(async (formValues) => {
        try {
            setLoading(true);
            // API повикване за обновяване на цел
            // За момента симулираме успешен отговор

            setGoals(prevGoals => ({
                ...prevGoals,
                [editingGoalId]: {
                    ...prevGoals[editingGoalId],
                    description: formValues.description,
                    activities: formValues.activities
                }
            }));

            setIsEditing(false);
            setEditingGoalId(null);
            setLoading(false);
        } catch (err) {
            console.log(err);
            setError('Грешка при обновяване на целта.');
            setLoading(false);
        }
    }, {
        description: '',
        activities: ''
    });

    const handleEdit = (goalId) => {
        setIsEditing(true);
        setEditingGoalId(goalId);
        changeValues({
            description: goals[goalId].description,
            activities: goals[goalId].activities
        });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditingGoalId(null);
    };

    if (loading) {
        return <div className="loading">Зареждане на целите...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!goals) {
        return (
            <div className="goals-empty">
                <h1>Моите цели</h1>
                <p>Все още нямате зададени цели.</p>
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Добави цели</button>
            </div>
        );
    }

    if (isEditing) {
        const goal = goals[editingGoalId];

        return (
            <section className="goal-edit">
                <h1>Редактиране на цел: {goal.title}</h1>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="description">Описание на целта:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={values.description}
                            onChange={onChange}
                            placeholder="Опишете вашата цел..."
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="activities">Ключови дейности:</label>
                        <textarea
                            id="activities"
                            name="activities"
                            value={values.activities}
                            onChange={onChange}
                            placeholder="Опишете дейностите, които ще ви помогнат да постигнете целта..."
                        ></textarea>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">Запази</button>
                        <button type="button" className="btn" onClick={cancelEdit}>Отказ</button>
                    </div>
                </form>
            </section>
        );
    }

    return (
        <section className="goals-view">
            <h1>Моите цели</h1>

            <div className="goals-container">
                {Object.entries(goals).map(([goalId, goal]) => (
                    <div key={goalId} className="goal-card">
                        <div className="goal-header">
                            <h2>{goal.title}</h2>
                            <button className="btn edit-btn" onClick={() => handleEdit(goalId)}>
                                Редактирай
                            </button>
                        </div>
                        <div className="goal-content">
                            <div className="goal-description">
                                <h3>Описание:</h3>
                                <p>{goal.description}</p>
                            </div>
                            <div className="goal-activities">
                                <h3>Ключови дейности:</h3>
                                <p>{goal.activities}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}