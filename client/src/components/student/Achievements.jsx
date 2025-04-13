import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import * as studentService from '../../services/studentService';
import useForm from '../../hooks/useForm';

export default function Achievements() {
    const navigate = useNavigate();
    const { userId, isAuthenticated } = useContext(AuthContext);
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddingAchievement, setIsAddingAchievement] = useState(false);
    const [achievementCategories] = useState([
        { id: 'competition', name: 'Състезание' },
        { id: 'olympiad', name: 'Олимпиада' },
        { id: 'tournament', name: 'Турнир' },
        { id: 'certificate', name: 'Сертификат' },
        { id: 'award', name: 'Награда' },
        { id: 'other', name: 'Друго' }
    ]);

    const fetchAchievements = useCallback(async () => {
        try {
            setLoading(true);
            const studentProfile = await studentService.getStudentProfile(userId);

            if (!studentProfile) {
                navigate('/profile');
                return;
            }

            const achievementsData = await studentService.getStudentAchievements(studentProfile._id);
            setAchievements(achievementsData || []);
            setLoading(false);
        } catch (err) {
            console.log(err);
            setError('Грешка при зареждане на постиженията.');
            setLoading(false);
        }
    }, [userId, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchAchievements();
        }
    }, [isAuthenticated, fetchAchievements]);

    const { values, onChange, onSubmit, changeValues } = useForm(async (formValues) => {
        try {
            setLoading(true);
            const studentProfile = await studentService.getStudentProfile(userId);

            const newAchievement = await studentService.addAchievement(studentProfile._id, formValues);
            setAchievements(prevAchievements => [...prevAchievements, newAchievement]);

            setIsAddingAchievement(false);
            changeValues({
                category: '',
                title: '',
                description: '',
                date: '',
                place: '',
                issuer: ''
            });
            setLoading(false);
        } catch (err) {
            console.log(err);
            setError('Грешка при добавяне на постижение.');
            setLoading(false);
        }
    }, {
        category: '',
        title: '',
        description: '',
        date: '',
        place: '',
        issuer: ''
    });

    const handleDeleteAchievement = async (achievementId) => {
        if (!window.confirm('Сигурни ли сте, че искате да изтриете това постижение?')) {
            return;
        }

        try {
            setLoading(true);
            const studentProfile = await studentService.getStudentProfile(userId);

            await studentService.removeAchievement(studentProfile._id, achievementId);
            setAchievements(prevAchievements =>
                prevAchievements.filter(achievement => achievement._id !== achievementId)
            );

            setLoading(false);
        } catch (err) {
            console.log(err);
            setError('Грешка при изтриване на постижението.');
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Зареждане на постижения...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (isAddingAchievement) {
        return (
            <section className="achievement-add">
                <h1>Добавяне на ново постижение</h1>

                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="category">Категория:</label>
                        <select
                            id="category"
                            name="category"
                            value={values.category}
                            onChange={onChange}
                            required
                        >
                            <option value="">Изберете категория</option>
                            {achievementCategories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="title">Заглавие:</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={values.title}
                            onChange={onChange}
                            required
                            placeholder="Заглавие на постижението"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Описание:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={values.description}
                            onChange={onChange}
                            placeholder="Опишете постижението"
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="date">Дата:</label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={values.date}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="place">Класиране/Резултат:</label>
                        <input
                            type="text"
                            id="place"
                            name="place"
                            value={values.place}
                            onChange={onChange}
                            placeholder="Напр. 1-во място, Златен медал, 95/100 точки"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="issuer">Организатор/Издател:</label>
                        <input
                            type="text"
                            id="issuer"
                            name="issuer"
                            value={values.issuer}
                            onChange={onChange}
                            placeholder="Кой е организаторът на събитието или издателят на сертификата"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">Запази</button>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => setIsAddingAchievement(false)}
                        >
                            Отказ
                        </button>
                    </div>
                </form>
            </section>
        );
    }

    return (
        <section className="achievements-view">
            <div className="achievements-header">
                <h1>Моите постижения</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsAddingAchievement(true)}
                >
                    Добави постижение
                </button>
            </div>

            <div className="achievements-content">
                {achievements.length === 0 ? (
                    <p className="no-data">Нямате добавени постижения.</p>
                ) : (
                    <div className="achievements-list">
                        {achievements.map(achievement => {
                            const category = achievementCategories.find(c => c.id === achievement.category);

                            return (
                                <div key={achievement._id} className="achievement-card">
                                    <div className="achievement-header">
                                        <h2>{achievement.title}</h2>
                                        <div className="achievement-actions">
                                            <button
                                                className="btn delete-btn"
                                                onClick={() => handleDeleteAchievement(achievement._id)}
                                            >
                                                Изтрий
                                            </button>
                                        </div>
                                    </div>

                                    <div className="achievement-body">
                                        <div className="achievement-info">
                                            <span className="category">{category ? category.name : 'Неизвестна категория'}</span>
                                            {achievement.date && (
                                                <span className="date">
                                                    {new Date(achievement.date).toLocaleDateString('bg-BG')}
                                                </span>
                                            )}
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
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}