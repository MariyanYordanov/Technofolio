// server/middleware/xss.js
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Рекурсивно обработване на обекти и масиви
const sanitizeData = (data) => {
    if (typeof data === 'string') {
        return DOMPurify.sanitize(data);
    }

    if (data !== null && typeof data === 'object') {
        if (Array.isArray(data)) {
            return data.map(item => sanitizeData(item));
        }

        const result = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = sanitizeData(value);
        }
        return result;
    }

    return data;
};

// Middleware за XSS защита
const xssMiddleware = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeData(req.body);
    }

    if (req.query) {
        req.query = sanitizeData(req.query);
    }

    if (req.params) {
        req.params = sanitizeData(req.params);
    }

    next();
};

export default xssMiddleware;