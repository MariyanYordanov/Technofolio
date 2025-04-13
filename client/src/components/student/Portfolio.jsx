import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import * as studentService from '../../services/studentService';
import useForm from '../../hooks/useForm';

export default function Portfolio() {
    const navigate = useNavigate();
    const { userId, isAuthenticated } = useContext(AuthContext);
    const [portfolio, setPortfolio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [mentor, setMentor] = useState(null);
    const [mentors, setMentors] = useState([]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchPortfolio();
            fetchMentors();
        }
    }, [isAuthenticated, fetchPortfolio, fetchMentors]);

    const fetchMentors = useCallback(async () => {
        try {
            // API повикване за вземане на списъка с ментори
            // Симулирано за момента
            setMentors([
                { _id: '1', name: 'Иван Иванов', specialization: 'Математика' },
                { _id: '2', name: 'Петър Петров', specialization: 'Програмиране' },
                { _id: '3', name: 'Мария Георгиева', specialization: 'Физика' },
            ]);
        } catch (err) {
            console.log(err);
        }
    }, []);

    const fetchPortfolio = useCallback(async () => {
        try {
            setLoading(true);
            const studentProfile = await studentService.getStudentProfile(userId);

            if (!studentProfile) {
                navigate('/profile');
                return;
            }

            const portfolioData = await studentService.getStudentPortfolio(studentProfile._id);
            setPortfolio(portfolioData);

            if (portfolioData && portfolioData.mentorId) {
                const mentorData = await studentService.getMentorById(portfolioData.mentorId);
                setMentor(mentorData);
            }

            setLoading(false);
        } catch (err) {
            console.log(err);
            setError('Грешка при зареждане на портфолиото.');
            setLoading(false);
        }
    }, [userId, navigate]);

    const { values, onChange, onSubmit, changeValues } = useForm(async (formValues) => {
        try {
            setLoading(true);
            const studentProfile = await studentService.getStudentProfile(userId);

            const updatedPortfolio = await studentService.updatePortfolio(studentProfile._id, formValues);
            setPortfolio(updatedPortfolio);

            if (updatedPortfolio.mentorId) {
                const mentorData = await studentService.getMentorById(updatedPortfolio.mentorId);
                setMentor(mentorData);
            }

            setIsEditing(false);
            setLoading(false);
        } catch (err) {
            console.log(err);
            setError('Грешка при обновяване на портфолиото.');
            setLoading(false);
        }
    }, portfolio || {
        experience: '',
        projects: '',
        mentorId: '',
    });

    const handleEdit = () => {
        setIsEditing(true);
        changeValues(portfolio);
    };

    const cancelEdit = () => {
        setIsEditing(false);
    };

    if (loading) {
        return <div className="loading">Зареждане на портфолиото...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!portfolio) {
        return (
            <div className="portfolio-empty">
                <h1>Моето портфолио</h1>
                <p>Все още нямате създадено портфолио.</p>
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Създай портфолио</button>
            </div>
        );
    }

    if (isEditing) {
        return (
            <section className="portfolio-edit">
                <h1>Редактиране на портфолио</h1>
                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="experience">Професионален опит:</label>
                        <textarea
                            id="experience"
                            name="experience"
                            value={values.experience}
                            onChange={onChange}
                            placeholder="Опишете вашия професионален опит..."
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="projects">Ключови проекти и продукти:</label>
                        <textarea
                            id="projects"
                            name="projects"
                            value={values.projects}
                            onChange={onChange}
                            placeholder="Опишете важни проекти, продукти, прототипи..."
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="mentorId">Ментор:</label>
                        <select
                            id="mentorId"
                            name="mentorId"
                            value={values.mentorId}
                            onChange={onChange}
                        >
                            <option value="">Изберете ментор</option>
                            {mentors.map(mentor => (
                                <option key={mentor._id} value={mentor._id}>
                                    {mentor.name} - {mentor.specialization}
                                </option>
                            ))}
                        </select>
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
        <section className="portfolio-view">
            <div className="portfolio-header">
                <h1>Моето портфолио</h1>
                <button className="btn edit-btn" onClick={handleEdit}>Редактирай</button>
            </div>

            <div className="portfolio-content">
                <div className="portfolio-section">
                    <h2>Професионален опит</h2>
                    <p>{portfolio.experience}</p>
                </div>

                <div className="portfolio-section">
                    <h2>Ключови проекти и продукти</h2>
                    <p>{portfolio.projects}</p>
                </div>

                {mentor && (
                    <div className="portfolio-section">
                        <h2>Ментор</h2>
                        <div className="mentor-info">
                            <p className="mentor-name">{mentor.name}</p>
                            <p className="mentor-specialization">{mentor.specialization}</p>
                        </div>
                    </div>
                )}

                <div className="portfolio-section">
                    <h2>Препоръки</h2>
                    {portfolio.recommendations && portfolio.recommendations.length > 0 ? (
                        <div className="recommendations-list">
                            {portfolio.recommendations.map((recommendation, index) => (
                                <div key={index} className="recommendation-item">
                                    <p className="recommendation-text">"{recommendation.text}"</p>
                                    <p className="recommendation-author">- {recommendation.author}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Все още нямате препоръки.</p>
                    )}
                </div>
            </div>
        </section>
    );
}