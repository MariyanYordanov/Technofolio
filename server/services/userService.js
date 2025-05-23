// server/services/userService.js
import User from '../models/User.js';
import Student from '../models/Student.js';
import Goals from '../models/Goals.js';
import Credit from '../models/Credit.js';
import Achievement from '../models/Achievement.js';
import Portfolio from '../models/Portfolio.js';
import Interest from '../models/Interest.js';
import EventParticipation from '../models/EventParticipation.js';
import Sanction from '../models/Sanction.js';
import Notification from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';

// Помощна функция за валидиране на права
const validateUserPermissions = (currentUser, targetUser, action) => {
    // Проверка дали админ се опитва да променя друг админ
    if (targetUser.role === 'admin' && currentUser.id !== targetUser._id.toString()) {
        throw new AppError(`Администратор не може да ${action} друг администратор`, 403);
    }
};

// Получаване на всички потребители с филтри и пагинация
export const getAllUsers = async (filters = {}) => {
    const { page = 1, limit = 10, role, search } = filters;
    const skip = (page - 1) * limit;

    // Създаване на query обект
    let query = {};

    // Добавяне на филтър по роля
    if (role && ['student', 'teacher', 'admin'].includes(role)) {
        query.role = role;
    }

    // Добавяне на филтър по име или имейл
    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    // Извършване на заявката
    const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Общ брой потребители за пагинация
    const total = await User.countDocuments(query);

    return {
        users,
        pagination: {
            count: users.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        }
    };
};

// Получаване на потребител по ID
export const getUserById = async (id) => {
    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    // Ако потребителят е ученик, вземаме допълнителна информация от Student модела
    let studentData = null;
    if (user.role === 'student') {
        studentData = await Student.findOne({ user: user._id });
    }

    return {
        user,
        studentData
    };
};

// Създаване на нов потребител (от админ)
export const createUser = async (userData) => {
    const { email, password, firstName, lastName, role } = userData;

    // Проверка за съществуващ потребител
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('Потребител с този имейл вече съществува', 400);
    }

    // Валидиране на паролата
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        throw new AppError('Паролата трябва да съдържа минимум 8 символа, включително главна буква, малка буква, цифра и специален символ', 400);
    }

    // Създаване на потребител
    const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role: role || 'student',
        emailConfirmed: true // Админи могат да създават потвърдени потребители директно
    });

    return { user };
};

// Обновяване на потребител
export const updateUser = async (id, updateData, currentUser) => {
    const { firstName, lastName, role, accountLocked, emailConfirmed } = updateData;

    // Намиране на потребителя
    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    // Валидиране на права
    validateUserPermissions(currentUser, user, 'променя данните на');

    // Обновяване на полетата
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role && ['student', 'teacher', 'admin'].includes(role)) user.role = role;
    if (accountLocked !== undefined) user.accountLocked = accountLocked;
    if (emailConfirmed !== undefined) user.emailConfirmed = emailConfirmed;

    // Запазване на промените
    await user.save();

    return { user };
};

// Задаване на нова парола на потребител (от админ)
export const resetUserPassword = async (id, password, currentUser) => {
    // Валидиране на паролата
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        throw new AppError('Паролата трябва да съдържа минимум 8 символа, включително главна буква, малка буква, цифра и специален символ', 400);
    }

    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    // Валидиране на права
    validateUserPermissions(currentUser, user, 'променя паролата на');

    // Задаване на нова парола
    user.password = password;
    user.passwordChangedAt = Date.now();
    user.accountLocked = false;
    user.incorrectLoginAttempts = 0;

    await user.save();

    return { message: 'Паролата е успешно променена' };
};

// Изтриване на потребител с cascade delete на всички свързани данни
export const deleteUser = async (id) => {
    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    // Проверка дали админ се опитва да изтрие друг админ
    if (user.role === 'admin') {
        throw new AppError('Администратор не може да бъде изтрит', 403);
    }

    // Cascade delete на всички свързани данни
    if (user.role === 'student') {
        // Намиране на студентския профил за получаване на studentId
        const student = await Student.findOne({ user: user._id });

        if (student) {
            const studentId = student._id;

            // Изтриване на всички свързани данни в паралел за по-добра производителност
            await Promise.all([
                // Студентски профил
                Student.deleteOne({ user: user._id }),

                // Цели по категории
                Goals.deleteMany({ student: studentId }),

                // Кредити
                Credit.deleteMany({ student: studentId }),

                // Постижения
                Achievement.deleteMany({ student: studentId }),

                // Портфолио
                Portfolio.deleteOne({ student: studentId }),

                // Интереси и хобита
                Interest.deleteOne({ student: studentId }),

                // Участия в събития
                EventParticipation.deleteMany({ student: studentId }),

                // Санкции и отсъствия
                Sanction.deleteOne({ student: studentId })
            ]);
        }
    }

    // Изтриване на известия (за всички роли - студенти, учители, администратори)
    await Notification.deleteMany({ recipient: user._id });

    // Изтриване на потребителя
    await User.deleteOne({ _id: user._id });

    return {
        message: 'Потребителят и всички свързани данни са успешно изтрити',
        deletedUserId: id,
        userRole: user.role
    };
};

// Смяна на ролята на потребител
export const changeUserRole = async (id, newRole, currentUser) => {
    // Валидиране на ролята
    if (!['student', 'teacher', 'admin'].includes(newRole)) {
        throw new AppError('Невалидна роля', 400);
    }

    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    // Валидиране на права
    validateUserPermissions(currentUser, user, 'променя ролята на');

    // Смяна на ролята
    user.role = newRole;
    await user.save();

    return { user };
};

// Получаване на статистика за потребителите
export const getUsersStatistics = async () => {
    const [
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        registrationsThisMonth
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'teacher' }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({
            createdAt: { $gte: new Date(new Date().setDate(1)) }
        })
    ]);

    return {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        registrationsThisMonth
    };
};

// Получаване на потребители по роля
export const getUsersByRole = async (role) => {
    if (!['student', 'teacher', 'admin'].includes(role)) {
        throw new AppError('Невалидна роля', 400);
    }

    const users = await User.find({ role }).select('_id firstName lastName email');
    return users;
};

// Търсене на потребители по критерии
export const searchUsers = async (searchCriteria) => {
    const { query, role, emailConfirmed, accountLocked } = searchCriteria;

    let searchQuery = {};

    // Текстово търсене
    if (query) {
        searchQuery.$or = [
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
        ];
    }

    // Филтър по роля
    if (role) {
        searchQuery.role = role;
    }

    // Филтър по потвърден имейл
    if (emailConfirmed !== undefined) {
        searchQuery.emailConfirmed = emailConfirmed;
    }

    // Филтър по заключен акаунт
    if (accountLocked !== undefined) {
        searchQuery.accountLocked = accountLocked;
    }

    const users = await User.find(searchQuery)
        .sort({ createdAt: -1 })
        .limit(50); // Ограничение за performance

    return users;
};

// Масово обновяване на потребители
export const bulkUpdateUsers = async (userIds, updateData, currentUser) => {
    const { accountLocked, emailConfirmed } = updateData;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new AppError('Не са предоставени валидни ID-та на потребители', 400);
    }

    // Намиране на потребителите
    const users = await User.find({ _id: { $in: userIds } });

    if (users.length === 0) {
        throw new AppError('Няма намерени потребители', 404);
    }

    // Проверка дали има админи в списъка
    const hasAdmins = users.some(user => user.role === 'admin');
    if (hasAdmins && currentUser.role !== 'admin') {
        throw new AppError('Нямате права да променяте администратори', 403);
    }

    // Подготовка на update обект
    const updateFields = {};
    if (accountLocked !== undefined) updateFields.accountLocked = accountLocked;
    if (emailConfirmed !== undefined) updateFields.emailConfirmed = emailConfirmed;

    // Масово обновяване
    const result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: updateFields }
    );

    return {
        message: `${result.modifiedCount} потребители са обновени успешно`,
        modifiedCount: result.modifiedCount
    };
};

// Получаване на потребители с изтичащи пароли
export const getUsersWithExpiringPasswords = async (daysThreshold = 30) => {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - (90 - daysThreshold)); // Ако паролите изтичат след 90 дни

    const users = await User.find({
        passwordChangedAt: { $lte: thresholdDate },
        role: { $ne: 'admin' } // Изключваме админите
    }).select('firstName lastName email passwordChangedAt');

    return users;
};

// Активиране/деактивиране на акаунт
export const toggleUserAccount = async (id, currentUser) => {
    const user = await User.findById(id);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    // Валидиране на права
    validateUserPermissions(currentUser, user, 'променя статуса на акаунта на');

    // Превключване на статуса
    user.accountLocked = !user.accountLocked;

    // Ако отключваме акаунта, нулираме опитите за вход
    if (!user.accountLocked) {
        user.incorrectLoginAttempts = 0;
    }

    await user.save();

    return {
        user,
        message: user.accountLocked ? 'Акаунтът е заключен' : 'Акаунтът е отключен'
    };
};