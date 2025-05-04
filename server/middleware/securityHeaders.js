// server/middleware/securityHeaders.js
const helmet = require('helmet');

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

// Middleware функция за добавяне на сигурностни хедъри
const securityHeaders = [
    helmet.contentSecurityPolicy(contentSecurityPolicy),
    helmet.xssFilter(),
    helmet.noSniff(),
    helmet.ieNoOpen(),
    helmet.frameguard({ action: 'deny' }),
    helmet.hsts({
        maxAge: 31536000, // 1 година
        includeSubDomains: true,
        preload: true,
    }),
    helmet.referrerPolicy({ policy: 'same-origin' }),
];

module.exports = securityHeaders;