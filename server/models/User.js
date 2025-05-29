// server/models/User.js - Updated unified model
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema({
    // ===== ОСНОВНИ ДАННИ =====
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

    // ===== РОЛЯ И ТИП ПОТРЕБИТЕЛ =====
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        required: true
    },

    // ===== ДАННИ ЗА УЧЕНИЦИ =====
    studentInfo: {
        grade: {
            type: String,
            enum: ['8', '9', '10', '11', '12'],
            required: function () { return this.role === 'student'; }
        },
        specialization: {
            type: String,
            required: function () { return this.role === 'student'; }
        },
        averageGrade: {
            type: Number,
            min: 2,
            max: 6,
            default: function () { return this.role === 'student' ? 2 : undefined; }
        }
    },

    // ===== ДАННИ ЗА УЧИТЕЛИ =====
    teacherInfo: {
        subjects: [{
            type: String
        }],
        qualification: {
            type: String
        },
        yearsOfExperience: {
            type: Number,
            min: 0
        }
    },

    // ===== ОБЩИ ПОЛЕТА =====
    imageUrl: {
        type: String,
        default: '/default-avatar.png'
    },

    // ===== СИГУРНОСТ И АВТЕНТИКАЦИЯ =====
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

    // ===== TIMESTAMPS =====
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

// ===== ИНДЕКСИ =====
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'studentInfo.grade': 1 });
userSchema.index({ 'studentInfo.specialization': 1 });

// ===== ВИРТУАЛНИ ПОЛЕТА =====
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Виртуално поле за проверка дали е ученик
userSchema.virtual('isStudent').get(function () {
    return this.role === 'student';
});

// Виртуално поле за проверка дали е учител
userSchema.virtual('isTeacher').get(function () {
    return this.role === 'teacher';
});

// Виртуално поле за проверка дали е админ
userSchema.virtual('isAdmin').get(function () {
    return this.role === 'admin';
});

// ===== МЕТОДИ =====
userSchema.methods.checkPassword = async function (candidatePassword) {
    return await bcryptjs.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// ===== MIDDLEWARE =====
// Pre-save hook за хеширане на паролата
userSchema.pre('save', async function (next) {
    // Изпълнява се само ако паролата е променена
    if (!this.isModified('password')) return next();

    // Хеширане на паролата
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);

    // Ако изрично записваме passwordChangedAt
    if (this.isModified('password') && !this.isNew) {
        // малко закъснение за да сме сигурни че JWT е издаден след промяната
        this.passwordChangedAt = Date.now() - 1000; 
    }

    next();
});

// Pre-save hook за валидиране на специфични данни според ролята
userSchema.pre('save', function (next) {
    // Изчистване на ненужни данни според ролята
    if (this.role !== 'student') {
        this.studentInfo = undefined;
    }

    if (this.role !== 'teacher') {
        this.teacherInfo = undefined;
    }

    next();
});

// ===== СТАТИЧНИ МЕТОДИ =====
// Метод за намиране на ученици по клас
userSchema.statics.findStudentsByGrade = function (grade) {
    return this.find({
        role: 'student',
        'studentInfo.grade': grade
    });
};

// Метод за намиране на ученици по специалност
userSchema.statics.findStudentsBySpecialization = function (specialization) {
    return this.find({
        role: 'student',
        'studentInfo.specialization': specialization
    });
};

// Метод за намиране на учители по предмет
userSchema.statics.findTeachersBySubject = function (subject) {
    return this.find({
        role: 'teacher',
        'teacherInfo.subjects': subject
    });
};

// ===== СЕРИАЛИЗАЦИЯ =====
// Премахваме чувствителни данни при преобразуване към JSON
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.twoFactorSecret;
    delete userObject.refreshToken;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;

    // Премахваме празни обекти
    if (this.role !== 'student' && userObject.studentInfo) {
        delete userObject.studentInfo;
    }

    if (this.role !== 'teacher' && userObject.teacherInfo) {
        delete userObject.teacherInfo;
    }

    return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;