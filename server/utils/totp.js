import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// server/utils/totp.js
export const generateTOTP = async () => {
    // Генериране на тайна
    const secret = speakeasy.generateSecret({
        name: 'Техно-Портфолио',
        length: 20
    });

    // Генериране на QR код
    const qrCodeDataURL = QRCode.toDataURL(secret.otpauth_url);

    return {
        secret: secret.base32,
        qrCode: qrCodeDataURL
    };
};

export const verifyTOTP = (secret, token) => {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1 // Допуска 30 секунди напред или назад за компенсиране на несъгласуваност във времето
    });
};