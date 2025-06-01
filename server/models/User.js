// server/models/User.js - Final version with embedded data
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
            enum: ['8', '9', '10', '11', '12']
        },
        specialization: {
            type: String
        },
        averageGrade: {
            type: Number,
            min: 2,
            max: 6
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

    // ===== ВГРАДЕНИ ДАННИ (за ученици) =====

    // Цели по категории
    goals: [{
        category: {
            type: String,
            required: true,
            enum: ['personalDevelopment', 'academicDevelopment', 'profession', 'extracurricular', 'community', 'internship']
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        activities: [{
            type: String
        }],
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Интереси и хобита
    interests: [{
        category: {
            type: String,
            required: true
        },
        subcategory: {
            type: String,
            required: true
        }
    }],

    hobbies: [{
        type: String,
        maxlength: 100
    }],

    // Портфолио
    portfolio: {
        experience: {
            type: String,
            default: ''
        },
        projects: {
            type: String,
            default: ''
        },
        mentorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        recommendations: [{
            text: {
                type: String,
                required: true,
                maxlength: 1000
            },
            author: {
                type: String,
                required: true,
                maxlength: 100
            },
            date: {
                type: Date,
                default: Date.now
            }
        }]
    },

    // Санкции и отсъствия
    sanctions: {
        absences: {
            excused: {
                type: Number,
                default: 0,
                min: 0
            },
            unexcused: {
                type: Number,
                default: 0,
                min: 0
            },
            maxAllowed: {
                type: Number,
                default: 150,
                min: 0
            }
        },
        schooloRemarks: {
            type: Number,
            default: 0,
            min: 0
        },
        activeSanctions: [{
            type: {
                type: String,
                required: true
            },
            reason: {
                type: String,
                required: true
            },
            startDate: {
                type: Date,
                required: true
            },
            endDate: {
                type: Date
            },
            issuedBy: {
                type: String,
                required: true
            }
        }]
    },

    // ===== ОБЩИ ПОЛЕТА =====
    imageUrl: {
        type: String,
        default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
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
    refreshToken: String
}, {
    timestamps: true // автоматично добавя createdAt и updatedAt
});

// ===== ИНДЕКСИ =====
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'studentInfo.grade': 1 });
userSchema.index({ 'studentInfo.specialization': 1 });
userSchema.index({ 'goals.category': 1 });
userSchema.index({ 'portfolio.mentorId': 1 });

// ===== ВИРТУАЛНИ ПОЛЕТА =====
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isStudent').get(function () {
    return this.role === 'student';
});

userSchema.virtual('isTeacher').get(function () {
    return this.role === 'teacher';
});

userSchema.virtual('isAdmin').get(function () {
    return this.role === 'admin';
});

// Виртуално поле за брой цели
userSchema.virtual('goalsCount').get(function () {
    return this.goals ? this.goals.length : 0;
});

// Виртуално поле за общ брой отсъствия
userSchema.virtual('totalAbsences').get(function () {
    if (this.sanctions && this.sanctions.absences) {
        return this.sanctions.absences.excused + this.sanctions.absences.unexcused;
    }
    return 0;
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

// Метод за добавяне/обновяване на цел
userSchema.methods.setGoal = function (category, goalData) {
    const existingGoalIndex = this.goals.findIndex(g => g.category === category);

    if (existingGoalIndex >= 0) {
        // Обновяване на съществуваща цел
        this.goals[existingGoalIndex] = {
            ...this.goals[existingGoalIndex],
            ...goalData,
            category,
            updatedAt: new Date()
        };
    } else {
        // Добавяне на нова цел
        this.goals.push({
            ...goalData,
            category,
            updatedAt: new Date()
        });
    }

    return this.save();
};

// Метод за добавяне на препоръка
userSchema.methods.addRecommendation = function (text, author) {
    if (!this.portfolio) {
        this.portfolio = {
            experience: '',
            projects: '',
            recommendations: []
        };
    }

    this.portfolio.recommendations.push({
        text,
        author,
        date: new Date()
    });

    return this.save();
};

// ===== MIDDLEWARE =====
// Pre-save hook за хеширане на паролата
userSchema.pre('save', async function (next) {
    // Изпълни се само ако паролата е променена
    if (!this.isModified('password')) return next();

    // Хеширане на паролата
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);

    // Ако изрично записваме passwordChangedAt
    if (this.isModified('password') && !this.isNew) {
        this.passwordChangedAt = Date.now() - 1000;
    }

    next();
});

// Pre-save hook за валидиране на специфични данни според ролята
userSchema.pre('save', function (next) {
    // Изчистване на ненужни данни според ролята
    if (this.role !== 'student') {
        this.studentInfo = undefined;
        this.goals = undefined;
        this.interests = undefined;
        this.hobbies = undefined;
        this.portfolio = undefined;
        this.sanctions = undefined;
    }

    if (this.role !== 'teacher') {
        this.teacherInfo = undefined;
    }

    // Инициализиране на задължителни полета за ученици
    if (this.role === 'student' && this.isNew) {
        if (!this.sanctions) {
            this.sanctions = {
                absences: { excused: 0, unexcused: 0, maxAllowed: 150 },
                schooloRemarks: 0,
                activeSanctions: []
            };
        }
        if (!this.portfolio) {
            this.portfolio = {
                experience: '',
                projects: '',
                recommendations: []
            };
        }
        if (!this.goals) this.goals = [];
        if (!this.interests) this.interests = [];
        if (!this.hobbies) this.hobbies = [];
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

// Метод за намиране на ученици с високи отсъствия
userSchema.statics.findStudentsWithHighAbsences = function (threshold = 0.8) {
    return this.aggregate([
        { $match: { role: 'student' } },
        {
            $addFields: {
                totalAbsences: { $add: ['$sanctions.absences.excused', '$sanctions.absences.unexcused'] },
                absenceRate: {
                    $divide: [
                        { $add: ['$sanctions.absences.excused', '$sanctions.absences.unexcused'] },
                        '$sanctions.absences.maxAllowed'
                    ]
                }
            }
        },
        { $match: { absenceRate: { $gte: threshold } } },
        { $sort: { absenceRate: -1 } }
    ]);
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
    if (this.role !== 'student') {
        delete userObject.studentInfo;
        delete userObject.goals;
        delete userObject.interests;
        delete userObject.hobbies;
        delete userObject.portfolio;
        delete userObject.sanctions;
    }

    if (this.role !== 'teacher') {
        delete userObject.teacherInfo;
    }

    return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;