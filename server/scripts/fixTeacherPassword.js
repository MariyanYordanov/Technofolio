// server/scripts/fixTeacherPassword.js
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function fixTeacherPassword() {
    try {
        // Свързване с MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/technofolio');
        console.log('✅ Connected to MongoDB');

        // Намиране на учителя
        const teacher = await User.findOne({ email: 'teacher1@technofolio.bg' }).select('+password');

        if (!teacher) {
            console.log('❌ Teacher not found!');
            process.exit(1);
        }

        console.log('👨‍🏫 Teacher found:', {
            id: teacher._id,
            email: teacher.email,
            name: `${teacher.firstName} ${teacher.lastName}`
        });

        // Обновяване на паролата
        console.log('\n🔄 Updating password to "Teacher123!"...');
        teacher.password = 'Teacher123!';
        await teacher.save();

        // Тест на новата парола
        const updatedTeacher = await User.findOne({ email: 'teacher1@technofolio.bg' }).select('+password');
        const isMatch = await bcryptjs.compare('Teacher123!', updatedTeacher.password);

        console.log('✅ Password updated successfully!');
        console.log('🔑 Password test:', isMatch ? '✅ MATCH' : '❌ NO MATCH');

        console.log('\n📝 Login credentials:');
        console.log('Email: teacher1@technofolio.bg');
        console.log('Password: Teacher123!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

fixTeacherPassword();