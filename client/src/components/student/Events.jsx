import { useContext, useEffect, useState, useCallback } from 'react';
import AuthContext from '../../contexts/AuthContext.jsx';
import * as eventService from '../../services/eventService.js';

export default function Events() {
    const { userId, isAuthenticated } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [participations, setParticipations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming');

    // Debug logging
    console.log('Events component - userId:', userId);
    console.log('Events component - isAuthenticated:', isAuthenticated);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const eventsData = await eventService.getAllEvents();
            setEvents(eventsData);
            setLoading(false);
        } catch (err) {
            console.log(err);
            setError('Грешка при зареждане на събитията.');
            setLoading(false);
        }
    }, []);

    const fetchParticipations = useCallback(async () => {
        if (!userId) {
            console.log('No userId available, skipping participations fetch');
            return;
        }

        try {
            const participationsData = await eventService.getStudentParticipations(userId);
            setParticipations(participationsData);
        } catch (err) {
            console.log(err);
        }
    }, [userId]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchEvents();
            if (userId) {
                fetchParticipations();
            }
        }
    }, [isAuthenticated, userId, fetchEvents, fetchParticipations]);

    const handleParticipate = async (eventId) => {
        console.log('handleParticipate - userId:', userId); // Debug log
        console.log('handleParticipate - isAuthenticated:', isAuthenticated); // Debug log

        if (!userId) {
            alert('Моля, влезте в системата за да се регистрирате за събитие.');
            return;
        }

        try {
            await eventService.participateInEvent(eventId);
            await fetchParticipations();
            alert('Успешно се регистрирахте за събитието!');
        } catch (err) {
            console.log(err);
            if (err.message && err.message.includes('Вече сте регистрирани')) {
                alert('Вече сте регистрирани за това събитие.');
            } else {
                alert('Грешка при регистрация за събитието.');
            }
        }
    };

    const handleConfirmParticipation = async (participationId) => {
        try {
            await eventService.confirmParticipation(participationId);
            fetchParticipations();
        } catch (err) {
            console.log(err);
            alert('Грешка при потвърждаване на участието.');
        }
    };

    const isRegistered = (eventId) => {
        return participations.some(p => p.event === eventId);
    };

    const getParticipationStatus = (eventId) => {
        const participation = participations.find(p => p.event === eventId);
        return participation ? participation.status : null;
    };

    const getParticipationId = (eventId) => {
        const participation = participations.find(p => p.event === eventId);
        return participation ? participation.id : null;
    };

    if (loading) {
        return <div className="loading">Зареждане на събития...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    const now = new Date();
    const upcomingEvents = events.filter(event => new Date(event.startDate) > now);
    const pastEvents = events.filter(event => new Date(event.startDate) <= now);
    const myEvents = events.filter(event => isRegistered(event.id));

    return (
        <section className="events-view">
            <h1>Събития</h1>

            <div className="events-tabs">
                <button
                    className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    Предстоящи събития
                </button>
                <button
                    className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my')}
                >
                    Моите събития
                </button>
                <button
                    className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                    onClick={() => setActiveTab('past')}
                >
                    Минали събития
                </button>
            </div>

            <div className="events-content">
                {activeTab === 'upcoming' && (
                    <div className="events-list">
                        {upcomingEvents.length === 0 ? (
                            <p className="no-events">Няма предстоящи събития.</p>
                        ) : (
                            upcomingEvents.map(event => (
                                <div key={event._id} className="event-card">
                                    <div className="event-header">
                                        <h2>{event.title}</h2>
                                        <div className="event-date">
                                            {new Date(event.startDate).toLocaleDateString('bg-BG', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    <div className="event-body">
                                        <p className="event-description">{event.description}</p>

                                        <div className="event-details">
                                            <div className="event-location">
                                                <strong>Място:</strong> {event.location}
                                            </div>
                                            <div className="event-organizer">
                                                <strong>Организатор:</strong> {event.organizer}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="event-footer">
                                        {!isRegistered(event._id) ? (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleParticipate(event._id)}
                                            >
                                                Ще участвам
                                            </button>
                                        ) : (
                                            <div className="participation-status">
                                                {getParticipationStatus(event._id) === 'registered' ? (
                                                    <span className="status-registered">Регистриран/а сте за това събитие</span>
                                                ) : (
                                                    <span className="status-confirmed">Потвърдено участие</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'my' && (
                    <div className="events-list">
                        {myEvents.length === 0 ? (
                            <p className="no-events">Не сте регистрирани за събития.</p>
                        ) : (
                            myEvents.map(event => (
                                <div key={event._id} className="event-card">
                                    <div className="event-header">
                                        <h2>{event.title}</h2>
                                        <div className="event-date">
                                            {new Date(event.startDate).toLocaleDateString('bg-BG', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    <div className="event-body">
                                        <p className="event-description">{event.description}</p>

                                        <div className="event-details">
                                            <div className="event-location">
                                                <strong>Място:</strong> {event.location}
                                            </div>
                                            <div className="event-organizer">
                                                <strong>Организатор:</strong> {event.organizer}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="event-footer">
                                        <div className="participation-status">
                                            {getParticipationStatus(event._id) === 'registered' ? (
                                                <>
                                                    <span className="status-registered">Регистриран/а сте за това събитие</span>
                                                    {new Date(event.startDate) < now && (
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => handleConfirmParticipation(getParticipationId(event._id))}
                                                        >
                                                            Потвърди участие
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="status-confirmed">Потвърдено участие</span>
                                            )}
                                        </div>

                                        {event.feedbackUrl && getParticipationStatus(event._id) === 'confirmed' && (
                                            <a
                                                href={event.feedbackUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn feedback-btn"
                                            >
                                                Обратна връзка
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'past' && (
                    <div className="events-list">
                        {pastEvents.length === 0 ? (
                            <p className="no-events">Няма минали събития.</p>
                        ) : (
                            pastEvents.map(event => (
                                <div key={event._id} className="event-card past-event">
                                    <div className="event-header">
                                        <h2>{event.title}</h2>
                                        <div className="event-date">
                                            {new Date(event.startDate).toLocaleDateString('bg-BG', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>

                                    <div className="event-body">
                                        <p className="event-description">{event.description}</p>

                                        <div className="event-details">
                                            <div className="event-location">
                                                <strong>Място:</strong> {event.location}
                                            </div>
                                            <div className="event-organizer">
                                                <strong>Организатор:</strong> {event.organizer}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="event-footer">
                                        {isRegistered(event._id) && (
                                            <div className="participation-status">
                                                {getParticipationStatus(event._id) === 'registered' ? (
                                                    <>
                                                        <span className="status-registered">Регистриран/а сте за това събитие</span>
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => handleConfirmParticipation(getParticipationId(event._id))}
                                                        >
                                                            Потвърди участие
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="status-confirmed">Потвърдено участие</span>
                                                )}
                                            </div>
                                        )}

                                        {event.feedbackUrl && isRegistered(event._id) && getParticipationStatus(event._id) === 'confirmed' && (
                                            <a
                                                href={event.feedbackUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn feedback-btn"
                                            >
                                                Обратна връзка
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}