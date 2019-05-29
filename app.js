const
    express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    path = require('path'),
    multer = require('multer'),
    MongoClient = require('mongodb').MongoClient,
    sharp = require('sharp'),
    app = express(bodyParser.json()),
    nodemon = require('nodemon'),
    mongoClient = new MongoClient("mongodb://127.0.0.1:27017/", {useNewUrlParser: true}),
    router = express.Router();
port = 1603;

const upload = multer({
    limits: {
        fileSize: 4 * 1024 * 1024,
    }
});

app.use('/', router);

mongoClient.connect((err, client) => {
    if (err) {
        return console.log(err);
    }
    app.locals.collection = client.db("wine_picker").collection('places');
});

app.listen(port, (err, req, res) => {
    if (err) return console.log(`Something bad has happen : ${err}`);
    console.log(`Server listening at port ${port}`);
});

app.use('/css', express.static(path.resolve(__dirname + '/static')));

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/list.html'));
    console.log('Main page');
});

router.get('/places', (req, res) => {
    const collection = req.app.locals.collection;
    collection.find({}).toArray((err, places) => {
        if (err) {
            return console.log(err);
        }
        res.send(places);
    });
});

router.get(/\/edit\/\d*/i, (req, res) => {
    console.log(req.path);
    res.sendFile(path.join(__dirname + '/edit.html'));
    console.log('Editing page');
});

router.get('/getEditedPlace', (req, res) => {
    console.log(req.query);
    const collection = req.app.locals.collection;
    collection.findOne({place_id: req.query.place}, (err, result) => {
        console.log(result);
        res.send(result);
    });
});

router.get('/editPlace', (req, res) => {
    console.log(req.query);
    const collection = req.app.locals.collection;
    collection.updateOne({place_id: req.query.place_id}, {$set: req.query}, (err, result) => {
        if (err) {
            console.log('Error');
            return console.log(err);
        }
        res.send(result);
    });
    collection.updateOne({place_id: req.query.place_id}, {$set: {place_id: req.query.new_place}}, (err, result) => {
        if (err) {
            console.log('Error');
            return console.log(err);
        }
        console.log('Updated');
    });
});

router.get('/new', (req, res) => {
    console.log(req.path);
    res.sendFile(path.join(__dirname + '/index.html'));
    console.log('New place');
});

router.get(/(\w)*\.(\w)*/i, (req, res) => {
    if (req.path !== '/APITest') {
        res.sendFile(path.join(__dirname + req.path));
    }
});

router.get('/APIWriteData', (req, res) => {
    console.log(req.query);
    const collection = req.app.locals.collection;
    collection.findOne({place_id: req.query.place_id}, (err, result) => {
        console.log(result);
        if (!result) {
            console.log('Creating new entry...');
            collection.insertOne(req.query, (err, result) => {
                if (err) {
                    return console.log(err);
                }
                console.log(result.ops);
                res.send(result);
            });
        } else {
            console.log('Duplicate place');
            res.send(404);
        }
    });
});

router.post('/uploadImage', upload.single('widget_avatar'), async (req, res)=>{
   let imagePath = path.join(__dirname, '/images/'+req.query.place_id + '/widget_avatar.png');
   console.log(req.widget_avatar);
   if (!req.file) {
       console.log('File not found');
       res.status(401).json({error: 'Please provide an image'});
   }
   sharp(req.file.buffer).resize(50,50,{
       fit: sharp.fit.inside,
       withoutEnlargement: true
   }).toFile(imagePath);
   console.log('File uploaded to' + imagePath);
    const collection = req.app.locals.collection;
    let currentURL = req.protocol + '://' + req.hostname;
    collection.findOneAndUpdate({place_id: req.query.place_id}, {$set: {widget_avatar: currentURL + '/images/' + req.query.place_id + '/widget_avatar.png'}}, (err, result) => {
        if (err) {
            res.status(401).json({error: err});
        }
        res.status(200).json({success: 'File uploaded sucessfully'});
    });
});

router.get('/deleteEntry', (req, res) => {
    console.log(req.query);
    const collection = req.app.locals.collection;
    collection.deleteOne({place_id: req.query.place}, (err, result) => {
        if (err) {
            return console.log(err);
        }
    });
});

