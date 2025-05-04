// server/models/User.js
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const studentInfoSchema = new mongoose.Schema({
    grade: {
        type: Number,
        required: true,
        min: 8,
        max: 12
    },
    specialization: {
        type: String,
        required: true
    },
    averageGrade: {
        type: Number,
        min: 2,
        max: 6,
        default: 2
    }
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: [8, 'Паролата трябва да е минимум 8 символа']
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        default: 'student'
    },
    emailConfirmed: {
        type: Boolean,
        default: false
    },
    accountLocked: {
        type: Boolean,
        default: false
    },
    incorrectLoginAttempts: {
        type: Number,
        default: 0
    },
    lastLoginAttempt: {
        type: Date
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,
    refreshToken: String,
    studentInfo: studentInfoSchema,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Индекси за оптимизация
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Виртуално поле за пълно име
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Метод за проверка на паролата
userSchema.methods.checkPassword = async function (candidatePassword) {
    return await bcryptjs.compare(candidatePassword, this.password);
};

// Проверка дали паролата е променена след издаването на JWT
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Pre-save hook за хеширане на паролата
userSchema.pre('save', async function (next) {
    // Изпълни се само ако паролата е променена
    if (!this.isModified('password')) return next();

    // Хеширане на паролата
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);

    // Ако изрично записваме passwordChangedAt
    if (this.isModified('password') && !this.isNew) {
        this.passwordChangedAt = Date.now() - 1000; // малко закъснение за да сме сигурни че JWT е издаден след промяната
    }

    next();
});

// Премахваме чувствителни данни при преобразуване към JSON
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.twoFactorSecret;
    delete userObject.refreshToken;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;
    return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;