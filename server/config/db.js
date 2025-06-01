// server/config/db.js
import mongoose from 'mongoose';
import config from './config.js';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB е свързана успешно: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Грешка при свързване с MongoDB: ${err.message}`);
        process.exit(1);
    }
};

export default connectDB;