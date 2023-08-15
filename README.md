# Tim-agotchi Backend
The backbone of a MERN app inspired by the popular keychain toy. Take care of your virtual pet by feeding it, playing with it and cleaning up after it's little messes. 

## Models

There are only two models that cover the entirety of Timagotchi's functionality, however, they both are critical. 

Up first is the user route. With this model, two componenets are absolutely necessary to the app's functionality. 

```javascript

   email: { type: String, required: true, unique: true }
   password: { type: String, required: true },

```

The password is hashed and salted using bcryptjs, while the email is used to verify the user's identity and allow them to log in. We have also set up funtionality to send a user an email if their virtual companions are in need of some TLC. 

Foremostly, we have the eponymous Timagotchi model. 

```javascript

const timagotchiSchema = new mongoose.Schema({
    name: String,
    image: String,
    type: String,
    gender: String,
    age: { type: Number, default: 0 },
    friendship: {
        value: { type: Number, default: 30 },
        status: { type: String, default: 'NEUTRAL'}
    },
    food: {
        value: { type: Number, default: 50 },
        status: { type: String, default: 'HUNGRY'}
    },
    mood: {
        value: { type: Number, default: 50 },
        status: { type: String, default: 'BORED' }
    },
    cleanliness: {
        value: { type: Number, default: 80 },
        status: { type: String, default: 'CLEAN' }
    },
    hasPooped: { type: Boolean, default: false },
    user: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    alive: { type: Boolean, default: true },

}, { timestamps: true });


```

Each Timagotchi is attached to a user via a MANY-TO-ONE relationship. This makes it easy to find all Timagotchis by a certain user, and

And here, we get a glimpse of the app's mechanics.