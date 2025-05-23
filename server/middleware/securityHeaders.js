// server/middleware/securityHeaders.js
import { contentSecurityPolicy as _contentSecurityPolicy, xssFilter, noSniff, ieNoOpen, frameguard, hsts, referrerPolicy } from 'helmet';

// Конфигурация на CSP политиката
const contentSecurityPolicy = {
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // В продукция премахни 'unsafe-inline'
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
    },
};

// Middleware функция за добавяне на хедъри за сигурност
const securityHeaders = [
    _contentSecurityPolicy(contentSecurityPolicy),
    xssFilter(),
    noSniff(),
    ieNoOpen(),
    frameguard({ action: 'deny' }),
    hsts({
        maxAge: 31536000, // 1 година
        includeSubDomains: true,
        preload: true,
    }),
    referrerPolicy({ policy: 'same-origin' }),
];

export default securityHeaders;