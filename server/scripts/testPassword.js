// server/scripts/testPassword.js
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function testPassword() {
    try {
        // Свързване с MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/technofolio');
        console.log('✅ Connected to MongoDB');

        // Намиране на админа
        const admin = await User.findOne({ email: 'admin@technofolio.bg' }).select('+password');

        if (!admin) {
            console.log('❌ Admin not found!');
            process.exit(1);
        }

        console.log('👤 Admin found:', {
            id: admin._id,
            email: admin.email,
            hasPassword: !!admin.password,
            passwordLength: admin.password ? admin.password.length : 0
        });

        // Тест на паролата
        const testPassword = 'Admin123!';
        const isMatch = await bcryptjs.compare(testPassword, admin.password);

        console.log(`🔑 Password test for "${testPassword}":`, isMatch ? '✅ MATCH' : '❌ NO MATCH');

        // Ако не съвпада, нека обновим паролата
        if (!isMatch) {
            console.log('\n🔄 Updating password...');
            admin.password = testPassword;
            await admin.save();
            console.log('✅ Password updated successfully!');

            // Тест отново
            const updatedAdmin = await User.findOne({ email: 'admin@technofolio.bg' }).select('+password');
            const newMatch = await bcryptjs.compare(testPassword, updatedAdmin.password);
            console.log('🔑 New password test:', newMatch ? '✅ MATCH' : '❌ NO MATCH');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

testPassword();