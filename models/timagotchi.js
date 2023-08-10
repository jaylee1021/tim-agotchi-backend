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
    food: Number,
    mood: Number,
    user: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });


// create model
const Timagotchi = mongoose.model('Timagotchi', timagotchiSchema);

// export the model to be used
module.exports = Timagotchi;