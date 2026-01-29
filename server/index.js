// require('./db/mongoose');

const express = require('express');
const cors = require('cors');
const path = require('path')

const app = express();
app.use(cors());

const bodyParser = require('body-parser');
app.use(bodyParser.json());

    // const routeUser = require('./routes/user');
    // app.use('/api',routeUser);

const publicPath = path.join(__dirname, '..', 'build')
app.use(express.static(publicPath))

app.get('/', (req, res) => {

    const arr = req.path.split('/')
    const fileName = arr[arr.length-1]

    if (req.path.startsWith('/files')) {
        const filePath = path.join(__dirname, '..', 'files', fileName)
        res.sendFile(filePath)
    // } else if (req.path.startsWith('/apple-app-site-association')) {
    //     const indexPath = path.join(publicPath, 'apple-app-site-association')
    //     res.sendFile(indexPath)
    // } else if (req.path.startsWith('/.well-known/apple-app-site-association')) {
    //     const indexPath = path.join(publicPath, '.well-known/apple-app-site-association')
    //     res.sendFile(indexPath)
    } else {
        const indexPath = path.join(publicPath, 'index.html')
        res.sendFile(indexPath)
    }
})

app.listen(8080, () => {
    console.log('started');
});