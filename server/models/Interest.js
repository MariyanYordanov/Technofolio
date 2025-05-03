import { Schema, model } from 'mongoose';

const InterestSchema = new Schema({
    student: {
        type: Schema.Types.ObjectId,
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

export default model('Interest', InterestSchema);