// server/scripts/seed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';

// Модели
import User from '../models/User.js';
import CreditCategory from '../models/CreditCategory.js';
import Event from '../models/Event.js';

// Конфигурация
dotenv.config();

// Свързване с базата данни
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/technofolio');
        console.log('✅ MongoDB свързана успешно');
    } catch (err) {
        console.error('❌ Грешка при свързване с MongoDB:', err.message);
        process.exit(1);
    }
};

// Seed данни
const seedData = async () => {
    try {
        console.log('🌱 Започване на seed процеса...');

        // Изчистване на съществуващи данни (опционално)
        const clearData = process.argv.includes('--clear');
        if (clearData) {
            console.log('🗑️  Изтриване на съществуващи данни...');
            await User.deleteMany({});
            await CreditCategory.deleteMany({});
            await Event.deleteMany({});
            console.log('✅ Данните са изтрити');
        }

        // 1. Създаване на администратор
        const adminExists = await User.findOne({ email: 'admin@technofolio.bg' });
        if (!adminExists) {
            const adminPassword = await bcryptjs.hash('Admin123!', 10);
            const admin = await User.create({
                email: 'admin@technofolio.bg',
                password: adminPassword,
                firstName: 'Админ',
                lastName: 'Администраторов',
                role: 'admin',
                emailConfirmed: true
            });
            console.log('✅ Администратор създаден:', admin.email);
        } else {
            console.log('ℹ️  Администраторът вече съществува');
        }

        // 2. Създаване на учители
        const teachers = [
            {
                email: 'teacher1@technofolio.bg',
                firstName: 'Мария',
                lastName: 'Иванова',
                subjects: ['Математика', 'Информатика'],
                qualification: 'Магистър по математика',
                yearsOfExperience: 10
            },
            {
                email: 'teacher2@technofolio.bg',
                firstName: 'Георги',
                lastName: 'Петров',
                subjects: ['Физика', 'Астрономия'],
                qualification: 'Магистър по физика',
                yearsOfExperience: 15
            }
        ];

        for (const teacherData of teachers) {
            const exists = await User.findOne({ email: teacherData.email });
            if (!exists) {
                const password = await bcryptjs.hash('Teacher123!', 10);
                await User.create({
                    email: teacherData.email,
                    password: password,
                    firstName: teacherData.firstName,
                    lastName: teacherData.lastName,
                    role: 'teacher',
                    emailConfirmed: true,
                    teacherInfo: {
                        subjects: teacherData.subjects,
                        qualification: teacherData.qualification,
                        yearsOfExperience: teacherData.yearsOfExperience
                    }
                });
                console.log('✅ Учител създаден:', teacherData.email);
            }
        }

        // 3. Създаване на ученици
        const students = [
            {
                email: 'student1@technofolio.bg',
                firstName: 'Иван',
                lastName: 'Димитров',
                grade: '10',
                specialization: 'Софтуерни и хардуерни науки',
                averageGrade: 5.50
            },
            {
                email: 'student2@technofolio.bg',
                firstName: 'Елена',
                lastName: 'Стоянова',
                grade: '11',
                specialization: 'Софтуерни и хардуерни науки',
                averageGrade: 5.80
            },
            {
                email: 'student3@technofolio.bg',
                firstName: 'Петър',
                lastName: 'Георгиев',
                grade: '9',
                specialization: 'Предприемачество и бизнес',
                averageGrade: 5.20
            }
        ];

        for (const studentData of students) {
            const exists = await User.findOne({ email: studentData.email });
            if (!exists) {
                const password = await bcryptjs.hash('Student123!', 10);
                await User.create({
                    email: studentData.email,
                    password: password,
                    firstName: studentData.firstName,
                    lastName: studentData.lastName,
                    role: 'student',
                    emailConfirmed: true,
                    studentInfo: {
                        grade: studentData.grade,
                        specialization: studentData.specialization,
                        averageGrade: studentData.averageGrade
                    }
                });
                console.log('✅ Ученик създаден:', studentData.email);
            }
        }

        // 4. Създаване на категории за кредити
        const creditCategories = [
            // Аз и другите
            { pillar: 'Аз и другите', name: 'Доброволчество', description: 'Участие в доброволчески инициативи' },
            { pillar: 'Аз и другите', name: 'Социални проекти', description: 'Организиране и участие в социални проекти' },
            { pillar: 'Аз и другите', name: 'Менторство', description: 'Подпомагане на по-малки ученици' },
            { pillar: 'Аз и другите', name: 'Училищни инициативи', description: 'Участие в училищни мероприятия' },

            // Мислене
            { pillar: 'Мислене', name: 'Олимпиади', description: 'Участие в олимпиади и състезания' },
            { pillar: 'Мислене', name: 'Научни проекти', description: 'Разработване на научни проекти' },
            { pillar: 'Мислене', name: 'Дебати', description: 'Участие в дебати и дискусии' },
            { pillar: 'Мислене', name: 'Творчески проекти', description: 'Създаване на иновативни решения' },

            // Професия
            { pillar: 'Професия', name: 'Стажове', description: 'Участие в стажантски програми' },
            { pillar: 'Професия', name: 'Практики', description: 'Професионални практики във фирми' },
            { pillar: 'Професия', name: 'Сертификати', description: 'Получаване на професионални сертификати' },
            { pillar: 'Професия', name: 'Проектна работа', description: 'Работа по реални проекти' }
        ];

        for (const category of creditCategories) {
            const exists = await CreditCategory.findOne({
                pillar: category.pillar,
                name: category.name
            });
            if (!exists) {
                await CreditCategory.create(category);
                console.log(`✅ Категория създадена: ${category.pillar} - ${category.name}`);
            }
        }

        // 5. Създаване на събития
        const teacher = await User.findOne({ role: 'teacher' });
        if (teacher) {
            const events = [
                {
                    title: 'Ден на отворените врати',
                    description: 'Представяне на училището пред бъдещи ученици и техните родители. Демонстрации, презентации и срещи с учители.',
                    startDate: new Date('2025-03-15T10:00:00'),
                    endDate: new Date('2025-03-15T16:00:00'),
                    location: 'НПМГ "Акад. Любомир Чакалов"',
                    organizer: 'Училищно ръководство',
                    createdBy: teacher._id
                },
                {
                    title: 'Хакатон "Иновации в образованието"',
                    description: '24-часово състезание по програмиране и създаване на образователни решения.',
                    startDate: new Date('2025-04-20T09:00:00'),
                    endDate: new Date('2025-04-21T15:00:00'),
                    location: 'Компютърни зали',
                    organizer: 'Клуб по програмиране',
                    createdBy: teacher._id
                },
                {
                    title: 'Кариерен форум',
                    description: 'Среща с представители на IT компании и университети.',
                    startDate: new Date('2025-05-10T13:00:00'),
                    location: 'Актова зала',
                    organizer: 'Кариерен център',
                    createdBy: teacher._id
                }
            ];

            for (const eventData of events) {
                const exists = await Event.findOne({ title: eventData.title });
                if (!exists) {
                    await Event.create(eventData);
                    console.log('✅ Събитие създадено:', eventData.title);
                }
            }
        }

        console.log('\n🎉 Seed процесът завърши успешно!');
        console.log('\n📝 Данни за вход:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Администратор: admin@technofolio.bg / Admin123!');
        console.log('Учител: teacher1@technofolio.bg / Teacher123!');
        console.log('Ученик: student1@technofolio.bg / Student123!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Грешка при seed процеса:', error);
        process.exit(1);
    }
};

// Изпълнение
const runSeed = async () => {
    await connectDB();
    await seedData();
    await mongoose.connection.close();
    console.log('\n✅ Връзката с базата данни е затворена');
    process.exit(0);
};

// Стартиране
runSeed();