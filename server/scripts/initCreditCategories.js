// server/scripts/initCreditCategories.js
import mongoose from 'mongoose';
import CreditCategory from '../models/CreditCategory.js';
import dotenv from 'dotenv';

dotenv.config();

const categories = [
    // Аз и другите
    {
        pillar: 'Аз и другите',
        name: 'Ученически парламент',
        description: 'Участие в ученическото самоуправление'
    },
    {
        pillar: 'Аз и другите',
        name: 'Доброволчество',
        description: 'Доброволческа дейност в училище или общността'
    },
    {
        pillar: 'Аз и другите',
        name: 'Менторство',
        description: 'Помощ и подкрепа на други ученици'
    },
    {
        pillar: 'Аз и другите',
        name: 'Организиране на събития',
        description: 'Организиране на училищни мероприятия'
    },
    {
        pillar: 'Аз и другите',
        name: 'Лидерство в проекти',
        description: 'Ръководене на ученически проекти'
    },

    // Мислене
    {
        pillar: 'Мислене',
        name: 'Участие в олимпиада',
        description: 'Участие в предметни олимпиади'
    },
    {
        pillar: 'Мислене',
        name: 'Научен проект',
        description: 'Разработка на научен или изследователски проект'
    },
    {
        pillar: 'Мислене',
        name: 'Иновативно решение',
        description: 'Създаване на иновативно решение на проблем'
    },
    {
        pillar: 'Мислене',
        name: 'Публикация/презентация',
        description: 'Публикуване на статия или изнасяне на презентация'
    },
    {
        pillar: 'Мислене',
        name: 'Изследователска дейност',
        description: 'Провеждане на изследване или експеримент'
    },

    // Професия
    {
        pillar: 'Професия',
        name: 'Стаж',
        description: 'Стаж в компания или организация'
    },
    {
        pillar: 'Професия',
        name: 'Професионален проект',
        description: 'Работа по професионален проект'
    },
    {
        pillar: 'Професия',
        name: 'Сертификат',
        description: 'Получаване на професионален сертификат'
    },
    {
        pillar: 'Професия',
        name: 'Участие в конкурс',
        description: 'Участие в професионален конкурс или състезание'
    },
    {
        pillar: 'Професия',
        name: 'Професионално обучение',
        description: 'Завършване на професионален курс или обучение'
    }
];

async function initCategories() {
    try {
        // Свързване с базата данни
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/technofolio');
        console.log('✅ Свързан с MongoDB');

        let addedCount = 0;
        let existingCount = 0;

        for (const categoryData of categories) {
            const existing = await CreditCategory.findOne({
                name: categoryData.name,
                pillar: categoryData.pillar
            });

            if (existing) {
                existingCount++;
                console.log(`⏭️  Категорията "${categoryData.name}" в стълб "${categoryData.pillar}" вече съществува`);
            } else {
                await CreditCategory.create(categoryData);
                addedCount++;
                console.log(`✅ Добавена категория: "${categoryData.name}" в стълб "${categoryData.pillar}"`);
            }
        }

        console.log('\n📊 Резюме:');
        console.log(`✅ Добавени нови категории: ${addedCount}`);
        console.log(`⏭️  Съществуващи категории: ${existingCount}`);
        console.log(`📁 Общо категории в базата: ${await CreditCategory.countDocuments()}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Грешка:', error);
        process.exit(1);
    }
}

// Стартиране на скрипта
initCategories();