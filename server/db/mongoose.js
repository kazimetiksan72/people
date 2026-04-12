var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('Missing required environment variable: MONGODB_URI');
}

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
})
.catch((err) => {
    console.log({err})
})

module.exports = {mongoose};
