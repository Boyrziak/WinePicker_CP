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
    mkdirp = require('mkdirp'),
    jsdom = require('jsdom'),
    MongoClient = require('mongodb').MongoClient,
    sharp = require('sharp'),
    app = express(bodyParser.json()),
    mongoClient = new MongoClient("mongodb://localhost:27017/", {useNewUrlParser: true}),
    // dom = require('express-jsdom')(app),
    router = express.Router();
port = 1603;

// dom.use('jquery');

const upload = multer({
    limits: {
        fileSize: 4 * 1024 * 1024,
    }
});

let approvedPages = ['/about', '/usage', '/instructions'];

approvedPages.forEach((address) => {
    // router.get(address, ()=>{
    //    res.sendFile(path(__dirname + '/about.html'));
    // });
    // $('body').append(`<!--<h1>${address.slice(1, address.length)}</h1>-->`);


    router.get(address, (req, res) => {
        // console.log(req.body);
        // res.send(path.join(__dirname + address));
        let currentURL = req.protocol + '://' + req.hostname + address;
        console.log(currentURL);
        const {JSDOM} = jsdom;
        let htmlStructure = `<!DOCTYPE html><html><head><title>${address.slice(1, address.length)}</title></head> <body><h1 class="title">Test</h1></body></html>`;
        const domStructure = new JSDOM(htmlStructure, {
            url: currentURL,
            referrer: currentURL,
            contentType: 'text/html',
            includeNodeLocations: true,
            storageQuota: 10000000,
            runScripts: 'dangerously'
        }).window;

        let window = domStructure.window;
        let document = window.document;
        let style = document.createElement("style");
        style.setAttribute("type", "text/css");
        let head = document.getElementsByTagName('head')[0];
        head.appendChild(style);
        style = document.styleSheets[document.styleSheets.length - 1];
        style.insertRule(".title {color: #f1824a;}");
        let rule = style.cssRules[0];
        let styleLine = rule.style;
        styleLine.color = '#f1824a';
        // console.log(domStructure);
        // let header
        // res.send(window.innerHTML);
        // console.log(domStructure.window.document);
        // let test = document.querySelector('h1');
        // test.textContent = address.slice(1, address.length);
        // console.log(test.textContent);

        // test.style.color = '#f1824a';
        // const { JSDOM } = jsdom;
        // const { window } = new JSDOM();
        // const { document } = (new JSDOM('')).window;
        // global.document = document;
        // let $ = require('jquery')(window);
        // let title = $('.title');
        // // title.text(title.);
        // title.css('cursor', 'pointer');
        // title.animate({fontSize: '30px', color: '#f1824a'}, 1500, function () {
        //     $(this).animate({position: 'absolute', right: '100px'}, 1500);
        // });
        // title.onclick(()=>{
        //     console.log(title.text());
        // });

        // let body = '<body><h1 class="title">You are on ' + addres + '</h1></body>';
        // console.log(res);
        // parseData(res);
    });
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
    collection.updateOne({place_id: req.query.place_id}, {$set: {place_id: req.query.new_place}}, (err, result) => {
        if (err) {
            console.log('Error');
            return console.log(err);
        }
        console.log('Updated');
        // res.send(result);
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

// router.post('/uploadImage', (req, res) => {
//     console.log('Place for image: ' + req.query.place);
//     console.log(req.files);
//     let dir = path.join(__dirname + '/images/' + req.query.place);
//     if (!fs.existsSync(dir)) {
//         fs.mkdir(dir, {recursive: true}, err => {
//         })
//     }
//     let currentURL = req.protocol + '://' + req.hostname;
//     let form = new formidable.IncomingForm();
//     form.uploadDir = dir;
//     form.on('file', (field, file) => {
//         let fileType = /\w*\/(\w*)/i.exec(file.type)[1];
//         console.log(form.uploadDir + '/widget_avatar.' + fileType);
//         fs.rename(file.path, form.uploadDir + '/widget_avatar.' + fileType, () => {
//         });
//     });
//     form.parse(req, function (err, fields, files) {
//         let response = '<head><title>Place successfully updated</title></head>' +
//             '\n' +
//             '    <link href="https://fonts.googleapis.com/css?family=Roboto:400,500" rel="stylesheet">\n' +
//             '    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css"\n' +
//             '          integrity="sha384-oS3vJWv+0UjzBfQzYUhtDYW+Pj2yciDJxpsK1OYPAYjqT085Qq/1cq5FLXAZQ7Ay" crossorigin="anonymous">\n' +
//             '    <link href="../../static/style.css" type="text/css" rel="stylesheet">' +
//             '<h1 class="header_text">\n' +
//             '    Entry successfully updated\n' +
//             '</h1>\n' +
//             '<a class="entry_edit small" id="home_button" href="..">\n' +
//             '    <div>Main page <i class="fas fa-home"></i></div>\n' +
//             '</a>';
//         if (err) {
//             console.log('Error uploading');
//         }
//         let fileMime = /(\w*)\/(\w*)/i.exec(files.widget_avatar.type);
//         if (fileMime[1] !== 'image') {
//             console.log('File not found');
//             res.send(response);
//             return;
//         }
//         console.log(fileMime);
//         console.log('File uploaded');
//         const collection = req.app.locals.collection;
//         collection.findOneAndUpdate({place_id: req.query.place}, {$set: {widget_avatar: currentURL + '/images/' + req.query.place + '/widget_avatar.' + fileMime[2]}}, (err, result) => {
//             if (err) {
//                 // console.log('Error');
//                 return console.log(err);
//             }
//             console.log(result);
//             res.send(response);
//         });
//     });
// });

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
            // console.log('Error');
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

