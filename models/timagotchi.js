const mongoose = require('mongoose');

// create the user schema
const timagotchiSchema = new mongoose.Schema({
    name: String,
    image: String,
    type: String,
    gender: String,
    age: Number,
    friendship: {
        value: Number,
        status: String
    },
    food: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
    mood: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mood' }],
}, { timestamps: true });


// create model
const Timagotchi = mongoose.model('Timagotchi', timagotchiSchema);

// export the model to be used
module.exports = Timagotchi;