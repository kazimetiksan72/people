var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
})
.catch((err) => {
    console.log({err})
})

module.exports = {mongoose};
