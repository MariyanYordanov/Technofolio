const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGODB_URI);
        console.log('MongoDB свързана успешно');
    } catch (err) {
        console.error('Грешка при свързване с MongoDB', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;