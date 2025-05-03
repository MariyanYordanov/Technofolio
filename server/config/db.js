// server/config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/technofolio';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB свързана успешно: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Грешка при свързване с MongoDB: ${err.message}`);
        process.exit(1);
    }
};

export default connectDB;