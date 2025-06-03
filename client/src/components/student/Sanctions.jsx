import { useContext, useEffect, useState, useCallback } from 'react';
import AuthContext from '../../contexts/AuthContext.jsx';
import * as studentService from '../../services/studentService.js';

export default function Sanctions() {
    const { userId, isAuthenticated } = useContext(AuthContext);
    const [sanctions, setSanctions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSanctions = useCallback(async () => {
        try {
            setLoading(true);

            // Директно използваме userId
            const sanctionsData = await studentService.getStudentSanctions(userId);
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
            console.log(err);
            setError('Грешка при зареждане на забележките.');
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isAuthenticated && userId) {
            fetchSanctions();
        }
    }, [isAuthenticated, userId, fetchSanctions]);

    if (loading) {
        return <div className="loading">Зареждане на забележки и санкции...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!sanctions) {
        return <div className="error">Няма информация за забележки и санкции.</div>;
    }

    return (
        <section className="sanctions-view">
            <h1>Забележки и санкции</h1>

            <div className="sanctions-container">
                <div className="absences-section">
                    <h2>Отсъствия</h2>

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
                </div>

                <div className="schoolo-remarks-section">
                    <h2>Забележки в Школо</h2>

                    <div className="schoolo-data">
                        <div className="schoolo-count">
                            <span className="count-label">Брой забележки:</span>
                            <span className="count-value">{sanctions.schooloRemarks}</span>
                        </div>
                    </div>
                </div>

                <div className="active-sanctions-section">
                    <h2>Активни санкции</h2>

                    {sanctions.activeSanctions.length === 0 ? (
                        <p className="no-sanctions">Нямате активни санкции.</p>
                    ) : (
                        <div className="sanctions-list">
                            {sanctions.activeSanctions.map((sanction, index) => (
                                <div key={index} className="sanction-item">
                                    <div className="sanction-type">{sanction.type}</div>
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
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}