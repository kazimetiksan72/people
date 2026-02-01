const express = require('express');
const router = express.Router();

const { User } = require('../models/user')

const _ = require('lodash');

const { authenticate } = require('../middleware/authenticate')

router.get('/sample', async (req, res) => {

    const obj = new User({
        matrikul: '123',
        ePosta: 'kazim@etiksan.com'
    })

    console.log('new obj', obj)

    obj.save()
    .then((newUser) => {
        console.log({newUser})
        res.send(newUser)
    })
    .catch((err) => {
        console.log({err})
        res.send('none')
    })
})

router.post('/signin', async (req, res) => {

    const body = _.pick(req.body, ['ePosta', 'matrikul'])

    console.log('sign body', body)

    User.findByCredentials(body.ePosta, body.matrikul).then((user) => {

        console.log('found route', user)
        return user.generateAuthToken().then((xauth) => {
            res.header('xauth', xauth).send(user)
        })
    }).catch((e) => {
        res.status(404).send(e)
    })
})

router.post('/signup', async (req, res) => {

    const body = _.pick(req.body, ['email', 'password', 'name'])

    const obj = new User({
        ...body,
    })

    obj.save()
        .then(() => {
            return obj.generateAuthToken()
        })
        .then(async (xauth) => {

            res.header('xauth', xauth).send(obj)
        })
        .catch((e) => {
            console.log('error', e)
            if (e.code === 11000) {
                res.status(409).send({
                    errorMessage: 'Username already exists'
                })
            } else {
                res.status(401).send(e)
            }
        })
})

router.delete('/user/:_id', async (req, res) => {

    await User.findOneAndRemove({
        _id: req.params._id
    })
    res.sendStatus(200)
});

router.patch('/user/:_id', async (req, res) => {

    const body = _.pick(req.body, ['name'])

    const obj = await User.findOneAndUpdate({
        _id: req.params._id
    }, {
        ...body
    }, {
        new: true
    })

    res.send(obj)
});

router.get('/users', async (req, res) => {

    const users = await User.find({})
    console.log('users found', users)
    res.send(users)
});

router.get('/user/me', authenticate, async (req, res) => {

});

module.exports = router;