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
            try {
                const errorData = await res.json();
                errorText = errorData.message || JSON.stringify(errorData);
            } catch (e) {
                errorText = `Грешка при обработка на отговора: ${e.message}`;
            }
        } else {
            try {
                errorText = await res.text();
            } catch (e) {
                errorText = `Грешка при четене на отговора: ${e.message}`;
            }
        }

        if (res.status === 401) {
            // При 401 изчистваме токена, но не презареждаме страницата директно
            // Това ще позволи на AuthContext да се справи с пренасочването
            localStorage.removeItem('accessToken');
        }

        const error = new Error(errorText);
        error.status = res.status;
        throw error;
    }

    // Успешен отговор
    if (contentType && contentType.includes('application/json')) {
        try {
            return res.json();
        } catch (e) {
            throw new Error(`Грешка при парсване на JSON: ${e.message}`);
        }
    }

    return res.text(); // fallback за други формати
}

// GET заявка
export async function get(endpoint) {
    try {
        const url = `${serverUrl}${endpoint}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                ...defaultHeaders,
                ...getAuthHeaders(),
            },
        });
        return handleResponse(res);
    } catch (error) {
        console.error(`GET error for ${endpoint}:`, error);
        throw error;
    }
}

// POST заявка
export async function post(endpoint, data) {
    try {
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
    } catch (error) {
        console.error(`POST error for ${endpoint}:`, error);
        throw error;
    }
}

// PUT заявка
export async function put(endpoint, data) {
    try {
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
    } catch (error) {
        console.error(`PUT error for ${endpoint}:`, error);
        throw error;
    }
}

// PATCH заявка
export async function patch(endpoint, data) {
    try {
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
    } catch (error) {
        console.error(`PATCH error for ${endpoint}:`, error);
        throw error;
    }
}

// DELETE заявка
export async function del(endpoint) {
    try {
        const url = `${serverUrl}${endpoint}`;
        const res = await fetch(url, {
            method: 'DELETE',
            headers: {
                ...defaultHeaders,
                ...getAuthHeaders(),
            },
        });
        return handleResponse(res);
    } catch (error) {
        console.error(`DELETE error for ${endpoint}:`, error);
        throw error;
    }
}

export const requester = {
    get,
    post,
    put,
    patch,
    del,
};

export default requester;