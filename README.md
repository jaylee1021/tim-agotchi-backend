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

Each Timagotchi is attached to a user via a MANY-TO-ONE relationship. This makes it easy to find all Timagotchis by a certain user, and to tie a specific user to a Timagotchi. 

We also get a glimpse of the app's mechanics, which manifest through six different objects within the model. These are values and statuses that are updated by the app itself via the ```setInterval()``` function, and by the user through various "PUT" routes. Any variable within the model that does not have a default value is updated by the users' input when they create their virtual pet. 

## Routes

The routes for the models are handled through controllers and sent to the app.js (server) file. The routes are handled by the express dependency and are routed through to the app.js (server) file through the use of the ```express.Router()``` method.
### Users 

The first step is for users to sign-up. We salt and hash the users' passwords and then save them to the database for security purposes. 

```javascript 
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) throw Error;

                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) console.log('==> Error inside of hash', err);
                        // Change the password in newUser to the hash
                        newUser.password = hash;
                        newUser.save()
                            .then(createdUser => {
                                // remove password from being returned inside of response, still in DB
                                if (createdUser.password) {
                                    createdUser.password = '...'; // hide the password
                                    res.json({ user: createdUser });
                                }
                            })
                            .catch(err => {
                                console.log('error with creating new user', err);
                                res.json({ message: 'Error occured... Please try again.' });
                            });
                    });
                });
```

