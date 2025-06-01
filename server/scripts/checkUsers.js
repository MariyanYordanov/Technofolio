// server/scripts/checkUsers.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function checkUsers() {
    try {
        // Свързване с MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/technofolio');
        console.log('✅ Connected to MongoDB\n');

        // Намиране на всички потребители
        const users = await User.find({}).select('email firstName lastName role createdAt');

        console.log(`📊 Общо потребители: ${users.length}\n`);

        // Групиране по роля
        const admins = users.filter(u => u.role === 'admin');
        const teachers = users.filter(u => u.role === 'teacher');
        const students = users.filter(u => u.role === 'student');

        console.log('👨‍💼 Администратори:', admins.length);
        admins.forEach(admin => {
            console.log(`   - ${admin.email} (${admin.firstName} ${admin.lastName})`);
        });

        console.log('\n👨‍🏫 Учители:', teachers.length);
        teachers.forEach(teacher => {
            console.log(`   - ${teacher.email} (${teacher.firstName} ${teacher.lastName})`);
        });

        console.log('\n👨‍🎓 Ученици:', students.length);
        students.forEach(student => {
            console.log(`   - ${student.email} (${student.firstName} ${student.lastName})`);
        });

        // Проверка за конкретния учител
        console.log('\n🔍 Търсене на teacher1@technofolio.bg...');
        const teacher1 = await User.findOne({ email: 'teacher1@technofolio.bg' });
        if (teacher1) {
            console.log('✅ Намерен!');
        } else {
            console.log('❌ Не е намерен! Трябва да изпълниш seed скрипта.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

checkUsers();