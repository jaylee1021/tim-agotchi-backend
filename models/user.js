const mongoose = require('mongoose');

// create the user schema
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    birthdate: Date,
    avatar: String,
    password: { type: String, required: true },
    timagotchis: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Timagotchi' }]
}, { timestamps: true });

// create model
const User = mongoose.model('User', userSchema);

// export the model to be used
module.exports = User;