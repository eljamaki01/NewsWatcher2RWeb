//
// app_FORKED.js: A Forked Node.js process for ofloading of processing.
// The main Node.js application does not need to have its single thread event processing loop
// burdened by code that takes a while to process. This is the process that anything that needs to be
// separated out can have that sent here.
// Code here will either be run because of a timer function that periodically goes off, or because of
// message sent that schedules it.
//
"use strict";

//
// "require" statements to bring in needed Node Modules
//
var bcrypt = require('bcryptjs');
var https = require("https");
var async = require('async');
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;

var globalNewsDoc;
const NEWYORKTIMES_CATEGORIES = ["home", "world", "national", "business", "technology"];

//
// MongoDB database connection initialization
//
var db = {};
MongoClient.connect(process.env.MONGODB_CONNECT_URL, function (err, client) {
  assert.equal(null, err);
  db.client = client;
  db.collection = client.db('newswatcherdb').collection('newswatcher');
  console.log("Fork is connected to MongoDB server");
});

process.on('SIGINT', function () {
  console.log('Forked MongoDB connection close on app termination');
  db.client.close();
  process.exit(0);
});

process.on('SIGUSR2', function () {
  console.log('Forked MongoDB connection close on app restart');
  db.client.close();
  process.kill(process.pid, 'SIGUSR2');
});

var newsPullBackgroundTimer;
var staleStoryDeleteBackgroundTimer;

console.log({ msg: 'FORK_RUNNING' });

process.on('uncaughtException', function (err) {
  console.log({ msg: 'RESTART_FORK', Error: 'app_FORK.js uncaughtException error: ' + err.message + "\n" + err.stack });
  clearInterval(newsPullBackgroundTimer);
  clearInterval(staleStoryDeleteBackgroundTimer);
  process.disconnect();
})

process.on('message', function (m) {
  if (m.msg) {
    if (m.msg == 'REFRESH_STORIES') {
      // With setImmediate(), callbacks run after I/O. FYI: process.nextTick() queues up callbacks that run in the event loop before I/O.
      setImmediate(function (doc) {
        refreshStoriesMSG(doc, null);
      }, m.doc);
    }
  } else {
    console.log('Message from master:', m);
  }
});

//
// Resync news stories after a user has altered their filter.
// For a given user and for every filter they have set up, search all news stories for match.
//
function refreshStoriesMSG(doc, callback) {
  if (!globalNewsDoc) {
    db.collection.findOne({ _id: process.env.GLOBAL_STORIES_ID }, function (err, gDoc) {
      if (err) {
        console.log('FORK_ERROR: global news readDocument() read err:' + err);
        if (callback)
          return callback(err);
        else
          return;
      } else {
        globalNewsDoc = gDoc;
        refreshStories(doc, callback);
      }
    });
  } else {
    refreshStories(doc, callback);
  }
}

function refreshStories(doc, callback) {
  // Loop through all newsFilters and seek matches for all returned stories
  for (var filterIdx = 0; filterIdx < doc.newsFilters.length; filterIdx++) {
    doc.newsFilters[filterIdx].newsStories = [];

    for (var i = 0; i < globalNewsDoc.newsStories.length; i++) {
      globalNewsDoc.newsStories[i].keep = false;
    }

    // If there are keyWords, then filter by them
    if ("keyWords" in doc.newsFilters[filterIdx] && doc.newsFilters[filterIdx].keyWords[0] != "") {
      var storiesMatched = 0;
      for (let i = 0; i < doc.newsFilters[filterIdx].keyWords.length; i++) {
        for (var j = 0; j < globalNewsDoc.newsStories.length; j++) {
          if (globalNewsDoc.newsStories[j].keep == false) {
            var s1 = globalNewsDoc.newsStories[j].title.toLowerCase();
            var s2 = globalNewsDoc.newsStories[j].contentSnippet.toLowerCase();
            var keyword = doc.newsFilters[filterIdx].keyWords[i].toLowerCase();
            if (s1.indexOf(keyword) >= 0 || s2.indexOf(keyword) >= 0) {
              globalNewsDoc.newsStories[j].keep = true;
              storiesMatched++;
            }
          }
          if (storiesMatched == process.env.MAX_FILTER_STORIES)
            break;
        }
        if (storiesMatched == process.env.MAX_FILTER_STORIES)
          break;
      }

      for (var k = 0; k < globalNewsDoc.newsStories.length; k++) {
        if (globalNewsDoc.newsStories[k].keep == true) {
          doc.newsFilters[filterIdx].newsStories.push(globalNewsDoc.newsStories[k]);
        }
      }
    }
  }

  // For the test runs, we can inject news stories that will be under our control
  // Of course, these test accounts are only temporary, but they could conflict with the 15 minute run to replace, so maybe put this code into the SP also?
  if (doc.newsFilters.length == 1 &&
    doc.newsFilters[0].keyWords.length == 1
    && doc.newsFilters[0].keyWords[0] == "testingKeyword") {
    for (let i = 0; i < 5; i++) {
      doc.newsFilters[0].newsStories.push(globalNewsDoc.newsStories[0]);
      doc.newsFilters[0].newsStories[0].title = "testingKeyword title" + i;
    }
  }

  // Do the replacement of the news stories
  db.collection.findOneAndUpdate({ _id: ObjectId(doc._id) }, { $set: { "newsFilters": doc.newsFilters } }, function (err, result) {
    if (err) {
      console.log('FORK_ERROR Replace of newsStories failed:', err);
    } else if (result.ok != 1) {
      console.log('FORK_ERROR Replace of newsStories failed:', result);
    } else {
      if (doc.newsFilters.length > 0) {
        console.log({ msg: 'MASTERNEWS_UPDATE first filter news length = ' + doc.newsFilters[0].newsStories.length });
      } else {
        console.log({ msg: 'MASTERNEWS_UPDATE no newsFilters' });
      }
    }
    if (callback)
      return callback(err);
  });
}

//
// Refresh all of the news stories in the master list every four hours
//
var count = 0;
newsPullBackgroundTimer = setInterval(function () {
  // The New York Times news service states that we should not call more than five times a second
  // We have to call it over and over again, because there are multiple news categoris, so space each out by half a second
  // It will error if the size of this Document exceeds the maximum size (512KB). To fix this, split it up into as many as necessary.
  var date = new Date();
  console.log("app_FORK: datetime tick: " + date.toUTCString());
  async.timesSeries(NEWYORKTIMES_CATEGORIES.length, function (n, next) {
    setTimeout(function () {
      console.log('Get news stories from NYT. Pass #', n);
      try {
        https.get({
          host: 'api.nytimes.com',
          path: '/svc/topstories/v2/' + NEWYORKTIMES_CATEGORIES[n] + '.json',
          headers: { 'api-key': process.env.NEWYORKTIMES_API_KEY }
        }, function (res) {
          var body = '';
          res.on('data', function (d) {
            body += d;
          });
          res.on('end', function () {
            next(null, body);
          });
        }).on('error', function (err) {
          // handle errors with the request itself
          console.log({ msg: 'FORK_ERROR', Error: 'Error with the request: ' + err.message });
          return;
        });
      }
      catch (err) {
        count++;
        if (count == 3) {
          console.log('app_FORK.js: shuting down timer...too many errors: err:' + err);
          clearInterval(newsPullBackgroundTimer);
          clearInterval(staleStoryDeleteBackgroundTimer);
          process.disconnect();
        }
        else {
          console.log('app_FORK.js error. err:' + err);
        }
      }
    }, 500);
  }, function (err, results) {
    if (err) {
      console.log('failure');
    } else {
      console.log('success');
      // Do the replacement of the news stories in the single master Document
      db.collection.findOne({ _id: process.env.GLOBAL_STORIES_ID }, function (err, gDoc) {
        if (err) {
          console.log({ msg: 'FORK_ERROR', Error: 'Error with the global news doc read request: ' + JSON.stringify(err.body, null, 4) });
        } else {
          gDoc.newsStories = [];
          gDoc.homeNewsStories = [];
          var allNews = [];
          for (var i = 0; i < results.length; i++) {
            // JSON.parse is syncronous and it will throw an exception on invalid JSON, so we need to catch it
            try {
              var news = JSON.parse(results[i]);
            } catch (e) {
              console.error(e);
              return;
            }
            for (var j = 0; j < news.results.length; j++) {
              var xferNewsStory = {
                link: news.results[j].url,
                title: news.results[j].title,
                contentSnippet: news.results[j].abstract,
                source: news.results[j].section,
                date: new Date(news.results[j].updated_date).getTime()
              };
              // Only take stories with images
              if (news.results[j].multimedia.length > 0) {
                xferNewsStory.imageUrl = news.results[j].multimedia[0].url;
                allNews.push(xferNewsStory);
                // Populate the home page stories
                if (i == 0) {
                  gDoc.homeNewsStories.push(xferNewsStory);
                }
              }
            }
          }

          async.eachSeries(allNews, function (story, innercallback) {
            bcrypt.hash(story.link, 10, function getHash(err, hash) {
              if (err)
                innercallback(err);

              // Only add the story if it is not in there already.
              // The problem is that stories on NYT can be shared between categories
              story.storyID = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
              if (gDoc.newsStories.findIndex(function (o) {
                if (o.storyID == story.storyID || o.title == story.title)
                  return true;
                else
                  return false;
              }) == -1) {
                gDoc.newsStories.push(story);
              }
              innercallback();
            });
          }, function (err) {
            if (err) {
              console.log('failure on story id creation');
            } else {
              console.log('story id creation success');
              globalNewsDoc = gDoc;
              setImmediate(function () {
                refreshAllUserStories();
              });
            }
          });
        }
      });
    }
  });
}, 240 * 60 * 1000); // 240 is Every four hours

function refreshAllUserStories() {
  db.collection.findOneAndUpdate({ _id: globalNewsDoc._id }, { $set: { newsStories: globalNewsDoc.newsStories, homeNewsStories: globalNewsDoc.homeNewsStories } }, function (err, result) {
    if (err) {
      console.log('FORK_ERROR Replace of global newsStories failed:', err);
    } else if (result.ok != 1) {
      console.log('FORK_ERROR Replace of global newsStories failed:', result);
    } else {
      // For each NewsWatcher user, do news matcing on their newsFilters
      var cursor = db.collection.find({ type: 'USER_TYPE' });
      var keepProcessing = true;
      async.doWhilst(
        function (callback) {
          cursor.next(function (err, doc) {
            if (doc) {
              refreshStories(doc, function (err) { // eslint-disable-line no-unused-vars
                callback(null);
              });
            } else {
              keepProcessing = false;
              callback(null);
            }
          });
        },
        function () { return keepProcessing; },
        function (err) {
          console.log('Timer: News stories refreshed and user newsFilters matched. err:', err);
        });
    }
  });
}

//
// Delete shared news stories that are over three days old.
// Use node-schedule or cron npm modules if want to actually do something like run every morning at 1AM
//
staleStoryDeleteBackgroundTimer = setInterval(function () {
  db.collection.find({ type: 'SHAREDSTORY_TYPE' }).toArray(function (err, docs) {
    if (err) {
      console.log('Fork could not get shared stories. err:', err);
      return;
    }

    async.eachSeries(docs, function (story, innercallback) {
      // Go off the date of the time the story was shared
      var d1 = story.comments[0].dateTime;
      var d2 = Date.now();
      var diff = Math.floor((d2 - d1) / 3600000);
      if (diff > 72) {
        db.collection.findOneAndDelete({ type: 'SHAREDSTORY_TYPE', _id: story._id }, function (err, result) { // eslint-disable-line no-unused-vars
          innercallback(err);
        });
      } else {
        innercallback();
      }
    }, function (err) {
      if (err) {
        console.log('stale story deletion failure');
      } else {
        console.log('stale story deletion success');
      }
    });
  });

}, 24 * 60 * 60 * 1000);