var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect('mongodb+srv://kazim_db_user:5NV1iUcqdr4wWpQe@cluster0.vppuy6u.mongodb.net/?appName=Cluster0', {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
})
.catch((err) => {
    console.log({err})
})

module.exports = {mongoose};
