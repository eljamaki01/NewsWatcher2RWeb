//
// homeNews.js: A Node.js Module for for home news story management.
//
//

"use strict";
var express = require('express');
var joi = require('joi'); // For data validation
var authHelper = require('./authHelper');
var ObjectId = require('mongodb').ObjectID;

var router = express.Router();

//
// Return all the Home Page news stories. Call the middleware first to verify we have a logged in user.
//
router.get('/', function (req, res, next) {
  req.db.collection.findOne({ _id: process.env.GLOBAL_STORIES_ID }, { homeNewsStories: 1 }, function (err, doc) {
    if (err)
      return next(err);

    res.status(200).json(doc.homeNewsStories);
  });
});

module.exports = router;