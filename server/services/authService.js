// server/services/authService.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import config from '../config/config.js';
import { AppError } from '../utils/AppError.js';
import { sendEmail } from '../utils/email.js';
import { generateTOTP, verifyTOTP } from '../utils/totp.js';

// Помощна функция за създаване на JWT токен
const signToken = (id) => {
    return jwt.sign({ id }, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRE
    });
};

// Помощна функция за създаване на refresh токен
const signRefreshToken = (id) => {
    return jwt.sign({ id }, config.REFRESH_TOKEN_SECRET, {
        expiresIn: config.REFRESH_TOKEN_EXPIRE
    });
};

// Функция за създаване на token response обект
const createTokenResponse = (user) => {
    const token = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Запазване на refresh token в базата данни
    user.refreshToken = refreshToken;

    return {
        token,
        refreshToken,
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        }
    };
};

// Регистрация на потребител
export const registerUser = async (userData) => {
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
        role: role || 'student'
    });

    // Генериране на токен за потвърждение на имейла
    const confirmationToken = jwt.sign(
        { id: user._id, email: user.email, purpose: 'confirm-registration' },
        config.JWT_SECRET,
        { expiresIn: '24h' }
    );

    // Създаване на URL за потвърждение
    const confirmURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirm-email/${confirmationToken}`;

    try {
        // Изпращане на имейл за потвърждение
        await sendEmail({
            email: user.email,
            subject: 'Потвърждение на регистрация в Технофолио',
            text: `Здравейте ${firstName},\n\nБлагодарим Ви за регистрацията в Технофолио. Моля, потвърдете имейла си като последвате линка: ${confirmURL}\n\nПоздрави,\nЕкипът на Технофолио`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a4a4a; text-align: center;">Потвърждение на регистрация</h2>
          <p>Здравейте ${firstName},</p>
          <p>Благодарим Ви за регистрацията в Технофолио.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmURL}" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Потвърдете имейла си</a>
          </div>
          <p style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 10px; font-size: 12px; color: #777;">
            С уважение,<br>
            Екипът на Технофолио
          </p>
        </div>
      `
        });
    } catch (error) {
        console.error('Грешка при изпращане на имейл за потвърждение:', error);
    }

    // Създаване на token response
    const tokenResponse = createTokenResponse(user);
    await user.save({ validateBeforeSave: false });

    return tokenResponse;
};

// Вход на потребител
export const loginUser = async (loginData) => {
    const { email, password } = loginData;

    // Проверка дали имейлът и паролата са предоставени
    if (!email || !password) {
        throw new AppError('Моля, въведете имейл и парола', 400);
    }

    // Намиране на потребителя
    const user = await User.findOne({ email }).select('+password');

    // Проверка дали потребителят съществува
    if (!user) {
        throw new AppError('Невалидни данни за вход', 401);
    }

    // Проверка дали акаунтът е заключен
    if (user.accountLocked) {
        throw new AppError('Акаунтът е заключен поради твърде много неуспешни опити. Моля, опитайте по-късно или нулирайте паролата си.', 401);
    }

    // Проверка на паролата
    const isMatch = await user.checkPassword(password);

    if (!isMatch) {
        // Увеличаване на брояча на неуспешни опити
        user.incorrectLoginAttempts += 1;
        user.lastLoginAttempt = Date.now();

        // Заключване на акаунта след 5 неуспешни опита
        if (user.incorrectLoginAttempts >= 5) {
            user.accountLocked = true;
            await user.save();
            throw new AppError('Акаунтът е заключен поради твърде много неуспешни опити. Моля, опитайте по-късно или нулирайте паролата си.', 401);
        }

        await user.save();
        throw new AppError('Невалидни данни за вход', 401);
    }

    // Нулиране на брояча на неуспешни опити
    user.incorrectLoginAttempts = 0;
    user.lastLoginAttempt = Date.now();
    await user.save();

    // Проверка за 2FA ако е активирана
    if (user.twoFactorEnabled) {
        const tempToken = jwt.sign(
            { id: user._id, requiresTwoFactor: true },
            config.JWT_SECRET,
            { expiresIn: '5m' }
        );

        return {
            requiresTwoFactor: true,
            tempToken
        };
    }

    // Създаване на token response
    const tokenResponse = createTokenResponse(user);
    await user.save({ validateBeforeSave: false });

    return tokenResponse;
};

// Валидиране на 2FA код
export const verifyUserTwoFactor = async (tempToken, code) => {
    if (!tempToken || !code) {
        throw new AppError('Моля, предоставете временен токен и код', 400);
    }

    try {
        // Проверка на временния токен
        const decoded = jwt.verify(tempToken, config.JWT_SECRET);

        if (!decoded.requiresTwoFactor) {
            throw new AppError('Невалиден токен', 401);
        }

        // Намиране на потребителя
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new AppError('Потребителят не е намерен', 404);
        }

        // Проверка на 2FA кода
        const isValidCode = verifyTOTP(user.twoFactorSecret, code);

        if (!isValidCode) {
            throw new AppError('Невалиден код за двуфакторна автентикация', 401);
        }

        // Създаване на token response
        const tokenResponse = createTokenResponse(user);
        await user.save({ validateBeforeSave: false });

        return tokenResponse;

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Невалиден или изтекъл токен', 401);
    }
};

// Активиране на двуфакторна автентикация
export const enableUserTwoFactor = async (userId) => {
    // Генериране на TOTP тайна
    const { secret, qrCode } = await generateTOTP();

    // Създаване на временен токен
    const tempToken = jwt.sign(
        { id: userId, tempSecret: secret },
        config.JWT_SECRET,
        { expiresIn: '10m' }
    );

    return {
        tempToken,
        qrCode
    };
};

// Потвърждаване на двуфакторна автентикация
export const confirmUserTwoFactor = async (tempToken, token) => {
    if (!tempToken || !token) {
        throw new AppError('Моля, предоставете временен токен и код', 400);
    }

    try {
        // Проверка на временния токен
        const decoded = jwt.verify(tempToken, config.JWT_SECRET);

        // Намиране на потребителя
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new AppError('Потребителят не е намерен', 404);
        }

        // Проверка на TOTP кода
        const isValidCode = verifyTOTP(decoded.tempSecret, token);

        if (!isValidCode) {
            throw new AppError('Невалиден код', 401);
        }

        // Активиране на 2FA и запазване на тайната
        user.twoFactorEnabled = true;
        user.twoFactorSecret = decoded.tempSecret;
        await user.save();

        return { message: 'Двуфакторната автентикация е активирана успешно' };

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Невалиден или изтекъл токен', 401);
    }
};

// Обновяване на токена с refresh token
export const refreshUserToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new AppError('Липсващ refresh token', 401);
    }

    try {
        // Проверка на refresh token
        const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);

        // Намиране на потребителя
        const user = await User.findById(decoded.id).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            throw new AppError('Невалиден refresh token', 401);
        }

        // Създаване на нов access token
        const token = signToken(user._id);

        return { token };

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Невалиден или изтекъл refresh token', 401);
    }
};

// Изход от системата
export const logoutUser = async (userId) => {
    if (userId) {
        await User.findByIdAndUpdate(userId, { refreshToken: null });
    }
    return { message: 'Успешен изход от системата' };
};

// Забравена парола
export const forgotUserPassword = async (email) => {
    // Намиране на потребителя
    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError('Няма потребител с този имейл адрес', 404);
    }

    // Генериране на токен за нулиране на паролата
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Хеширане на токена и запазване в базата данни
    user.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 минути

    await user.save({ validateBeforeSave: false });

    // Създаване на URL за нулиране на паролата
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    try {
        // Изпращане на имейл
        await sendEmail({
            email: user.email,
            subject: 'Нулиране на парола (валидно 10 минути)',
            text: `Здравейте ${user.firstName},\n\nПолучихме заявка за нулиране на паролата за вашия акаунт. Моля, следвайте линка по-долу, за да зададете нова парола:\n\n${resetURL}\n\nАко не сте заявили нулиране на паролата, моля, игнорирайте този имейл.\n\nПоздрави,\nЕкипът на Технофолио`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #4a4a4a; text-align: center;">Нулиране на парола</h2>
              <p>Здравейте ${user.firstName},</p>
              <p>Получихме заявка за нулиране на паролата за вашия акаунт.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetURL}" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Задаване на нова парола</a>
              </div>
              <p>Ако не сте заявили нулиране на паролата, моля, игнорирайте този имейл.</p>
              <p>Линкът ще бъде валиден за 10 минути.</p>
              <p style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 10px; font-size: 12px; color: #777;">
                С уважение,<br>
                Екипът на Технофолио
              </p>
            </div>
          `
        });

        return { message: 'Изпратен е имейл с инструкции за нулиране на паролата' };
    } catch (error) {
        // Ако възникне грешка, премахваме токените
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        throw new AppError('Възникна грешка при изпращането на имейла. Моля, опитайте отново по-късно!', 500);
    }
};

// Нулиране на паролата
export const resetUserPassword = async (token, password) => {
    // Хеширане на токена от URL
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Намиране на потребителя по токена
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new AppError('Невалиден или изтекъл токен', 400);
    }

    // Валидиране на новата парола
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        throw new AppError('Паролата трябва да съдържа минимум 8 символа, включително главна буква, малка буква, цифра и специален символ', 400);
    }

    // Задаване на нова парола и изчистване на токените
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    user.accountLocked = false;
    user.incorrectLoginAttempts = 0;

    await user.save();

    // Създаване на token response
    const tokenResponse = createTokenResponse(user);
    await user.save({ validateBeforeSave: false });

    return tokenResponse;
};

// Заявка за линк за вход чрез имейл
export const requestUserLoginLink = async (email) => {
    // Намиране на потребителя
    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError('Няма потребител с този имейл адрес', 404);
    }

    // Генериране на токен за вход
    const loginToken = jwt.sign(
        { id: user._id, email: user.email, purpose: 'email-login' },
        config.JWT_SECRET,
        { expiresIn: '15m' }
    );

    // Създаване на URL за вход
    const loginURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login/email?token=${loginToken}`;

    try {
        // Изпращане на имейл
        await sendEmail({
            email: user.email,
            subject: 'Линк за вход в Технофолио',
            text: `Здравейте ${user.firstName},\n\nЗаявихте линк за вход в Технофолио. Моля, кликнете на линка по-долу за да влезете в профила си:\n\n${loginURL}\n\nАко не сте заявявали този линк, моля, игнорирайте този имейл.\n\nПоздрави,\nЕкипът на Технофолио`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #4a4a4a; text-align: center;">Линк за вход в Технофолио</h2>
              <p>Здравейте ${user.firstName},</p>
              <p>Заявихте линк за вход в Технофолио. Моля, кликнете на бутона по-долу за да влезете в профила си.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginURL}" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Вход в системата</a>
              </div>
              <p>Ако не сте заявявали този линк, моля, игнорирайте този имейл.</p>
              <p>Линкът ще бъде валиден за 15 минути.</p>
              <p style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 10px; font-size: 12px; color: #777;">
                С уважение,<br>
                Екипът на Технофолио
              </p>
            </div>
          `
        });

        return { message: 'Изпратен е имейл с линк за вход' };
    } catch (error) {
        throw new AppError('Възникна грешка при изпращането на имейла. Моля, опитайте отново по-късно!', 500);
    }
};

// Проверка на имейл линк за вход
export const verifyEmailLogin = async (token) => {
    if (!token) {
        throw new AppError('Не е предоставен токен', 400);
    }

    try {
        // Проверка на токена
        const decoded = jwt.verify(token, config.JWT_SECRET);

        if (decoded.purpose !== 'email-login') {
            throw new AppError('Невалиден токен за вход', 400);
        }

        // Намиране на потребителя
        const user = await User.findById(decoded.id);

        if (!user) {
            throw new AppError('Потребителят не е намерен', 404);
        }

        // Създаване на token response
        const tokenResponse = createTokenResponse(user);
        await user.save({ validateBeforeSave: false });

        return tokenResponse;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Невалиден или изтекъл токен', 400);
    }
};

// Потвърждение на регистрация
export const confirmUserRegistration = async (token) => {
    if (!token) {
        throw new AppError('Не е предоставен токен', 400);
    }

    try {
        // Проверка на токена
        const decoded = jwt.verify(token, config.JWT_SECRET);

        if (decoded.purpose !== 'confirm-registration') {
            throw new AppError('Невалиден токен за потвърждение', 400);
        }

        // Намиране на потребителя
        const user = await User.findById(decoded.id);

        if (!user) {
            throw new AppError('Потребителят не е намерен', 404);
        }

        // Потвърждаване на имейла
        user.emailConfirmed = true;
        await user.save();

        // Създаване на token response
        const tokenResponse = createTokenResponse(user);
        await user.save({ validateBeforeSave: false });

        return tokenResponse;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('Невалиден или изтекъл токен', 400);
    }
};

// Промяна на паролата
export const updateUserPassword = async (userId, currentPassword, newPassword) => {
    // Намиране на потребителя с паролата
    const user = await User.findById(userId).select('+password');

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    // Проверка на текущата парола
    const isMatch = await user.checkPassword(currentPassword);

    if (!isMatch) {
        throw new AppError('Текущата парола е грешна', 401);
    }

    // Валидиране на новата парола
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        throw new AppError('Паролата трябва да съдържа минимум 8 символа, включително главна буква, малка буква, цифра и специален символ', 400);
    }

    // Задаване на нова парола
    user.password = newPassword;
    user.passwordChangedAt = Date.now();

    await user.save();

    // Създаване на token response
    const tokenResponse = createTokenResponse(user);
    await user.save({ validateBeforeSave: false });

    return tokenResponse;
};

// Получаване на текущия потребител
export const getCurrentUser = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError('Потребителят не е намерен', 404);
    }

    return { user };
};