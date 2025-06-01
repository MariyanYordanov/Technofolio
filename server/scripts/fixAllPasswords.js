// server/scripts/fixAllPasswords.js
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function fixAllPasswords() {
    try {
        // Свързване с MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/technofolio');
        console.log('✅ Connected to MongoDB\n');

        // Дефиниране на паролите
        const passwords = {
            'admin@technofolio.bg': 'Admin123!',
            'teacher1@technofolio.bg': 'Teacher123!',
            'teacher2@technofolio.bg': 'Teacher123!',
            'student1@technofolio.bg': 'Student123!',
            'student2@technofolio.bg': 'Student123!',
            'student3@technofolio.bg': 'Student123!'
        };

        console.log('🔄 Updating passwords for all users...\n');

        for (const [email, password] of Object.entries(passwords)) {
            const user = await User.findOne({ email }).select('+password');

            if (user) {
                user.password = password;
                await user.save();
                console.log(`✅ ${email} - password updated`);
            } else {
                console.log(`❌ ${email} - not found`);
            }
        }

        console.log('\n📋 Login credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('АДМИН:');
        console.log('  admin@technofolio.bg / Admin123!');
        console.log('\nУЧИТЕЛИ:');
        console.log('  teacher1@technofolio.bg / Teacher123!');
        console.log('  teacher2@technofolio.bg / Teacher123!');
        console.log('\nУЧЕНИЦИ:');
        console.log('  student1@technofolio.bg / Student123!');
        console.log('  student2@technofolio.bg / Student123!');
        console.log('  student3@technofolio.bg / Student123!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

fixAllPasswords();