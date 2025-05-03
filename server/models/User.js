// server/models/User.js
import mongoose from 'mongoose';

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
        required: true
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

// Виртуално поле за пълно име
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Премахваме чувствителни данни при преобразуване към JSON
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;