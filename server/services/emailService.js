// server/services/emailService.js
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Създаване на транспортер за nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT === '465', // true за 465, false за други портове
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App password за Gmail, ако имаш 2FA
    },
});

// Функция за генериране на токен
const generateToken = (payload, expiresIn = '24h') => {
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
};

// Проверка на настройките за имейл при стартиране
const verifyEmailConfig = async () => {
    try {
        await transporter.verify();
        console.log('Имейл сървърът е конфигуриран правилно');
        return true;
    } catch (error) {
        console.error('Грешка при конфигуриране на имейл сървъра:', error);
        return false;
    }
};

// Основна функция за изпращане на имейл
const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || `"Технофолио" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Имейлът е изпратен:', info.messageId);
        return info;
    } catch (error) {
        console.error('Грешка при изпращане на имейл:', error);
        throw error;
    }
};

// Функция за изпращане на имейл за потвърждение на регистрация
const sendVerificationEmail = async (user) => {
    const token = generateToken({ userId: user._id, email: user.email }, '24h');
    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
    const verificationUrl = `${clientURL}${Path.ConfirmRegistration}?token=${token}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3498db;">Добре дошли в Технофолио!</h2>
      <p>Здравейте, ${user.firstName} ${user.lastName}!</p>
      <p>Благодарим за регистрацията. Моля, потвърдете вашия имейл адрес, като кликнете върху бутона по-долу:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${verificationUrl}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Потвърди имейл</a>
      </div>
      <p>Или копирайте този линк в браузъра си:</p>
      <p>${verificationUrl}</p>
      <p>Линкът е валиден за 24 часа.</p>
      <p>Ако не сте заявили регистрация, моля, игнорирайте този имейл.</p>
    </div>
  `;

    return sendEmail(user.email, 'Потвърдете вашата регистрация в Технофолио', html);
};

// Функция за изпращане на имейл линк за вход
const sendLoginLinkEmail = async (user) => {
    const token = generateToken({ userId: user._id, email: user.email }, '15m');
    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
    const loginUrl = `${clientURL}${Path.EmailLogin}?token=${token}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3498db;">Вход в Технофолио</h2>
      <p>Здравейте, ${user.firstName} ${user.lastName}!</p>
      <p>Поискахте линк за вход в Технофолио. Кликнете върху бутона по-долу, за да влезете:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${loginUrl}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Вход в системата</a>
      </div>
      <p>Или копирайте този линк в браузъра си:</p>
      <p>${loginUrl}</p>
      <p>Линкът е валиден за 15 минути.</p>
      <p>Ако не сте заявили вход, моля, игнорирайте този имейл и сменете паролата си.</p>
    </div>
  `;

    return sendEmail(user.email, 'Линк за вход в Технофолио', html);
};

// Функция за изпращане на имейл за нулиране на парола
const sendPasswordResetEmail = async (user) => {
    const token = generateToken({ userId: user._id, email: user.email }, '1h');
    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientURL}/reset-password?token=${token}`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3498db;">Нулиране на парола</h2>
      <p>Здравейте, ${user.firstName} ${user.lastName}!</p>
      <p>Получихме заявка за нулиране на вашата парола. Кликнете върху бутона по-долу, за да създадете нова парола:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Нулиране на парола</a>
      </div>
      <p>Или копирайте този линк в браузъра си:</p>
      <p>${resetUrl}</p>
      <p>Линкът е валиден за 1 час.</p>
      <p>Ако не сте заявили нулиране на паролата, моля, игнорирайте този имейл.</p>
    </div>
  `;

    return sendEmail(user.email, 'Нулиране на парола в Технофолио', html);
};

module.exports = {
    verifyEmailConfig,
    sendEmail,
    sendVerificationEmail,
    sendLoginLinkEmail,
    sendPasswordResetEmail,
    generateToken,
};