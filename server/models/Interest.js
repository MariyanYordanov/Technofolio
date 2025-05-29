// server/models/Interest.js - Updated
import { Schema, model } from 'mongoose';

const InterestSchema = new Schema({
    user: {  // Променено от 'student' на 'user'
        type: Schema.Types.ObjectId,
        ref: 'User',
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

// Индекс за уникалност
InterestSchema.index({ user: 1 }, { unique: true });

export default model('Interest', InterestSchema);