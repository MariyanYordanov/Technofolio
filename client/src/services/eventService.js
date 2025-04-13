import * as request from '../lib/request';

const baseUrl = 'http://localhost:3030/data/events';
const participationsUrl = 'http://localhost:3030/data/eventParticipations';

export const getAllEvents = async () => {
    const result = await request.get(baseUrl);

    return result;
};

export const getEvent = async (eventId) => {
    const result = await request.get(`${baseUrl}/${eventId}`);

    return result;
};

export const createEvent = async (eventData) => {
    const result = await request.post(baseUrl, eventData);

    return result;
};

export const updateEvent = async (eventId, eventData) => {
    const result = await request.put(`${baseUrl}/${eventId}`, eventData);

    return result;
};

export const deleteEvent = async (eventId) => {
    const result = await request.remove(`${baseUrl}/${eventId}`);

    return result;
};

export const participateInEvent = async (eventId, studentId) => {
    const result = await request.post(participationsUrl, {
        eventId,
        studentId,
        status: 'registered',
    });

    return result;
};

export const getStudentParticipations = async (studentId) => {
    const query = new URLSearchParams({
        where: `studentId="${studentId}"`,
    });

    const result = await request.get(`${participationsUrl}?${query}`);

    return result;
};

export const confirmParticipation = async (participationId) => {
    const result = await request.patch(`${participationsUrl}/${participationId}`, {
        status: 'confirmed'
    });

    return result;
};