var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect('mongodb+srv://qurra:glZtKQkHQ2ljyOJu@cluster0.razm1bi.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    socketTimeoutMS: 5000,
    useUnifiedTopology: true
})
.catch((err) => {
    console.log({err})
})

module.exports = {mongoose};