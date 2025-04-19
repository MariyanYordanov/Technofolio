const mongoose = require('mongoose');

const SanctionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    absences: {
        excused: {
            type: Number,
            default: 0
        },
        unexcused: {
            type: Number,
            default: 0
        },
        maxAllowed: {
            type: Number,
            default: 150
        }
    },
    schooloRemarks: {
        type: Number,
        default: 0
    },
    activeSanctions: [
        {
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
        }
    ],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Sanction', SanctionSchema);