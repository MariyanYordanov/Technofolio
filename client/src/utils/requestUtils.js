const defaultHeaders = {
    'Content-Type': 'application/json',
};

// Optional: include a bearer token if available
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

        throw new Error(errorText);
    }

    if (contentType && contentType.includes('application/json')) {
        return res.json();
    }

    return res.text(); // fallback
}

// GET
export async function get(url) {
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            ...defaultHeaders,
            ...getAuthHeaders(),
        },
    });
    return handleResponse(res);
}

// POST
export async function post(url, data) {
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

// PUT
export async function put(url, data) {
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

// PATCH
export async function patch(url, data) {
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

// DELETE
export async function del(url) {
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
