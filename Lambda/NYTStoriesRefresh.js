//
// NYTStoriesRefresh.js: An AWS Lambda to off-load processing from the main Node.js ELastic beanstalk process.
// The main Node.js application does not need to have its single thread event processing loop
// burdened by code that takes a while to process.
// Code here will either be run because of a timer fire from AWS Event Bridge,
// or because of a driect call to fire the Lambda
//
var bcrypt = require('bcryptjs');
var https = require("https");
var async = require('async');
var ObjectId = require('mongodb').ObjectId;
var MongoClient = require('mongodb').MongoClient;

const NEWYORKTIMES_CATEGORIES = ["home", "world", "business", "technology"];
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

var globalNewsDoc;
var globalNewsDocFetchCnt = 0;
let cachedDb = null;

function toHours(date) {
  var d1 = new Date(date).getTime();
  var d2 = Date.now();
  var diff = Math.floor((d2 - d1) / 3600000);
  return diff;
}

function connectToDatabase(uri, callback) {
  console.log('=> connect to database');
  if (cachedDb && cachedDb.db && cachedDb.collection) {
    console.log('=> using cached database instance!!!');
    return callback(null);
  }

  console.log(`MongoDB connect URI=${uri}`);
  MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, minPoolSize: 10, maxPoolSize: 100 }, function (err, client) {
    if (err === undefined || err === null) {
      cachedDb = {};
      cachedDb.client = client;
      cachedDb.db = client.db('newswatcherdb');
      cachedDb.collection = cachedDb.db.collection('newswatcher');
      console.log('=> Connected and returning');
      return callback(null);
    } else {
      console.log(`Failed to connected to MongoDB server err:${err}`);
      return callback(err);
    }
  });
}

//
// Resync news stories after a user has altered their filter.
// For a given user and for every filter they have set up, search all news stories for match.
//
function refreshStories(doc, callback) {
  // Loop through all newsFilters and seek matches for all returned stories
  console.log(`doc.newsFilters.length=${doc.newsFilters.length}`)
  for (var filterIdx = 0; filterIdx < doc.newsFilters.length; filterIdx++) {
    doc.newsFilters[filterIdx].newsStories = [];

    for (var i = 0; i < globalNewsDoc.newsStories.length; i++) {
      globalNewsDoc.newsStories[i].keep = false;
    }

    // If there are keyWords, then filter by them
    if ("keyWords" in doc.newsFilters[filterIdx] && doc.newsFilters[filterIdx].keyWords[0] !== "") {
      var storiesMatched = 0;
      for (let i = 0; i < doc.newsFilters[filterIdx].keyWords.length; i++) {
        for (var j = 0; j < globalNewsDoc.newsStories.length; j++) {
          if (globalNewsDoc.newsStories[j].keep === false) {
            var s1 = globalNewsDoc.newsStories[j].title.toLowerCase().split(/\s+|\./);
            var s2 = globalNewsDoc.newsStories[j].contentSnippet.toLowerCase().split(/\s+|\./);
            var keyword = doc.newsFilters[filterIdx].keyWords[i].toLowerCase();
            const all = [...s1, ...s2];
            if (all.includes(keyword) >= 0) {
              globalNewsDoc.newsStories[j].keep = true;
              storiesMatched++;
            }
          }
          if (storiesMatched === process.env.MAX_FILTER_STORIES)
            break;
        }
        if (storiesMatched === process.env.MAX_FILTER_STORIES)
          break;
      }

      for (var k = 0; k < globalNewsDoc.newsStories.length; k++) {
        if (globalNewsDoc.newsStories[k].keep === true) {
          doc.newsFilters[filterIdx].newsStories.push(globalNewsDoc.newsStories[k]);
        }
      }
    }
  }

  // For the test runs, we can inject news stories that will be under our control
  // Of course, these test accounts are only temporary, but they could conflict with the 15 minute run to replace, so maybe put this code into the SP also?
  if (doc.newsFilters.length === 1 &&
    doc.newsFilters[0].keyWords.length === 1
    && doc.newsFilters[0].keyWords[0] === "testingKeyword") {
    for (let i = 0; i < 5; i++) {
      doc.newsFilters[0].newsStories.push(globalNewsDoc.newsStories[0]);
      doc.newsFilters[0].newsStories[0].title = "testingKeyword title" + i;
    }
  }

  // Do the replacement of the news stories
  cachedDb.collection.findOneAndUpdate({ _id: ObjectId(doc._id) }, { $set: { "newsFilters": doc.newsFilters } }, function (err, result) {
    if (err) {
      console.log('LAMBDA_ERROR Replace of newsStories failed:', err);
    } else if (result.acknowledged !== true && result.ok !== 1) {
      console.log('LAMBDA_ERROR Replace of newsStories failed:', result);
    } else {
      console.log(`findOneAndUpdate `)
      if (doc.newsFilters.length > 0) {
        console.log({ msg: 'User news stories updated. First selection length = ' + doc.newsFilters[0].newsStories.length });
      }
    }
    return callback(err);
  });
}

//
// Delete shared news stories that are over three days old.
//
function deleteStaleSharedStories(context, LambdaCallback) {
  connectToDatabase(process.env.MONGODB_CONNECT_URL, function (err) {
    if (err) {
      console.log('Unable to connect to database. err:', err);
      context.callbackWaitsForEmptyEventLoop = false; // Send response immediately
      return LambdaCallback(null, true);
    }

    cachedDb.collection.find({ type: 'SHAREDSTORY_TYPE' }).toArray(function (err, docs) {
      if (err) {
        console.log('Could not get shared stories. err:', err);
        context.callbackWaitsForEmptyEventLoop = false; // Send response immediately
        return LambdaCallback(null, true);
      }

      console.log(`docs.length=${docs.length}`);
      async.eachSeries(docs, function (story, innercallback) {
        // Go off the date of the time the story was shared
        var d1 = story.comments[0].dateTime;
        var d2 = Date.now();
        var diff = Math.floor((d2 - d1) / 3600000);
        console.log(`Age hours of article=${diff}`);
        if (diff > 72) {
          cachedDb.collection.findOneAndDelete({ type: 'SHAREDSTORY_TYPE', _id: story._id }, function (err, result) { // eslint-disable-line no-unused-vars
            innercallback(err);
          });
        } else {
          innercallback();
        }
      }, function (err) {
        if (err) {
          console.log('stale story deletion failure');
          context.callbackWaitsForEmptyEventLoop = false; // Send response immediately
          return LambdaCallback(null, true);
        } else {
          console.log('stale story deletion success');
          context.callbackWaitsForEmptyEventLoop = false; // Send response immediately
          return LambdaCallback(null, true);
        }
      });
    });
  });
}

//
// Resync news stories after a user has altered their filter.
// For a given user and for every filter they have set up, search all news stories for match.
//
function refreshStoriesForUser(doc, context, LambdaCallback) {
  if (!globalNewsDoc || globalNewsDocFetchCnt++ > 100) {
    globalNewsDocFetchCnt = 0;
    console.log('Fetch globalNewsDoc not in memory so fetch from MongoDB');
    connectToDatabase(process.env.MONGODB_CONNECT_URL, function (err) {
      console.log(`err:${err}`);
      if (err) {
        console.log('Unable to connect to database. err:', err);
        context.callbackWaitsForEmptyEventLoop = false; // Send response immediately
        return LambdaCallback(null, true);
      }
      console.log("Connected to database!");
      cachedDb.collection.findOne({ _id: process.env.GLOBAL_STORIES_ID }, function (err, gDoc) {
        if (err) {
          console.log('LAMBDA_ERROR: global news readDocument() read err:' + err);
          context.callbackWaitsForEmptyEventLoop = false; // Send response immediately
          return LambdaCallback(null, true);
        } else {
          globalNewsDoc = gDoc;
          refreshStories(doc, function (err) { // eslint-disable-line no-unused-vars
            if (err)
              console.log("refreshStories error:", err);
            context.callbackWaitsForEmptyEventLoop = false; // Send response immediately
            return LambdaCallback(null, true);
          });
        }
      });
    });
  } else {
    console.log('globalNewsDoc in memory');
    refreshStories(doc, function (err) { // eslint-disable-line no-unused-vars
      if (err)
        console.log("refreshStories error:", err);
      context.callbackWaitsForEmptyEventLoop = false; // Send response immediately
      return LambdaCallback(null, true);
    });
  }
}

//
// The New York Times news service states that we should not call more than five times a second
// We do need to call it over and over again, because there are multiple news categoris, so we space each out by half a second
// It will error if the size of this Document exceeds the maximum size (512KB). To fix this, split it up into as many as necessary.
//
function refreshNYTStories(context, LambdaCallback) {
  var date = new Date();
  console.log("datetime tick: " + date.toUTCString());
  async.timesSeries(NEWYORKTIMES_CATEGORIES.length, function (n, next) {
    var body = '';
    setTimeout(function () {
      console.log('Get news stories from NYT. Pass #', n);
      https.get({
        host: 'api.nytimes.com',
        path: '/svc/topstories/v2/' + NEWYORKTIMES_CATEGORIES[n] + '.json?api-key=' + process.env.NEWYORKTIMES_API_KEY
      }, function (res) {
        res.on('data', function (d) {
          body += d;
        });
        res.on('end', function () {
          next(null, body);
        });
      }).on('error', function (err) {
        // handle errors with the request itself
        console.log({ msg: 'LAMBDA_ERROR', Error: 'Error with the request: ' + err.message });
        next(err, body);
      });
    }, 500);
  }, function (err, results) {
    if (err) {
      console.log('NYT news fetch failure');
      context.callbackWaitsForEmptyEventLoop = false; // Send response immediately
      return LambdaCallback(err);
    }
    console.log('NYT news fetch success');
    // Do the replacement of the news stories in the single master Document
    connectToDatabase(process.env.MONGODB_CONNECT_URL, function (err) {
      if (err) {
        console.log('Unable to connect to database. err:', err);
        context.callbackWaitsForEmptyEventLoop = false; // Send response immediately
        return LambdaCallback(null, true);
      }
      cachedDb.collection.findOne({ _id: process.env.GLOBAL_STORIES_ID }, function (err, gStoriesDoc) {
        if (err) {
          console.log({ msg: 'LAMBDA_ERROR', Error: 'Error with the global news doc read request: ' + JSON.stringify(err.body, null, 4) });
        } else {
          gStoriesDoc.newsStories = [];
          gStoriesDoc.homeNewsStories = [];
          var allNews = [];
          for (var i = 0; i < results.length; i++) {
            try {
              var news = JSON.parse(results[i]);
            } catch (e) {
              console.error(e);
              return;
            }
            for (var j = 0; j < news.results.length; j++) {
              // Only take stories with images, valid links, titles, abstract, source and time
              const hours = news.results[j].updated_date ? toHours(news.results[j].updated_date) : 0;
              if (news.results[j].multimedia &&
                news.results[j].multimedia.length > 0 &&
                news.results[j].title !== '' &&
                news.results[j].url !== '' &&
                news.results[j].abstract !== '' &&
                news.results[j].section !== '' &&
                hours <= 480) {
                let hoursString;
                if (hours === 0 || hours < 2) {
                  hoursString = "1 hour ago";
                } else {
                  hoursString = hours + " hours ago";
                }
                var xferNewsStory = {
                  imageUrl: news.results[j].multimedia[0].url,
                  link: news.results[j].url,
                  title: news.results[j].title,
                  contentSnippet: news.results[j].abstract,
                  source: news.results[j].section,
                  hours: hours,
                  hoursString: hoursString
                };
                allNews.push(xferNewsStory);
                // Populate the home page stories only with 'home' category
                if (i === 0) {
                  gStoriesDoc.homeNewsStories.push(xferNewsStory);
                }
              }
            }
          }

          // Stories on NYT can be shared between categories
          // Only add the story if it is not in there already.
          async.eachSeries(allNews, function (story, innercallback) {
            bcrypt.hash(story.link, 10, function getHash(err, hash) {
              if (err) {
                return innercallback(err);
              }
              story.storyID = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
              if (gStoriesDoc.newsStories.findIndex(function (o) {
                if (o.storyID === story.storyID || o.title === story.title)
                  return true;
                else
                  return false;
              }) === -1) {
                gStoriesDoc.newsStories.push(story);
              }
              innercallback();
            });
          }, function (err) {
            if (err) {
              console.log('failure on story id check');
            } else {
              console.log('story id check success');
              gStoriesDoc.homeNewsStories.sort((a, b) => {
                return a.hours - b.hours;
              });
              gStoriesDoc.newsStories.sort((a, b) => {
                return a.hours - b.hours;
              });

              globalNewsDoc = gStoriesDoc;
              globalNewsDocFetchCnt = 999999;
              cachedDb.collection.findOneAndUpdate({ _id: globalNewsDoc._id }, { $set: { newsStories: globalNewsDoc.newsStories, homeNewsStories: globalNewsDoc.homeNewsStories } }, function (err, result) {
                if (err) {
                  console.log('LAMBDA_ERROR Replace of global newsStories failed:', err);
                } else if (result.acknowledged !== true && result.ok !== 1) {
                  console.log('LAMBDA_ERROR Replace of global newsStories failed:', result);
                } else {
                  // For each NewsWatcher user, do news matcing on their newsFilters
                  // We need to use a cursor and not toArray() because if there were thousand
                  // of users it might crash.
                  // TODO: Also, if tehre were to be thousands of users, we would want to break them up in groups
                  // to be processed by multiple parallel Lambda invokes as there is a 15 minute limit on a Lambda run.
                  let cursor = cachedDb.collection.find({ type: 'USER_TYPE' });
                  let keepProcessing = true;
                  async.whilst(
                    function test(cb) { cb(null, keepProcessing === true); },
                    function iter(callback) {
                      cursor.next(function (err, doc) {
                        if (!err && doc) {
                          refreshStories(doc, function (err) { // eslint-disable-line no-unused-vars
                            if (err)
                              console.log('refreshStories error:', err);
                            callback(null, 1);
                          });
                        } else {
                          keepProcessing = false;
                          callback(null, 1);
                        }
                      });
                    },
                    function (err, n) {
                      cursor.close();
                      console.log('Timer: News stories refreshed and user newsFilters matched. err:', err);
                      context.callbackWaitsForEmptyEventLoop = false; // Send response immediately
                      return LambdaCallback(null, true);
                    }
                  );
                }
              });
            }
          });
        }
      });
    });
  });
}

module.exports.handler = (event, context, LambdaCallback) => {
  if (event.params_call_type === "deleteStaleSharedStories_call") {
    console.log('deleteStaleSharedStories_call');
    return deleteStaleSharedStories(context, LambdaCallback);
  } else if (event.params_call_type === "refreshForUserFilter_call") {
    console.log('refreshForUserFilter_call');
    return refreshStoriesForUser(event.doc, context, LambdaCallback);
  } else if (event.params_call_type === "refreshNYTStories_call") {
    console.log('refreshNYTStories_call');
    return refreshNYTStories(context, LambdaCallback);
  } else {
    console.log("Unknown fire of NYT times story handling");
    context.callbackWaitsForEmptyEventLoop = false; // Send response immediately
    return LambdaCallback(null, {
      StatusCode: 200,
      body: 'Invalid input!'
    })
  }
};
