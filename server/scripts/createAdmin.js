// server/scripts/createAdmin.js
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function createAdmin() {
    try {
        // Свързване с MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/technofolio');
        console.log('✅ Connected to MongoDB');

        // Проверка за съществуващ админ
        const existingAdmin = await User.findOne({ email: 'admin@technofolio.bg' });
        if (existingAdmin) {
            console.log('❌ Admin already exists!');
            console.log('Details:', {
                id: existingAdmin._id,
                email: existingAdmin.email,
                role: existingAdmin.role,
                firstName: existingAdmin.firstName,
                lastName: existingAdmin.lastName
            });
            process.exit(0);
        }

        // Хеширане на паролата
        const hashedPassword = await bcryptjs.hash('Admin123!', 10);

        // Създаване на админ
        const admin = new User({
            email: 'admin@technofolio.bg',
            password: hashedPassword,
            firstName: 'Админ',
            lastName: 'Администраторов',
            role: 'admin',
            emailConfirmed: true
        });

        await admin.save();
        console.log('✅ Admin created successfully!');
        console.log('Email: admin@technofolio.bg');
        console.log('Password: Admin123!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

createAdmin();