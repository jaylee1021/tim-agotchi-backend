const mongoose = require('mongoose');

// create the user schema
const timagotchiSchema = new mongoose.Schema({
    name: String,
    image: String,
    type: String,
    gender: String,
    age: { type: Number, default: 0 },
    friendship: {
        value: { type: Number, default: 30 },
        status: { type: String, default: 'Neutral'}
    },
    food: {
        value: { type: Number, default: 50 },
        status: { type: String, default: 'Hungry'}
    },
    mood: {
        value: { type: Number, default: 50 },
        status: { type: String, default: 'Bored' }
    },
    cleanliness: {
        value: { type: Number, default: 80 },
        status: { type: String, default: 'Clean' }
    },
    hasPooped: { type: Boolean, default: false },
    user: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    alive: { type: Boolean, default: true },

}, { timestamps: true });


// create model
const Timagotchi = mongoose.model('Timagotchi', timagotchiSchema);

// export the model to be used
module.exports = Timagotchi;