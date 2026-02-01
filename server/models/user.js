const mongoose = require('mongoose')
const _ = require('lodash')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const secretWord = 's@me!secret'

const UserSchema = new mongoose.Schema({
  matrikul: {
    type: String
  },
  idaMatrikul: {
    type: String
  },
  adSoyad: {
    type: String
  },
  tekrisTarihi: {
    type: String
  },
  dogumYeri: {
    type: String
  },
  dogumTarihi: {
    type: String
  },
  kanGrubu: {
    type: String
  },
  meslegi: {
    type: String
  },
  isi: {
    type: String
  },
  medeniHali: {
    type: String
  },
  esininAdi: {
    type: String
  },
  dogumTarihi2: {
    type: String
  },
  cocuklar: {
    type: String
  },
  dogumTarihleri: {
    type: String
  },
  evAdresi: {
    type: String
  },
  isAdresi: {
    type: String
  },
  tlfGsmEvIs: {
    type: String
  },
  ePosta: {
    type: String
  },
  xauth: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

UserSchema.methods.generateAuthToken = function () {
  const user = this
  const xauth = jwt.sign({_id: user._id.toHexString()}, secretWord).toString()

  user.xauth = xauth

  return user.save().then(() => {
    return xauth
  })
};

// UserSchema.statics.findByToken = async function (xauth) {
//   const User = this
//   let decoded

//   try {
//     decoded = jwt.verify(xauth, secretWord)
//   } catch (e) {

//     return Promise.reject()
//   }

//   console.log('d', decoded)

//   return User.findOne({
//     _id: decoded._id,
//     xauth
//   })
// }

UserSchema.statics.findByCredentials = function (ePosta, matrikul) {

  // console.log(email, password)

  const User = this
  return User.findOne({ePosta, matrikul})
  .then((user) => {

    console.log('found model', user)

    if (!user) {
      return Promise.reject()
    }

    return new Promise((resolve, reject) => {

    console.log('found model one', user.matrikul, matrikul)

    if (user.matrikul === matrikul) {
        return resolve(user)
      } else {
        return reject()
      }
    })
  })
}

// UserSchema.pre('save', function (next) {

//   const user = this

//   if (user.isNew) {
//     user.createdAt = new Date().toISOString()
//     user.updatedAt = user.createdAt
//   }

//   else {
//     user.updatedAt = new Date().toISOString()
//   }

//   console.log('nexr', next)

//   next()

//   // if (user.isModified('password')) {

//   //   bcrypt.genSalt(10, (err, salt) => {
//   //       bcrypt.hash(user.password, salt, (err, hash) => {
//   //           user.password = hash
//   //           next()
//   //       })
//   //   })
//   // } else {
//   //   next()
//   // }
// })

UserSchema.statics.findByEmail = function (email, password) {

  console.log(email, password)

  const User = this
  return User.findOne({email})
  .then((user) => {

    console.log('found user', user)

    if (!user) {
      return Promise.reject()
    }

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user)
        }

        else {
          reject()
        }
      })
    })
  })
}


UserSchema.methods.toJSON = function () {
  const o = this;

  const oObject = o.toObject();

  return _.pick(oObject, ['_id', 'adSoyad', 'ePosta', 'matrikul', 'idaMatrikul', 'tekrisTarihi', 'dogumYeri', 'dogumTarihi', 'kanGrubu', 'meslegi', 'isi', 'medeniHali', 'esininAdi', 'dogumTarihi2', 'cocuklar', 'dogumTarihleri', 'evAdresi', 'isAdresi', 'tlfGsmEvIs', 'ePosta']);
};

const User = mongoose.model('User', UserSchema);

module.exports = {User};