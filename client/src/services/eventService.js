// client/src/services/eventService.js
import * as request from '../utils/requestUtils.js';

const endpoints = {
    events: '/data/events',
    participations: '/data/eventParticipations',
};

// Получаване на всички събития
export const getAllEvents = async () => {
    try {
        const result = await request.get(endpoints.events);
        return result;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
};

// Получаване на събитие по ID
export const getEvent = async (eventId) => {
    try {
        const result = await request.get(`${endpoints.events}/${eventId}`);
        return result;
    } catch (error) {
        console.error('Error fetching event:', error);
        throw error;
    }
};

// Създаване на ново събитие (за учители и администратори)
export const createEvent = async (eventData) => {
    try {
        const result = await request.post(endpoints.events, eventData);
        return result;
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
};

// Обновяване на събитие (за учители и администратори)
export const updateEvent = async (eventId, eventData) => {
    try {
        const result = await request.put(`${endpoints.events}/${eventId}`, eventData);
        return result;
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
};

// Изтриване на събитие (за учители и администратори)
export const deleteEvent = async (eventId) => {
    try {
        const result = await request.del(`${endpoints.events}/${eventId}`);
        return result;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
};

// Регистриране за участие в събитие
export const participateInEvent = async (eventId, studentId) => {
    try {
        const result = await request.post(endpoints.participations, {
            eventId,
            studentId,
            status: 'registered',
            registrationDate: new Date().toISOString()
        });
        return result;
    } catch (error) {
        console.error('Error participating in event:', error);
        throw error;
    }
};

// Получаване на участия на ученик
export const getStudentParticipations = async (studentId) => {
    try {
        const result = await request.get(`${endpoints.participations}?where=studentId="${studentId}"`);
        return result;
    } catch (error) {
        console.error('Error fetching student participations:', error);
        throw error;
    }
};

// Потвърждаване на участие
export const confirmParticipation = async (participationId) => {
    try {
        const result = await request.patch(`${endpoints.participations}/${participationId}`, {
            status: 'confirmed',
            confirmationDate: new Date().toISOString()
        });
        return result;
    } catch (error) {
        console.error('Error confirming participation:', error);
        throw error;
    }
};

// Изпращане на обратна връзка за събитие
export const submitEventFeedback = async (participationId, feedbackData) => {
    try {
        const result = await request.patch(`${endpoints.participations}/${participationId}/feedback`, {
            feedback: feedbackData,
            feedbackDate: new Date().toISOString()
        });
        return result;
    } catch (error) {
        console.error('Error submitting feedback:', error);
        throw error;
    }
};

// Получаване на участници за събитие (за учители и администратори)
export const getEventParticipants = async (eventId) => {
    try {
        const result = await request.get(`${endpoints.participations}?where=eventId="${eventId}"`);
        return result;
    } catch (error) {
        console.error('Error fetching event participants:', error);
        throw error;
    }
};