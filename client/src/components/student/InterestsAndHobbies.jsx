import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import * as studentService from '../../services/studentService';
import useForm from '../../hooks/useForm';

export default function InterestsAndHobbies() {
    const navigate = useNavigate();
    const { userId, isAuthenticated } = useContext(AuthContext);
    const [interests, setInterests] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const interestCategories = [
        { id: 'tech', name: 'Технологии', subcategories: ['Програмиране', 'Роботика', 'Изкуствен интелект', 'Електроника', 'Компютърни игри'] },
        { id: 'science', name: 'Наука', subcategories: ['Физика', 'Химия', 'Биология', 'Математика', 'Астрономия'] },
        { id: 'arts', name: 'Изкуство', subcategories: ['Рисуване', 'Музика', 'Танци', 'Фотография', 'Кино'] },
        { id: 'sports', name: 'Спорт', subcategories: ['Футбол', 'Баскетбол', 'Волейбол', 'Плуване', 'Бягане', 'Йога'] },
        { id: 'literature', name: 'Литература', subcategories: ['Четене', 'Писане', 'Поезия'] },
        { id: 'other', name: 'Други', subcategories: [] }
    ];

    const fetchInterests = useCallback(async () => {
        try {
            setLoading(true);
            const studentProfile = await studentService.getStudentProfile(userId);

            if (!studentProfile) {
                navigate('/profile');
                return;
            }

            const interestsData = await studentService.getStudentInterests(studentProfile._id);
            setInterests(interestsData || { interests: [], hobbies: [] });
            setLoading(false);
        } catch (err) {
            console.log(err);
            setError('Грешка при зареждане на интересите.');
            setLoading(false);
        }
    }, [userId, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchInterests();
        }
    }, [isAuthenticated, fetchInterests]);

    const { values, onSubmit, changeValues } = useForm(async (formValues) => {
        try {
            setLoading(true);
            const studentProfile = await studentService.getStudentProfile(userId);

            const updatedInterests = await studentService.updateInterests(studentProfile._id, formValues);
            setInterests(updatedInterests);

            setIsEditing(false);
            setLoading(false);
        } catch (err) {
            console.log(err);
            setError('Грешка при обновяване на интересите.');
            setLoading(false);
        }
    }, interests || { interests: [], hobbies: [] });

    const handleEdit = () => {
        setIsEditing(true);
        changeValues(interests);
    };

    const cancelEdit = () => {
        setIsEditing(false);
    };

    const handleInterestChange = (e) => {
        const { name, checked } = e.target;
        const [category, subcategory] = name.split('_');

        changeValues(prevValues => {
            const updatedInterests = [...prevValues.interests];

            if (checked) {
                updatedInterests.push({ category, subcategory });
            } else {
                const index = updatedInterests.findIndex(
                    interest => interest.category === category && interest.subcategory === subcategory
                );
                if (index !== -1) {
                    updatedInterests.splice(index, 1);
                }
            }

            return {
                ...prevValues,
                interests: updatedInterests
            };
        });
    };

    const handleHobbyChange = (e) => {
        const { name, value } = e.target;
        const index = parseInt(name.split('_')[1]);

        changeValues(prevValues => {
            const updatedHobbies = [...prevValues.hobbies];
            updatedHobbies[index] = value;

            return {
                ...prevValues,
                hobbies: updatedHobbies
            };
        });
    };

    const addHobby = () => {
        changeValues(prevValues => ({
            ...prevValues,
            hobbies: [...prevValues.hobbies, '']
        }));
    };

    const removeHobby = (index) => {
        changeValues(prevValues => {
            const updatedHobbies = [...prevValues.hobbies];
            updatedHobbies.splice(index, 1);

            return {
                ...prevValues,
                hobbies: updatedHobbies
            };
        });
    };

    if (loading) {
        return <div className="loading">Зареждане на интереси и хобита...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (isEditing) {
        return (
            <section className="interests-edit">
                <h1>Редактиране на интереси и хобита</h1>

                <form onSubmit={onSubmit}>
                    <div className="interests-section">
                        <h2>Интереси</h2>
                        <p className="subtitle">Изберете областите, които ви интересуват:</p>

                        <div className="categories-container">
                            {interestCategories.map(category => (
                                <div key={category.id} className="category-group">
                                    <h3>{category.name}</h3>
                                    <div className="subcategories">
                                        {category.subcategories.map(subcategory => {
                                            const isChecked = values.interests.some(
                                                interest => interest.category === category.id && interest.subcategory === subcategory
                                            );

                                            return (
                                                <div key={`${category.id}_${subcategory}`} className="checkbox-item">
                                                    <input
                                                        type="checkbox"
                                                        id={`${category.id}_${subcategory}`}
                                                        name={`${category.id}_${subcategory}`}
                                                        checked={isChecked}
                                                        onChange={handleInterestChange}
                                                    />
                                                    <label htmlFor={`${category.id}_${subcategory}`}>{subcategory}</label>
                                                </div>
                                            );
                                        })}

                                        {category.id === 'other' && (
                                            <div className="other-interest">
                                                <input
                                                    type="text"
                                                    placeholder="Друг интерес..."
                                                    className="other-input"
                                                />
                                                <button type="button" className="btn add-btn">Добави</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hobbies-section">
                        <h2>Хобита</h2>
                        <p className="subtitle">Добавете вашите хобита и развитите умения:</p>

                        {values.hobbies.map((hobby, index) => (
                            <div key={index} className="hobby-input-group">
                                <input
                                    type="text"
                                    name={`hobby_${index}`}
                                    value={hobby}
                                    onChange={handleHobbyChange}
                                    placeholder="Опишете вашето хоби..."
                                />
                                <button
                                    type="button"
                                    className="btn remove-btn"
                                    onClick={() => removeHobby(index)}
                                >
                                    Премахни
                                </button>
                            </div>
                        ))}

                        <button type="button" className="btn add-hobby-btn" onClick={addHobby}>
                            Добави хоби
                        </button>
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
        <section className="interests-view">
            <div className="interests-header">
                <h1>Моите интереси и хобита</h1>
                <button className="btn edit-btn" onClick={handleEdit}>Редактирай</button>
            </div>

            <div className="interests-content">
                <div className="interests-section">
                    <h2>Интереси</h2>

                    {interests.interests && interests.interests.length > 0 ? (
                        <div className="interests-list">
                            {interestCategories.map(category => {
                                const categoryInterests = interests.interests.filter(
                                    interest => interest.category === category.id
                                );

                                if (categoryInterests.length === 0) return null;

                                return (
                                    <div key={category.id} className="interest-category">
                                        <h3>{category.name}</h3>
                                        <ul>
                                            {categoryInterests.map((interest, index) => (
                                                <li key={index}>{interest.subcategory}</li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="no-data">Няма добавени интереси.</p>
                    )}
                </div>

                <div className="hobbies-section">
                    <h2>Хобита</h2>

                    {interests.hobbies && interests.hobbies.length > 0 ? (
                        <ul className="hobbies-list">
                            {interests.hobbies.map((hobby, index) => (
                                <li key={index}>{hobby}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="no-data">Няма добавени хобита.</p>
                    )}
                </div>
            </div>
        </section>
    );
}
