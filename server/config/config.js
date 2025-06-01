// server/config/config.js
import dotenv from 'dotenv';

dotenv.config();

const config = {
    PORT: process.env.PORT || 3030,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/technofolio',
    JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '15m',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key',
    REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE || '7d',
    NODE_ENV: process.env.NODE_ENV || 'development'
};

export default config;