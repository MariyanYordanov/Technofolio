const mongoose = require('mongoose');

const InterestSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    interests: [
        {
            category: {
                type: String,
                required: true
            },
            subcategory: {
                type: String,
                required: true
            }
        }
    ],
    hobbies: [
        {
            type: String
        }
    ],
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Interest', InterestSchema);