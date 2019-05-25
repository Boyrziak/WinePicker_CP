const
    express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    // config = require('config'),
    path = require('path'),
    url = require('url'),
    fs = require('fs'),
    formidable = require('formidable'),
    multer = require('multer'),
    mkdirp = require('mkdirp');
MongoClient = require('mongodb').MongoClient,
    app = express(bodyParser.json()),
    mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true}),
    router = express.Router();
port = 1603;

let storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './uploads');
    },
    filename: (req, file, callback) => {
        callback(null, file.fieldname + '-' + Date.now());
    }
});

let upload = multer({storage: storage}).single('userPhoto');

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
        // res.sendFile(path.join(__dirname+'/list.html'));
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
    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:63342');
    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    const collection = req.app.locals.collection;
    collection.findOne({place_id: req.query.place}, (err, result) => {
        console.log(result);
        res.send(result);
    });
});

router.get('/editPlace', (req, res) => {
    console.log(req.query);
    const collection = req.app.locals.collection;
    // collection.updateOne({place_id: req.query.place}, {$set: {main_color: req.query.main_color, user_color: req.query.user_color, default_message: req.query.default_message, website_url: req.query.website_url, active: req.query.active, widget_avatar: req.query.widget_avatar}}, (err, result) => {
    collection.updateOne({place_id: req.query.place_id}, {$set: req.query}, (err, result) => {
        if (err) {
            console.log('Error');
            return console.log(err);
        }
        // console.log(result);
        res.send(result);
    });
});

router.get('/new', (req, res) => {
    console.log(req.path);
    res.sendFile(path.join(__dirname + '/index.html'));
    console.log('New place');
});

router.get(/(\w)*\.(\w)*/i, (req, res) => {
    // console.log(req.path);
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

router.post('/uploadImage', (req, res) => {
    console.log('Place for image: ' + req.query.place);
    console.log(req.files);
    let dir = path.join(__dirname + '/images/' + req.query.place);
    if (!fs.existsSync(dir)) {
        fs.mkdir(dir, {recursive: true}, err => {
        })
    }
    let currentURL = req.protocol + '://' + req.hostname;
    let form = new formidable.IncomingForm();
    form.uploadDir = dir;
    form.on('file', (field, file) => {
        let fileType = /\w*\/(\w*)/i.exec(file.type)[1];
        console.log(form.uploadDir + '/widget_avatar.'+fileType);
        fs.rename(file.path, form.uploadDir + '/widget_avatar.'+fileType, () => {
        });
    });
    form.parse(req, function (err, fields, files) {
        let response = '\n' +
            '    <link href="https://fonts.googleapis.com/css?family=Roboto:400,500" rel="stylesheet">\n' +
            '    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css"\n' +
            '          integrity="sha384-oS3vJWv+0UjzBfQzYUhtDYW+Pj2yciDJxpsK1OYPAYjqT085Qq/1cq5FLXAZQ7Ay" crossorigin="anonymous">\n' +
            '    <link href="../../static/style.css" type="text/css" rel="stylesheet">' +
            '<h1 class="header_text">\n' +
            '    Entry successfully updated\n' +
            '</h1>\n' +
            '<a class="entry_edit small" id="home_button" href="..">\n' +
            '    <div>Main page <i class="fas fa-home"></i></div>\n' +
            '</a>';
        if (err) {
            console.log('Error uploading');
        }
        let fileMime = /(\w*)\/\w*/i.exec(files.widget_avatar.type)[1];
        if (fileMime !== 'image') {
            console.log('File not found');
            res.send(response);
            return;
        }
        console.log('File uploaded');
        const collection = req.app.locals.collection;
        collection.findOneAndUpdate({place_id: req.query.place}, {$set: {widget_avatar: currentURL + '/images/' + req.query.place + '/widget_avatar.png'}}, (err, result) => {
            if (err) {
                // console.log('Error');
                return console.log(err);
            }
            console.log(result);
            res.send(response);
        });
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

