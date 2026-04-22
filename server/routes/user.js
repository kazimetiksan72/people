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

    const body = _.pick(req.body, ['email', 'password', 'ePosta', 'matrikul'])
    const email = body.email || body.ePosta
    const password = body.password || body.matrikul

    console.log('sign body', body)

    User.findByCredentials(email, password).then((user) => {

        console.log('found route', user)
        return user.generateAuthToken().then((xauth) => {
            res.header('xauth', xauth).send(user)
        })
    }).catch((e) => {
        res.status(401).send(e)
    })
})

router.post('/signup', async (req, res) => {

    const body = _.pick(req.body, ['email', 'password', 'name', 'ePosta', 'matrikul', 'adSoyad'])

    const obj = new User({
        ePosta: body.email || body.ePosta,
        matrikul: body.password || body.matrikul,
        sifre: body.password || body.matrikul,
        role: 'user',
        adSoyad: body.name || body.adSoyad
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

router.post('/user/me/change-password', authenticate, async (req, res) => {

    const body = _.pick(req.body, ['currentPassword', 'newPassword'])
    const currentPassword = String(body.currentPassword || '')
    const newPassword = String(body.newPassword || '')

    if (!currentPassword || !newPassword) {
        return res.status(400).send({ errorMessage: 'Mevcut şifre ve yeni şifre zorunludur.' })
    }

    if (newPassword.length < 4) {
        return res.status(400).send({ errorMessage: 'Yeni şifre en az 4 karakter olmalıdır.' })
    }

    const expectedPassword = req.user.sifre || req.user.matrikul
    if (expectedPassword !== currentPassword) {
        return res.status(400).send({ errorMessage: 'Mevcut şifre hatalı.' })
    }

    req.user.sifre = newPassword
    req.user.updatedAt = new Date()
    await req.user.save()

    res.send({ success: true })
})

router.delete('/user/:_id', authenticate, async (req, res) => {
    const allowedEmail = 'kazim@pikselmutfak.com'
    const requesterEmail = String(req.user?.ePosta || '').trim().toLowerCase()
    if (requesterEmail !== allowedEmail) {
        return res.status(403).send({ errorMessage: 'Bu işlem için yetkiniz yok.' })
    }

    const reason = String(req.body?.reason || '').trim()
    if (!reason) {
        return res.status(400).send({ errorMessage: 'Silme nedeni zorunludur.' })
    }

    const updatedUser = await User.findOneAndUpdate({
        _id: req.params._id
    }, {
        listedeGorunsun: false,
        silinmeNedeni: reason,
        silinmeTarihi: new Date()
    }, {
        new: true
    })
    if (!updatedUser) {
        return res.status(404).send({ errorMessage: 'Kullanıcı bulunamadı.' })
    }
    res.send(updatedUser)
});

router.post('/user/:_id/deceased', authenticate, async (req, res) => {
    const allowedEmail = 'kazim@pikselmutfak.com'
    const requesterEmail = String(req.user?.ePosta || '').trim().toLowerCase()
    if (requesterEmail !== allowedEmail) {
        return res.status(403).send({ errorMessage: 'Bu işlem için yetkiniz yok.' })
    }

    const updatedUser = await User.findOneAndUpdate({
        _id: req.params._id
    }, {
        vefatEtti: true
    }, {
        new: true
    })

    if (!updatedUser) {
        return res.status(404).send({ errorMessage: 'Kullanıcı bulunamadı.' })
    }

    res.send(updatedUser)
})

router.patch('/user/:_id', authenticate, async (req, res) => {

    const isAdmin = req.user?.role === 'admin'
    const isSelf = String(req.user?._id) === String(req.params._id)
    if (!isAdmin && !isSelf) {
        return res.status(403).send({ errorMessage: 'Bu işlem için yetkiniz yok.' })
    }

    const body = _.pick(req.body, [
        'name',
        'adSoyad',
        'ePosta',
        'matrikul',
        'tlfGsmEvIs',
        'evAdresi',
        'isAdresi',
        'dogumTarihi',
        'dogumYeri',
        'kanGrubu',
        'meslegi',
        'isi',
        'medeniHali',
        'esininAdi',
        'dogumTarihi2',
        'cocuklar',
        'dogumTarihleri',
        'cocukBilgileri'
    ])
    const update = {
        ...body,
        adSoyad: body.adSoyad || body.name
    }

    if (Array.isArray(body.cocukBilgileri)) {
        const normalizedChildren = body.cocukBilgileri
            .map((child) => ({
                ad: String(child?.ad || '').trim(),
                dogumTarihi: String(child?.dogumTarihi || '').trim()
            }))
            .filter((child) => child.ad || child.dogumTarihi)

        update.cocukBilgileri = normalizedChildren
        update.cocuklar = normalizedChildren.map((child) => child.ad).filter(Boolean).join(', ')
        update.dogumTarihleri = normalizedChildren.map((child) => child.dogumTarihi).filter(Boolean).join(', ')
    }

    const obj = await User.findOneAndUpdate({
        _id: req.params._id
    }, {
        ...update
    }, {
        new: true
    })

    res.send(obj)
});

router.get('/users', authenticate, async (req, res) => {

    const users = await User.find({})
    console.log('users found', users)
    res.send(users)
});

router.get('/user/me', authenticate, async (req, res) => {

});

module.exports = router;
