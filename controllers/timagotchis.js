//Imports
require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const cron = require('node-cron');
const { JWT_SECRET, EMAIL_APP_PASSWORD } = process.env;
const { Timagotchi, User } = require('../models');


//----------------------FUNCTIONS----------------------//

//decreasing food and mood value every second
setInterval(async () => {
    try {
        const tims = await Timagotchi.find({});
        for (i in tims) {
            let tim = tims[i];
            if (tim.food.value > 0) {
                tim.food.value -= 0.00077;
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
                tim.cleanliness.value -= (0.00077 * 2);
                tim.mood.value -= (0.00077 * 2);
            }
            evenOut(tim);
            await tim.save();
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
            if (tim.food.value > 50 && tim.friendship.value <= 100 || tim.mood.value > 50 && tim.friendship.value <= 100 || tim.cleanliness.value > 50 && tim.friendship.value <= 100) {
                tim.friendship.value += 0.000165; //If food or mood is above 50, friendship increases. Reaches full in 1 week
                evenOut(tim);
                await tim.save();
            } else if (tim.food.value < 50 || tim.mood.value < 50 || tim.cleanliness.value < 50) {
                tim.friendship.value -= 0.00013;
                evenOut(tim);
                await tim.save();
            }
            await checkFriendship(tim);
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
            if (tim.food.value === 0) {
                tim.alive = false;
                tim.image = 'https://i.imgur.com/2En7QUb.png';
                await tim.save();
            }
        }
    } catch (error) {
        console.error('Error updating value:', error);
    }

}, 1000 * 60 * 60 * 2);

//sending email notif if Tima is deathly hungry
setInterval(async () => {
    try {
        const users = await User.find({});
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const tims = await Timagotchi.find({ user: user._id });
            for (let j = 0; j < tims.length; j++) {
                const tim = tims[j];
                if (tim.food.value < 15 && tim.food.value > 0 && tim.alive) {
                    const toEmail = user.email;
                    const subject = 'Your Timagotchi is hungry!';
                    const message = `${tim.name} is hungry! Please feed them!`;
                    sendEmail(toEmail, subject, message)
                }
            }
        }
    } catch (error) {
        console.error('Error updating value:', error);
    }

}, 1000 * 60 * 60);

//resesting food and mood status every 6 hours
setInterval(async () => {
    try {
        const tims = await Timagotchi.find({});
        for (i in tims) {
            let tim = tims[i];
            if (tim.food.status === "FULL" && tim.food.value < 70) {
                tim.food.status = "HUNGRY";
            }
            if (tim.mood.status === "TIRED" && tim.mood.value < 70) {
                tim.mood.status = "BORED"
            }
            tim.save();
        }
    } catch (error) {
        console.error('Error updating value:', error);
    }
}, 1000 * 60 * 60 * 6);

//setting hasPooped to true based on Food status
setInterval(async () => {
    try {
        const tims = await Timagotchi.find({});
        for (i in tims) {
            let tim = tims[i];
            if (tim.food.status === "FULL") {
                tim.hasPooped = true;
                tim.cleanliness.value -= 30;
                tim.cleanliness.status = "DIRTY";
                evenOut(tim);
                await tim.save();
            }
            
        }
    } catch (error) {
        console.error('Error updating value:', error);
    }
}, 1000 * 60 * 60 * 3);

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
    if (tim.type === 'CAT' && tim.friendship.value >= 80) {
        tim.friendship.status = 'BEST FRIENDS';
        tim.image = 'https://i.imgur.com/PM51tMH.png';
        tim.save();
    } else if (tim.type === 'CAT' && tim.friendship.value <= 20) {
        tim.friendship.staus = 'ENEMIES';
        tim.image = 'https://i.imgur.com/kVqOjbT.png';
        tim.save();
    } else if (tim.type === 'DOG' && tim.friendship.value >= 80) {
        tim.friendship.status = 'BEST FRIENDS';
        tim.image = 'https://i.imgur.com/FZucWaU.png';
        tim.save();
    } else if (tim.type === 'DOG' && tim.friendship.value <= 20) {
        tim.friendship.status = 'ENEMIES';
        tim.image = 'https://i.imgur.com/UkKFw6e.png';
        tim.save();
    }
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
    if (tim.cleanliness.value < 0) {
        tim.cleanliness.value = 0;
    }
    if (tim.cleanliness.value > 100) {
        tim.cleanliness.value = 100;
    }
    if (tim.friendship.value > 100) {
        tim.friendship.value = 100;  
    }
    if (tim.friendship.value < 0) {
        tim.friendship.value = 0;
    }

    return tim;
}

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'timagotchi.app@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD  // app password from your gmail account
    }
});


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
router.get('/my-timagotchis/:userId', async (req, res) => {
    Timagotchi.find({ user: req.params.userId })
        .then(timagotchis => {
            if (timagotchis) {
                return res.json(timagotchis);
            } else {
                return res.json({ message: 'No Timagotchi Found' });
            }
        })
        .catch(error => {
            console.log('error', error);
            return res.json({ message: 'There was an issue, please try again' });
        });
});

//get a tim by userId and timId
router.get('/:timId', (req, res) => {
    Timagotchi.findOne({ _id: req.params.timId })
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
    if (req.body.type === 'DOG') {
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

    Timagotchi.findOne({ user: req.params.userId, _id: req.params.timId })
        .then(timagotchi => {
            if (timagotchi && timagotchi.food.status === 'HUNGRY' && timagotchi.alive === true) {
                if (timagotchi.food.value < 100) {
                    timagotchi.food.value += 30;
                    timagotchi.friendship.value += 1;
                    evenOut(timagotchi);
                    timagotchi.food.status = 'FULL'
                    console.log('timagotchi', timagotchi.food.status);
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

router.put('/play/:userId/:timId', async (req, res) => {

    Timagotchi.findOne({ user: req.params.userId, _id: req.params.timId })
        .then(timagotchi => {
            if (timagotchi && timagotchi.mood.status === 'BORED' && timagotchi.alive === true) {
                if (timagotchi.mood.value < 100) {
                    timagotchi.mood.value += 30;
                    timagotchi.friendship.value += 1;
                    evenOut(timagotchi);
                    timagotchi.mood.status = 'TIRED'
                    timagotchi.save();
                    return res.json({ timagotchi: timagotchi });
                } else {
                    return res.json({ message: `${timagotchi.name} can't play right now` });
                }
            } else {
                return res.json({ message: `${timagotchi.name} can't play right now` });
            }
        })
        .catch(error => {
            console.log('error', error);
            return res.json({ message: 'There was an issue, please try again' });
        });

});

router.put('/clean/:userId/:timId', async (req, res) => {

    Timagotchi.findOne({ user: req.params.userId, _id: req.params.timId })
        .then(timagotchi => {
            if (timagotchi.alive === true) {
                timagotchi.cleanliness.value += 30;
                timagotchi.friendship.value -= 1;
                evenOut(timagotchi);
                if (timagotchi.cleanliness.value > 80) {
                    timagotchi.cleanliness.status = 'CLEAN'
                }
                timagotchi.save();
                return res.json({ timagotchi: timagotchi });
            }
        })
        .catch(error => {
            console.log('error', error);
            return res.json({ message: 'There was an issue, please try again' });
        });

});

router.put('/pooperscooper/:userId/:timId', async (req, res) => {

    Timagotchi.findOne({ user: req.params.userId, _id: req.params.timId })
        .then(timagotchi => {
            timagotchi.hasPooped = false;
            timagotchi.save();
            return res.json({ timagotchi: timagotchi });
        })
        .catch(error => {
            console.log('error', error);
            return res.json({ message: 'There was an issue, please try again' });
        });

});

module.exports = router;