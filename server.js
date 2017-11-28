//
// NewsWatcher application
//

//
// "require" statements to bring in needed Node Modules
//
var express = require('express'); // For route handlers and templates to serve up.
var path = require('path'); // Populating the path property of the request
var logger = require('morgan'); // HTTP request logging
var bodyParser = require('body-parser'); // Easy access to the HTTP request body
var cp = require('child_process'); // Forking a separate Node.js processes
var responseTime = require('response-time'); // For code timing checks for performance logging
var assert = require('assert'); // assert testing of values
var helmet = require('helmet'); // Helmet module for HTTP header hack mitigations
var RateLimit = require('express-rate-limit'); // IP based rate limiter
var csp = require('helmet-csp');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

var users = require('./routes/users');
var session = require('./routes/session');
var sharedNews = require('./routes/sharedNews');
var homeNews = require('./routes/homeNews');

var app = express();
app.enable('trust proxy'); // Since we are behind Nginx load balancing with Elastic Beanstalk

var limiter = new RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes 
  max: 100, // limit each IP to 100 requests per windowMs 
  delayMs: 0 // disable delaying - full speed until the max limit is reached 
});
//  apply to all requests 
app.use(limiter);

app.use(helmet()); // Take the defaults to start with
app.use(csp({
  // Specify directives for content sources
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'ajax.googleapis.com', 'maxcdn.bootstrapcdn.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'maxcdn.bootstrapcdn.com'],
    fontSrc: ["'self'", 'maxcdn.bootstrapcdn.com'],
    imgSrc: ['*']
    // reportUri: '/report-violation',
  }
}));
//app.use(helmet.noCache());

// Adds an X-Response-Time header to responses to measure response times
app.use(responseTime());

// logs all HTTP requests. The "dev" option gives it a specific styling
app.use(logger('dev'));

// Sets up the response object in routes to contain a body property with an object of what is parsed from a JSON body request payload
// There is no need for allowing a huge body, it might be some type of attack, so use the limit option
app.use(bodyParser.json({ limit: '100kb' }));

// This middleware takes any query string key/value pairs and sticks them in the body property
//app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
  // console.log("HERE HERE HERE");
});

// Simplifies the serving up of static content such as HTML, images, CSS files, and JavaScript files
//app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, 'build')));

//
// Fire up the child process that will run in a separate machine core
// and do some background processing. This way, this master process can
// be freed up to keep processing to a minimum on its servicing threads.
var node2 = cp.fork('./worker/app_FORK.js', [], { execArgv: ['--debug=5859'] });
// var node2 = cp.fork('./worker/app_FORK.js');
// node2.on('message', function (m) {
// 	console.log('PARENT got message:', m);
// });
// node2.send({ hello: 'Forked world' });

//
// MongoDB database connection initialization
//
var db = {};
var MongoClient = require('mongodb').MongoClient;

//Use connect method to connect to the Server
MongoClient.connect(process.env.MONGODB_CONNECT_URL, function (err, dbConn) {
  assert.equal(null, err);
  db.dbConnection = dbConn;
  db.collection = dbConn.collection('newswatcher');
  console.log("Connected to MongoDB server");
});

process.on('SIGINT', function () {
  console.log('MongoDB connection close on app termination');
  db.dbConnection.close();
  process.exit(0);
});

process.on('SIGUSR2', function () {
  console.log('MongoDB connection close on app restart');
  db.dbConnection.close();
  process.kill(process.pid, 'SIGUSR2');
});

app.use(function (req, res, next) {
  req.db = db;
  req.node2 = node2;
  next();
});

// For loading the default HTML page that acts as the SPA Web site
// app.get('/', function(req, res) {
//     res.render('index.html')
// });
// app.get('/', function (req, res) {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

//
// Rest API routes
app.use('/api/users', users);
app.use('/api/sessions', session);
app.use('/api/sharednews', sharedNews);
app.use('/api/homenews', homeNews);

//
// Code for running CPU profiling and also memory heap dumps to help find memory leaks
// package.json -> "v8-profiler": "^5.5.0"
// var fs = require('fs');
// var profiler = require('v8-profiler');

// app.post('/testing/startcpuprofile', function(req, res) {
//     profiler.startProfiling();
//     res.status(201).json({ msg: 'CPU profile started' });
// });

// app.post('/testing/stopcpuprofile', function(req, res) {
//     var profileResult = profiler.stopProfiling();

//     profileResult.export()
//         .pipe(fs.createWriteStream('profile.cpuprofile'))
//         .on('finish', function() {
//             profileResult.delete();
//         });

//     res.status(201).json({ msg: 'CPU profile stopped' });
// });

// var snapCount = 0;
// app.post('/testing/takeheapsnapshot', function(req, res) {
//     var snapshot = profiler.takeSnapshot();

//     snapshot.export()
//         .pipe(fs.createWriteStream('snap' + snapCount + '.heapsnapshot'))
//         .on('finish', snapshot.delete);

//     snapCount++;

//     res.status(201).json({ msg: 'Memory HEAP snapshop taken' });
// });

//
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler that will add in a stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500).json({ message: err.toString(), error: err });
    console.log(err);
  });
}

// production error handler with no stacktraces exposed to users
app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({ message: err.toString(), error: {} });
  console.log(err);
});

app.set('port', process.env.PORT || 3000);

//var debug = require('debug')('NewsWatcher');
var server = app.listen(app.get('port'), function () {
  //debug('Express server listening on port ' + server.address().port);
  console.log('Express server listening on port ' + server.address().port);
});
