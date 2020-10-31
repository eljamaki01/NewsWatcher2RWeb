//
// homeNews.js: A Node.js Module for for home news story management.
//
//

"use strict";
var express = require('express');
var router = express.Router();
var cachedDoc = null;
var timeStamp = process.hrtime();

//
// Return all the Home Page news stories. Call the middleware first to verify we have a logged in user.
//
router.get('/', function (req, res, next) {
  const diff = process.hrtime(timeStamp);
  console.log(`req.ip=${req.ip}`);
  console.log(`req.headers.x-forwarded-for=${req.headers['x-forwarded-for']}`);
  if (cachedDoc && process.env.USE_CACHE && diff[0] < 1800) {
    res.status(200).json(cachedDoc.homeNewsStories);
    console.log("Got cached!");
  } else {
    req.db.collection.findOne({ _id: process.env.GLOBAL_STORIES_ID }, { homeNewsStories: 1 }, function (err, doc) {
      if (err)
        return next(err);
      cachedDoc = doc;
      timeStamp = process.hrtime();
      res.status(200).json(doc.homeNewsStories);
      console.log("Did fetch!");
    });
  }
});

module.exports = router;