//
// NewsWatcher application
//

// "require" statements to bring in needed Node Modules
// require('newrelic');
var express = require('express'); // For route handlers and templates to serve up.
var path = require('path'); // Populating the path property of the request
var logger = require('morgan'); // HTTP request logging
var responseTime = require('response-time'); // For code timing checks for performance logging
var helmet = require('helmet'); // Helmet module for HTTP header hack mitigations
var rateLimit = require('express-rate-limit'); // IP based rate limiter
const compression = require('compression');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

var users = require('./routes/users');
var session = require('./routes/session');
var sharedNews = require('./routes/sharedNews');
var homeNews = require('./routes/homeNews');

var app = express();
app.enable('trust proxy'); // Since we are behind Nginx load balancing with Elastic Beanstalk
app.use(compression());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 2000, // limit each IP address per window
  delayMs: 0, // disable delaying - full speed until the max limit is reached 
  message: { message: 'You have exceeded the request limit!' },
	standardHeaders: false, // Disable return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Return true to skip the rate limit testing, or false to proceed with limiting
    // We are using the ApiZapi.com load testing tool to test NewsWatcher and do not want to be rate limited for all our own calls
    // So we have added a special header value that we can check for and by pass the rate limiting!
    // This is because traffic could come from just a few IP addresses
    if (req.headers['x-skip-rl-code'] === process.env.SKIP_RATE_LIMIT_CODE) {
      return true;
    }
  }
})
app.use(limiter);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", 'ajax.googleapis.com', 'maxcdn.bootstrapcdn.com'],
        "style-src": ["'self'", "'unsafe-inline'", 'maxcdn.bootstrapcdn.com'],
        "font-src": ["'self'", 'maxcdn.bootstrapcdn.com'],
        "img-src": ["'self'",  'https://static01.nyt.com/', 'data:']
        // reportUri: '/report-violation',
      },
    },
    crossOriginEmbedderPolicy: false
  })
);

// Adds an X-Response-Time header to responses to measure response times
app.use(responseTime());

// logs all HTTP requests. The "dev" option gives it a specific styling
app.use(logger('dev'));

// Sets up the response object in routes to contain a body property with an object of what is parsed from a JSON body request payload
// There is no need for allowing a huge body, it might be some type of attack, so use the limit option
// app.use(express.json({limit: '100kb'}));
app.use(express.json())

// app.get('/apizapiverify.txt', function (req, res) {
//   res.sendFile(path.join(__dirname, 'apizapiverify.txt'));
// });

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Simplifies the serving up of static content such as HTML for the React SPA, images, CSS files, and JavaScript files
app.use(express.static(path.join(__dirname, 'build')));

//
// MongoDB database connection initialization
//
var db = {};
var MongoClient = require('mongodb').MongoClient;

//Use connect method to connect to the Server
MongoClient.connect(process.env.MONGODB_CONNECT_URL, { useNewUrlParser: true, useUnifiedTopology: true, minPoolSize: 10, maxPoolSize: 100 }, function (err, client) {
  if (err === undefined || err === null) {
    db.client = client;
    db.collection = client.db('newswatcherdb').collection('newswatcher');
    console.log("Connected to MongoDB server");
  } else {
    console.log("Failed to connected to MongoDB server");
    console.log(err);
    process.exit(0);
  }
});

// If our process is shut down, close out the database connections gracefully
process.on('SIGINT', function () {
  console.log('MongoDB connection close on app termination');
  db.client.close();
  process.exit(0);
});

process.on('SIGUSR2', function () {
  console.log('MongoDB connection close on app restart');
  db.client.close();
  process.kill(process.pid, 'SIGUSR2');
});

// Set the database connection for middleware usage
app.use(function (req, res, next) {
  req.db = db;
  next();
});

//
// Rest API routes
app.use('/api/users', users);
app.use('/api/sessions', session);
app.use('/api/sharednews', sharedNews);
app.use('/api/homenews', homeNews);
app.get('/heartbeat', function (req, res) {
  res.status(200).json({
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now()
  })
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
    if (err.status)
      res.status(err.status).json({ message: err.toString(), error: err });
    else
      res.status(500).json({ message: err.toString(), error: err });
    console.log(err);
  });
}

app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
  console.log(err);
  if (err.status)
    res.status(err.status).json({ message: err.toString(), error: {} });
  else
    res.status(500).json({ message: err.toString(), error: {} });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
  server.keepAliveTimeout = 65000; // TODO: Need this in here according to articles to be greater than the ALB timeout of 60K
  console.log('Express server listening on port ' + server.address().port);
});

server.db = db;
console.log(`Worker ${process.pid} started`);
module.exports = server;
