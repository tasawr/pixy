//    MongoStore = require('connect-mongo'),

var express = require('express'),
    graph = require('fbgraph')             ,
    crypto = require('crypto'),
    express = require('express'),
    connect = require('connect')       ,
    http = require('http')     ,
    path = require('path')    ,
    mongoose = require('mongoose'),
    fs = require('fs'),
    sys = require('sys'),
    extname = require('path').extname;

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

try {
    cfg = JSON.parse(fs.readFileSync(process.cwd() + "/config.json"));
} catch (e) {
    // ignore
}

// file loader (for controllers, models, ...)
var loader = function (dir) {
    fs.readdir(dir, function (err, files) {
        if (err) {
            throw err;
        }
        files.forEach(function (file) {
            if ('.js' == extname(file)) {
                console.log(dir + '/' + file.replace('.js', ''));
                require(dir + '/' + file.replace('.js', ''));
            }
        });
    });
};

// enable debugger
if (true == cfg.debug) {
    app.use(express.errorHandler({
        showStack:true,
        dumpExceptions:true
    }));
}

// enable logger
if (true == cfg.logger) {
    app.use(express.logger());
}

// load models
cfg.loader.models.forEach(loader);
//cfg.loader.controllers.forEach(loader);

db = mongoose.connect(cfg.mongodb);

var handleError = function (msg, err, req, res, next) {
    if (req.session) {
        req.session.destroy();
    }
    console.log(msg, err);
    res.json({ success:false, error:err });
};


// load default controller
if (cfg.loader.use_default_controller) {
    app.get('/:collection', function (req, res, next) {
        var model_class = req.params.collection.charAt(0).toUpperCase() + req.params.collection.slice(1);
        var qw = eval(model_class).where('profileId');
        if (req.param('query')) {
            qw.where(req.param('query'));
        }
        if (req.param('order')) {
            var order = [];
            req.param('order').forEach(function (dir, field) {
                order.push([field, dir]);
            });
            qw.sort(order);
        }
        if (req.param('limit')) {
            qw.limit(req.param('limit'));
        }
        if (req.param('offset')) {
            qw.skip(req.param('offset'));
        }
        qw.run(function (err, rows) {
            if (err) {
                handleError('Could not retrieve list of runs', rows, req, res);
                return;
            }
            console.log("Found " + rows.length + " posts.");
            res.json(rows);
        });
    });

    // READ
    app.get('/:collection/:id', function (req, res, next) {
        var model_class = req.params.collection.charAt(0).toUpperCase() + req.params.collection.slice(1);
        qw = eval(model_class).findById(req.params.id);
        qw.run(function (err, rows) {
            if (err) {
                handleError('Could not retrieve list of runs', rows, req, res);
                return;
            }
            console.log("Found " + rows.length + " " + model_class + "s");
            res.json(rows);
        });

    });

    // CREATE
    var createDoc = function (req, res, next) {
        var model_class = req.params.collection.charAt(0).toUpperCase() + req.params.collection.slice(1);
        var doc = new eval(model_class);
        doc.merge(req.param(req.params.collection));
        doc.save(function () {
            res.json(doc, 201);
        });
    };

    app.put('/:collection', createDoc);
    app.post('/:collection', createDoc);

    // MODIFY
    var modifyDoc = function (req, res, next) {
        var model_class = req.params.collection.charAt(0).toUpperCase() + req.params.collection.slice(1);
        eval(model_class).findById(req.params.id, function (doc) {
            if (!doc) {
                next(new NotFound);
            } else {
                doc.merge(req.param(req.params.collection));

                doc.save(function () {
                    res.json(doc.toObject(), 200);
                });
            }
        });
    };

    app.put('/:collection/:id', modifyDoc);
    app.post('/:collection/:id', modifyDoc);

    // REMOVE
    app.del('/:collection/:id', function (req, res, next) {
        var model_class = req.params.collection.charAt(0).toUpperCase() + req.params.collection.slice(1);
        eval(model_class).findById(req.params.id, function (doc) {
            if (!doc) {
                next(new NotFound);
            } else {
                doc.remove(function () {
                    res.json('200 OK', 200);
                });
            }
        });
    });
}

http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
