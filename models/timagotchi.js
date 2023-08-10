const mongoose = require('mongoose');

// create the user schema
const timagotchiSchema = new mongoose.Schema({
    name: String,
    image: String,
    type: String,
    gender: String,
    age: Number,
    friendship: {
        value: { type: Number, default: 30 },
        status: { type: String, default: 'neutral'}
    },
    food: { type: Number, default: 50 },
    mood: { type: Number, default: 50 },
    user: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    alive: { type: Boolean, default: true },

}, { timestamps: true });


// create model
const Timagotchi = mongoose.model('Timagotchi', timagotchiSchema);

// export the model to be used
module.exports = Timagotchi;