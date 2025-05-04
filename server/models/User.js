// server/models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        default: 'student',
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    grade: {
        type: Number,
        min: 8,
        max: 12,
        required: function () {
            return this.role === 'student';
        },
    },
    specialization: {
        type: String,
        required: function () {
            return this.role === 'student';
        },
    },
    lastLoginAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Обновяваме updatedAt при промяна
userSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Метод за проверка дали потребителят има определена роля
userSchema.methods.hasRole = function (role) {
    return this.role === role;
};

const User = mongoose.model('User', userSchema);

module.exports = User;