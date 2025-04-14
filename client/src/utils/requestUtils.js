// client/src/utils/requestUtils.js
const serverUrl = 'http://localhost:3030';

const defaultHeaders = {
    'Content-Type': 'application/json',
};

function getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
    const contentType = res.headers.get('content-type');
    let errorText = 'Неизвестна грешка';

    if (!res.ok) {
        if (contentType && contentType.includes('application/json')) {
            const errorData = await res.json();
            errorText = errorData.message || JSON.stringify(errorData);
        } else {
            errorText = await res.text();
        }

        if (res.status === 401) {
            localStorage.removeItem('accessToken');
            // Незабавно пренасочване към страницата за вход, ако токенът е изтекъл
            window.location.href = '/login';
        }

        throw new Error(errorText);
    }

    if (contentType && contentType.includes('application/json')) {
        return res.json();
    }

    return res.text(); // fallback за други формати
}

// GET заявка
export async function get(endpoint) {
    const url = `${serverUrl}${endpoint}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            ...defaultHeaders,
            ...getAuthHeaders(),
        },
    });
    return handleResponse(res);
}

// POST заявка
export async function post(endpoint, data) {
    const url = `${serverUrl}${endpoint}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            ...defaultHeaders,
            ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

// PUT заявка
export async function put(endpoint, data) {
    const url = `${serverUrl}${endpoint}`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            ...defaultHeaders,
            ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

// PATCH заявка
export async function patch(endpoint, data) {
    const url = `${serverUrl}${endpoint}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            ...defaultHeaders,
            ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

// DELETE заявка
export async function del(endpoint) {
    const url = `${serverUrl}${endpoint}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers: {
            ...defaultHeaders,
            ...getAuthHeaders(),
        },
    });
    return handleResponse(res);
}

export const requester = {
    get,
    post,
    put,
    patch,
    del,
};

export default requester;