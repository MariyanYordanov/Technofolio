import { Schema, model } from 'mongoose';

const StudentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    grade: {
        type: String,
        required: [true, 'Класът е задължителен'],
        enum: ['8', '9', '10', '11', '12']
    },
    specialization: {
        type: String,
        required: [true, 'Специалността е задължителна']
    },
    averageGrade: {
        type: Number,
        min: 2,
        max: 6,
        default: 2
    },
    imageUrl: {
        type: String,
        default: '/default-avatar.png'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default model('Student', StudentSchema);