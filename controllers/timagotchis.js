//Imports
require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { JWT_SECRET } = process.env;
const { Timagotchi } = require('../models');


router.get('/', (req, res) => {
    Timagotchi.find({})
        .then(timagotchis => {
            console.log('timagotchis', timagotchis); 
            res.header("Access-Control-Allow-Origin", "*");
            res.json(timagotchis)
        })
        .catch(err => console.log(err))
        res.header("Access-Control-Allow-Origin", "*");
        res.json({ message: 'There was an issue, please try again...' });   
}); 

router.get('/my-timagotchis', async (req, res) => {
    try {

        const currentUser = req.query.userIds;
        const timagotchi = await Timagotchi.find({ user: { $in: currentUser } })
        res.json({ timagotchi });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:userId/:timId', (req, res) => {
    Timagotchi.find({ user: req.params.userId, id: req.params.timId })
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
})

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
        age: 0,
        friendship: {
            value: 30,
            status: 'neutral'
        },
        food: 50,
        mood: 50,
        user: req.body.user
    })
    .then((newTimagotchi) => {
        console.log('new Timagotchi created =>', newTimagotchi);
        return res.json({ timagotchi: newTimagotchi });
    })
    .catch((error) => {
        console.log('error', error);
        return res.json({ message: 'error occured, please try again.' });

    });
})

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
})


module.exports = router;