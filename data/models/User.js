
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "Първото име е задължително"],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, "Фамилията е задължителна"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Имейлът е задължителен"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Паролата е задължителна"],
        minlength: 6,
    },
    role: {
        type: String,
        enum: ["admin", "teacher", "student"],
        default: "student",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("User", UserSchema);
