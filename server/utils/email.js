// server/utils/email.js
import nodemailer from 'nodemailer';
import config from '../config/config.js';

const createTransporter = async () => {
    // За разработка използваме Ethereal (фиктивен SMTP сървър)
    if (config.NODE_ENV === 'development') {
        const testAccount = await nodemailer.createTestAccount();

        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }

    // За производство използваме реален SMTP сървър
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

export const sendEmail = async (options) => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Технофолио'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@technofolio.bg'}>`,
            to: options.email,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        const info = await transporter.sendMail(mailOptions);

        // Ако използваме Ethereal, връщаме URL за преглед на имейла
        if (config.NODE_ENV === 'development') {
            console.log('Преглед на имейла:', nodemailer.getTestMessageUrl(info));
        }

        return info;
    } catch (error) {
        console.error('Грешка при изпращане на имейл:', error);
        throw error;
    }
};

// Шаблони за имейли
export const resetPasswordEmailTemplate = (name, resetUrl) => {
    return {
        text: `Здравейте ${name},\n\nПолучихме заявка за нулиране на паролата за вашия акаунт. Моля, следвайте линка по-долу, за да зададете нова парола:\n\n${resetUrl}\n\nАко не сте заявили нулиране на паролата, моля, игнорирайте този имейл.\n\nПоздрави,\nЕкипът на Технофолио`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a4a4a; text-align: center;">Нулиране на парола</h2>
        <p>Здравейте ${name},</p>
        <p>Получихме заявка за нулиране на паролата за вашия акаунт.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Задаване на нова парола</a>
        </div>
        <p>Ако не сте заявили нулиране на паролата, моля, игнорирайте този имейл.</p>
        <p>Линкът ще бъде валиден за 10 минути.</p>
        <p style="margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 10px; font-size: 12px; color: #777;">
          С уважение,<br>
          Екипът на Технофолио
        </p>
      </div>
    `
    };
};