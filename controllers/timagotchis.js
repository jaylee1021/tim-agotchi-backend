//Imports
require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const { JWT_SECRET } = process.env;
const { Timagotchi } = require('../models');

const userAccess = {};

//----------------------FUNCTIONS----------------------//

//decreasing food and mood value every second
setInterval(async () => {
    try {
        const tims = await Timagotchi.find({});
        for (i in tims) {
            let tim = tims[i];
            if (tim.food.value > 0) {
                tim.food.value -= 0.00077;
                await tim.save();
            }
            if (tim.mood.value > 0) {
                tim.mood.value -= 0.00077;
                await tim.save();
            }
        }
    } catch (error) {
        console.error('Error updating value:', error);
    }
}, 1000);

//friendship status changing based on food and mood status 
setInterval(async () => {
    try {
        const tims = await Timagotchi.find({});
        for (i in tims) {
            let tim = tims[i];
            if (tim.food.value > 50 && tim.friendship.value <= 100 || tim.mood.value > 50 && tim.friendship.value <= 100) {
                tim.friendship.value += 0.000165; //If food or mood is above 50, friendship increases. Reaches full in 1 week
                await tim.save();
                if (tim.friendship.value > 100) {
                    tim.friendship.value = 100;
                    await tim.save();
                }
            } else if (tim.food.value < 50 || tim.mood.value < 50) {
                tim.friendship.value -= 0.00013;
                await tim.save();
                if (tim.friendship.value < 0) {
                    tim.friendship.value = 0;
                    await tim.save();
                }
            }
            checkFriendship(tim);
        }
    } catch (error) {
        console.error('Error updating value:', error);
    }
}, 1000);

//checking if alive 
setInterval(async () => {
    try {
        const tims = await Timagotchi.find({});
        for (i in tims) {
            let tim = tims[i];
            if (tim.food.value === 0 && tim.mood.value === 0) {
                tim.alive = false;
                tim.image = 'https://i.imgur.com/2En7QUb.png';
            }
        }
    } catch (error) {
        console.error('Error updating value:', error);
    }
}, 1000 * 60 * 60);

setInterval(async () => {
    try {
        const tims = await Timagotchi.find({});
        for (i in tims) {
            let tim = tims[i];
            if (tim.food.status === "Full") {
                tim.food.status = "Hungry";
            } 
            if (tim.mood.status === "Tired") {
                tim.mood.status = "Bored"
            }
            tim.save();
        }
    } catch (error) {
        console.error('Error updating value:', error);
    }
}, 1000 * 60 * 60 * 6); 

//adding 1 to the age every 24 hours
const addToAge = async () => {
    try {
        const tims = await Timagotchi.find({});
        for (i in tims) {
            let tim = tims[i];
            if (tim.alive) {
                tim.age += 1;
                await tim.save();
            }
        }
    } catch (error) {
        console.error('Error increasing value:', error);
    }
};

cron.schedule('0 1 * * *', () => {
    addToAge();
});

//checking friendship status
function checkFriendship(tim) {
    if (tim.type === 'Cat' && tim.friendship.value >= 80) {
        tim.friendship.status = 'Best Friends';
        tim.image = 'https://i.imgur.com/PM51tMH.png';
    } else if (tim.type === 'Cat' && tim.friendship.value <= 20) {
        tim.friendship.staus = 'Enemies';
        tim.image = 'https://i.imgur.com/kVqOjbT.png'
    } else if (tim.type === 'Dog' && tim.friendship.value >= 80) {
        tim.friendship.status = 'Best Friends';
        tim.image = 'https://i.imgur.com/FZucWaU.png';
    } else if (tim.type === 'Dog' && tim.friendship.value <= 20) {
        tim.friendship.status = 'Enemies';
        tim.image = 'https://i.imgur.com/UkKFw6e.png';
    }
    tim.save();
    return tim;
}

function evenOut(tim) {
    if (tim.food.value < 0) {
        tim.food.value = 0;
    }
    if (tim.mood.value < 0) {
        tim.mood.value = 0;
    }
    if (tim.food.value > 100) {
        tim.food.value = 100;
    }
    if (tim.mood.value > 100) {
        tim.mood.value = 100;
    }
    return tim;
}

//limiting route access
// const limiter = rateLimit({
//     windowMs: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
//     max: 1, // Allow only 1 request every 6 hours
//     message: 'Your Timagotchi is tired. Give it a break!',
//     keyGenerator: (req) => {
//         // Generate a unique key for each user based on IP address, userId, and timId
//         return `${req.params.userId}:${req.params.timId}`;
//     },
//     handler: (req, res) => {
//         // Handle rate limit exceeded
//         res.status(429).json({ message: 'Your Timagotchi is tired. Give it a break!' });
//     },
// });



//----------------------ROUTES----------------------//

//get all tims route
router.get('/', (req, res) => {
    Timagotchi.find({})
        .then(timagotchis => {
            console.log('timagotchis', timagotchis);
            return res.json(timagotchis);
        })
        .catch(err => {
            console.error('Error fetching timagotchis:', err);
            return res.status(500).json({ message: 'There was an issue fetching timagotchis, please try again...' });
        });
});

//get all timagotchis for a specific user
router.get('/my-timagotchis', async (req, res) => {
    try {
        const currentUser = req.query.userIds;
        const timagotchis = await Timagotchi.find({ user: { $in: currentUser } });
        return res.json({ timagotchis });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
});

//get a tim by userId and timId
router.get('/:userId/:timId', (req, res) => {
    Timagotchi.findOne({ user: req.params.userId, _id: req.params.timId })
        .then(timagotchi => {
            if (timagotchi) {
                return res.json({ timagotchi: timagotchi });
            } else {
                return res.json({ message: 'No Timagotchi Found' });
            }
        })
        .catch(error => {
            console.log('error', error);
            return res.json({ message: 'There was an issue, please try again' });
        });
});

//create a new timagotchi
router.post('/new', (req, res) => {
    let image;
    console.log('data from request', req.body);
    if (req.body.type === 'Dog') {
        image = 'https://i.imgur.com/V3oECuL.png';
    } else {
        image = 'https://i.imgur.com/P7uFNKA.png';
    }
    Timagotchi.create({
        name: req.body.name,
        image: image,
        type: req.body.type,
        gender: req.body.gender,
        user: req.body.user,
    })
        .then((newTimagotchi) => {
            console.log('new Timagotchi created =>', newTimagotchi);
            return res.json({ timagotchi: newTimagotchi });
        })
        .catch((error) => {
            console.log('error', error);
            return res.json({ message: 'error occured, please try again.' });

        });
});

//delete a timagotchi
router.delete('/:id', (req, res) => {
    Timagotchi.findByIdAndDelete(req.params.id)
        .then(timagotchi => {
            if (timagotchi) {
                return res.json({ message: 'Timagotchi Deleted' });
            } else {
                return res.json({ message: 'No Timagotchi Found' });
            }
        })
        .catch(error => {
            console.log('error', error);
            return res.json({ message: 'There was an issue, please try again' });
        });
});



//update a timagotchi's name
router.put('/:id', async (req, res) => {
    try {
        const timagotchiId = req.params.id;
        const newName = req.body.name;

        if (!newName) {
            return res.status(400).json({ message: 'New name is required.' });
        }

        const updatedTimagotchi = await Timagotchi.findByIdAndUpdate(
            timagotchiId,
            { name: newName },
            { new: true }
        );

        if (!updatedTimagotchi) {
            return res.status(404).json({ message: 'Timagotchi not found.' });
        }

        return res.json({
            message: 'Timagotchi updated successfully.',
            timagotchi: updatedTimagotchi
        });
    } catch (error) {

        console.log('Error inside PUT /timagotchis/:id', error);
        return res.status(500).json({ message: 'Error occurred, please try again.' });

    }
});

router.put('/feed/:userId/:timId', async (req, res) => {
    // const userKey = `${req.params.userId}:${req.params.timId}`;

    // if (userAccess[userKey] && Date.now() - userAccess[userKey] < 6 * 60 * 60 * 1000) {
    //     return res.status(429).json({ message: 'You cannot feed the same Timagotchi within 6 hours.' });
    // }

    Timagotchi.findOne({ user: req.params.userId, _id: req.params.timId })
        .then(timagotchi => {
            if (timagotchi && timagotchi.food.status === 'Hungry') {
                if (timagotchi.food.value < 100) {
                    timagotchi.food.value += 30;
                    evenOut(timagotchi);
                    timagotchi.food.status = 'Full'
                    console.log('timagotchi', timagotchi.food.status);
                    timagotchi.save();
                    return res.json({ timagotchi: timagotchi });
                } else {
                    return res.json({ message: `${timagotchi.name} is full` });
                }
            } else {
                return res.json({ message: `${timagotchi.name} is full` });
            }
        })
        .catch(error => {
            console.log('error', error);
            return res.json({ message: 'There was an issue, please try again' });
        });

});

router.put('/play/:userId/:timId', async (req, res) => {
    // const userKey = `${req.params.userId}:${req.params.timId}`;

    // if (userAccess[userKey] && Date.now() - userAccess[userKey] < 6 * 60 * 60 * 1000) {
    //     return res.status(429).json({ message: 'You cannot feed the same Timagotchi within 6 hours.' });
    // }

    Timagotchi.findOne({ user: req.params.userId, _id: req.params.timId })
        .then(timagotchi => {
            if (timagotchi && timagotchi.mood.status === 'Bored') {
                if (timagotchi.mood.value < 100) {
                    timagotchi.mood.value += 30;
                    evenOut(timagotchi);
                    timagotchi.mood.status = 'Tired'
                    timagotchi.save();
                    return res.json({ timagotchi: timagotchi });
                } else {
                    return res.json({ message: `${timagotchi.name} is tuckered out!` });
                }
            } else {
                return res.json({ message: `${timagotchi.name} is tuckered out!` });
            }
        })
        .catch(error => {
            console.log('error', error);
            return res.json({ message: 'There was an issue, please try again' });
        });

});

module.exports = router;

