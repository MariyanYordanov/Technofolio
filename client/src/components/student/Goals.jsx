import { useContext, useEffect, useState, useCallback } from 'react';
import AuthContext from '../../contexts/AuthContext.jsx';
import * as studentService from '../../services/studentService.js';
import useForm from '../../hooks/useForm.js';

export default function Goals() {
    const { userId, isAuthenticated } = useContext(AuthContext);
    const [goals, setGoals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState(null);

    const fetchGoals = useCallback(async () => {
        try {
            setLoading(true);

            // Извличаме реалните цели от API
            const goalsData = await studentService.getStudentGoals(userId);

            // Преобразуваме масива в обект по категории
            const goalsObject = {};
            goalsData.forEach(goal => {
                goalsObject[goal.category] = goal;
            });

            setGoals(goalsObject);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching goals:', err);
            setError('Грешка при зареждане на целите.');
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isAuthenticated && userId) {
            fetchGoals();
        }
    }, [isAuthenticated, userId, fetchGoals]);

    const { values, onChange, onSubmit, changeValues } = useForm(async (formValues) => {
        try {
            setLoading(true);

            // API повикване за обновяване на цел
            await studentService.updateGoal(userId, editingGoalId, {
                title: goals[editingGoalId].title,
                description: formValues.description,
                activities: formValues.activities.split(',').map(a => a.trim()).filter(a => a)
            });

            // Презареждаме целите
            await fetchGoals();

            setIsEditing(false);
            setEditingGoalId(null);
            setLoading(false);
        } catch (err) {
            console.error('Error updating goal:', err);
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
        const goal = goals[goalId];
        changeValues({
            description: goal.description || '',
            activities: Array.isArray(goal.activities) ? goal.activities.join(', ') : ''
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

    if (!goals || Object.keys(goals).length === 0) {
        return (
            <div className="goals-empty">
                <h1>Моите цели</h1>
                <p>Все още нямате зададени цели.</p>
                <button className="btn btn-primary" onClick={() => {
                    // Създаваме празни цели за всички категории
                    const categories = ['personalDevelopment', 'academicDevelopment', 'profession', 'extracurricular', 'community', 'internship'];
                    const categoryTitles = {
                        personalDevelopment: 'Личностно развитие',
                        academicDevelopment: 'Академично развитие',
                        profession: 'Професия',
                        extracurricular: 'Извънкласна дейност',
                        community: 'Общност',
                        internship: 'Стаж'
                    };

                    const emptyGoals = {};
                    categories.forEach(cat => {
                        emptyGoals[cat] = {
                            category: cat,
                            title: categoryTitles[cat],
                            description: '',
                            activities: []
                        };
                    });
                    setGoals(emptyGoals);
                }}>Създай цели</button>
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
                                <p>{Array.isArray(goal.activities) ? goal.activities.join(', ') : goal.activities}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}