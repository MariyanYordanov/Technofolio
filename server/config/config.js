module.exports = {
    PORT: process.env.PORT || 3030,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/technofolio',
    JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '1d'
};