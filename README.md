# Tim-agotchi Backend
The backbone of a MERN app inspired by the popular keychain toy. Take care of your virtual pet by feeding it, playing with it and cleaning up after it's little messes. 

### Front-end Deployed Site
https://tim-agotchi.netlify.app/

## How to Install 
1. Fork and clone this repo
2. Run ```npm install``` to install all dependencies
3. Run ```npm run dev``` to start the server
4. Send any pull requests to the main branch

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
We have full CRUD functionality for users, so they are able to sign-up, login, edit their profile info and delete their account, if they like. 

However, the login route stands paramount. 

```javascript
router.post('/login', async (req, res) => {
    // POST - finding a user and returning the user
    
    const foundUser = await User.findOne({ email: req.body.email });

    if (foundUser) {
        // user is in the DB
        let isMatch = bcrypt.compareSync(req.body.password, foundUser.password);
        if (isMatch) {
            const payload = {
                id: foundUser.id,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                email: foundUser.email,
                location: foundUser.location,
                birthdate: foundUser.birthdate,
                avatar: foundUser.avatar
            };

            jwt.sign(payload, JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
                if (err) {
                    res.status(400).json({ message: 'Session has endedd, please log in again' });
                }
                const legit = jwt.verify(token, JWT_SECRET, { expiresIn: 60 });
                delete legit.password; // remove before showing response
                res.json({ success: true, token: `Bearer ${token}`, userData: legit });
            });

        } else {
            return res.status(400).json({ message: 'Email or Password is incorrect' });
        }
    } else {
        return res.status(400).json({ message: 'User not found' });
    }
});
```

This route is required for the user to access most of the app's functionality. Without logging in, users are only able to see all of the Timagotchis in the database. 

### Timagotchis 

Here's the real meat of the app. With the Timagotchi controller folder, we have two main schools of thought: functions and routes. We have several functions that run with the help of the ```setInterval()``` method. These functions are responsible for updating the Timagotchis' values and statuses. 

```javascript
const degradeValues = async () => {

   try { const tims = await Timagotchi.find({});
        for (i in tims) {
            let tim = tims[i];
            if (tim.food.value > 0) {
                tim.food.value -= 0.00077; ///if you add 30, it will take ~10 hours to go down to 0
            }
            if (tim.mood.value > 0) {
                tim.mood.value -= 0.00077;
            }
            if (tim.cleanliness.value > 0) {
                tim.cleanliness.value -= 0.00077;
            }
            if (tim.cleanliness.value <= 30) {
                tim.cleanliness.status = 'DIRTY';
            }
            if (tim.cleanliness.status === 'DIRTY') {
                tim.cleanliness.value -= (0.00077 * 2); //multiply the values if the status is DIRTY
                tim.mood.value -= (0.00077 * 2);
            }
            evenOut(tim); //function that doesn't let the values go above 100 or below 0 
            await tim.save();
        }
        
   } catch (error) {
       console.error('Error updating value:', error);
   }
}
```
And, then, they go into an interval that runs every second to update the values. 

```javascript
setInterval(async () => {
    try {
        degradeValues()
        alterFriendship()

    } catch (error) {
        console.error('Error updating value:', error);
    }
}, 1000);
```
###### ```alterFriendship()``` is a function that is responsible for updating the friendship value and status based on the value.

Then, despite normal CRUD functionality (such as creating, finding and deleting a Timagotchi), we have a few PUT routes that update values based on user inputs.

```javascript
router.put('/feed/:userId/:timId', async (req, res) => {

    Timagotchi.findOne({ user: req.params.userId, _id: req.params.timId }) // each Timagotchi is attached to a specific user, so that user's id needs to be in local storage on the front end and then passed through to interact with these inputs 
        .then(timagotchi => {
            if (timagotchi && timagotchi.food.status === 'HUNGRY' && timagotchi.alive === true) { //can't feed a timagotchi that is already full
                if (timagotchi.food.value < 100) {
                    timagotchi.food.value += 30;
                    timagotchi.friendship.value += 1;
                    evenOut(timagotchi);
                    timagotchi.food.status = 'FULL';
                    timagotchi.save();
                    return res.json({ timagotchi: timagotchi });
                } else {
                    return res.json({ message: `${timagotchi.name} can't be fed right now` });
                }
            } else {
                return res.json({ message: `${timagotchi.name} can't be fed right now` });
            }
        })
        .catch(error => {
            console.log('error', error);
            return res.json({ message: 'There was an issue, please try again' });
        });

});
```
Finally, we have set up functionality to send a user an email to remind them their Timagtochi needs some love with the following code:
```javascript
const checkForEmail = async () => {
    try {
        const users = await User.find({}); //needs to find all users, and then their Timagotchis
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const tims = await Timagotchi.find({ user: user._id });
            for (let j = 0; j < tims.length; j++) {
                const tim = tims[j];
                if (tim.food.value < 15 && tim.food.value > 0 && tim.alive) { //won't send an email if it's already perished
                    const toEmail = user.email;
                    const subject = 'Your Timagotchi is hungry!';
                    const message = `${tim.name} is hungry! Please feed them!`;
                    sendEmail(toEmail, subject, message);
                }
            }
        }
    } catch (error) {
        console.error('Error updating value:', error);
    }
}

function sendEmail(toEmail, subject, message) {
    // send mail with defined transport object
    const mailOptions = {
        from: 'timagotchi.app@gmail.com', // sender address
        to: toEmail, // list of receivers
        subject: subject, // Subject line
        html: message, // html body
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log("Message sent: %s", info.messageId);
    });
}
```

And, there we have the basics of how the there are ongoing functions that constantly update the models, as well as user inputs! 

## Technologies Used
Node.JS

Express 

MongoDB

Mongoose 

Heroku (Deployment)

### Dependencies
bcryptjs

node-cron

nodemailer

nodemon

passport 

jwt

## Future Development 
We would like to add more animal types and options, as well as a game that you can play with your Timagotchi to earn some sort of currency. Much of that is still in the planning phase. 

