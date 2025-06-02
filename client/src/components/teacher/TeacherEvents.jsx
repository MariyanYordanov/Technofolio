// client/src/components/teacher/TeacherEvents.jsx
import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../contexts/AuthContext';
import * as eventService from '../../services/eventService.js';
import useForm from '../../hooks/useForm.js'; 
import useNotifications from '../../hooks/useNotifications.js';
export default function TeacherEvents() {
    const { isAuthenticated, isTeacher } = useContext(AuthContext);
    const { success, error: showError } = useNotifications();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                if (!isAuthenticated || !isTeacher) {
                    setError('Нямате права за достъп до тази страница.');
                    setLoading(false);
                    return;
                }

                setLoading(true);
                const eventsData = await eventService.getAllEvents();
                setEvents(eventsData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching events:', err);
                setError('Грешка при зареждане на събитията.');
                setLoading(false);
            }
        };

        fetchEvents();
    }, [isAuthenticated, isTeacher]);

    const { values, onChange, onSubmit, changeValues } = useForm(async (formValues) => {
        try {
            setLoading(true);

            if (selectedEvent) {
                // Updating existing event
                const updatedEvent = await eventService.updateEvent(selectedEvent._id, formValues);

                setEvents(prevEvents =>
                    prevEvents.map(event =>
                        event._id === updatedEvent._id ? updatedEvent : event
                    )
                );

                success('Събитието е успешно обновено!');
            } else {
                // Creating new event
                const newEvent = await eventService.createEvent(formValues);
                setEvents(prevEvents => [...prevEvents, newEvent]);
                success('Събитието е успешно създадено!');
            }

            setIsCreatingEvent(false);
            setSelectedEvent(null);

            // Reset the form
            changeValues({
                title: '',
                description: '',
                startDate: '',
                endDate: '',
                location: '',
                organizer: '',
                feedbackUrl: ''
            });

            setLoading(false);
        } catch (err) {
            console.error('Error saving event:', err);
            showError(err.message || 'Грешка при записване на събитието.');
            setLoading(false);
        }
    }, {
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        organizer: '',
        feedbackUrl: ''
    });

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setIsCreatingEvent(true);

        // Format dates for input fields
        const formattedStartDate = event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '';
        const formattedEndDate = event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '';

        changeValues({
            title: event.title,
            description: event.description,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            location: event.location,
            organizer: event.organizer,
            feedbackUrl: event.feedbackUrl || ''
        });
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Сигурни ли сте, че искате да изтриете това събитие?')) {
            return;
        }

        try {
            setLoading(true);
            await eventService.deleteEvent(eventId);
            setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
            success('Събитието е успешно изтрито!');
            setLoading(false);
        } catch (err) {
            console.error('Error deleting event:', err);
            showError(err.message || 'Грешка при изтриване на събитието.');
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Зареждане на събития...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (isCreatingEvent) {
        return (
            <section className="event-editor">
                <h1>{selectedEvent ? 'Редактиране на събитие' : 'Създаване на ново събитие'}</h1>

                <form onSubmit={onSubmit} className="event-form">
                    <div className="form-group">
                        <label htmlFor="title">Заглавие:</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={values.title}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Описание:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={values.description}
                            onChange={onChange}
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
                                value={values.startDate}
                                onChange={onChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="endDate">Крайна дата (опционално):</label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={values.endDate}
                                onChange={onChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="location">Място:</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={values.location}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="organizer">Организатор:</label>
                        <input
                            type="text"
                            id="organizer"
                            name="organizer"
                            value={values.organizer}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="feedbackUrl">URL за обратна връзка (опционално):</label>
                        <input
                            type="url"
                            id="feedbackUrl"
                            name="feedbackUrl"
                            value={values.feedbackUrl}
                            onChange={onChange}
                            placeholder="https://example.com/feedback"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                            {selectedEvent ? 'Запази промените' : 'Създай събитие'}
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => {
                                setIsCreatingEvent(false);
                                setSelectedEvent(null);
                            }}
                        >
                            Отказ
                        </button>
                    </div>
                </form>
            </section>
        );
    }

    return (
        <section className="teacher-events-view">
            <div className="events-header">
                <h1>Управление на събития</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsCreatingEvent(true)}
                >
                    Създай ново събитие
                </button>
            </div>

            {events.length === 0 ? (
                <p className="no-data">Няма създадени събития.</p>
            ) : (
                <div className="events-list">
                    {events.map(event => (
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
                                <button
                                    className="btn edit-btn"
                                    onClick={() => handleEditEvent(event)}
                                >
                                    Редактирай
                                </button>
                                <button
                                    className="btn delete-btn"
                                    onClick={() => handleDeleteEvent(event._id)}
                                >
                                    Изтрий
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}