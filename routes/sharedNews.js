//
// sharedNews.js: A Node.js Module for for shared news story management.
//
// Each shared story is kept in its own Document.
//
// Users cannot delete individual stories, so there is no delete.
// There is a background timer that deletes shared stories that are old.
//

"use strict";
var express = require('express');
var joi = require('joi'); // For data validation
var authHelper = require('./authHelper');
var config = require('../config');
var ObjectId = require('mongodb').ObjectID;

var router = express.Router();

//
// Share a story for all NewsWatcher users to see and comment on.
// Don't allow a story to be shared twice. We compare the id/link to tell.
// There is a limit to how many stories can be shared.
//
router.post('/', authHelper.checkAuth, function (req, res, next) {
    // Validate the body
    var schema = {
        contentSnippet: joi.string().max(200).required(),
        date: joi.date().required(),
        hours: joi.string().max(20),
        imageUrl: joi.string().max(300).required(),
        keep: joi.boolean().required(),
        link: joi.string().max(300).required(),
        source: joi.string().max(50).required(),
        storyID: joi.string().max(100).required(),
        title: joi.string().max(200).required()
    };

    joi.validate(req.body, schema, function (err, value) {
        if (err)
            return next(err);
            
        // We first make sure we are not at the 100 count limit.
        req.db.collection.count({ type: 'SHAREDSTORY_TYPE' }, function (err, count) {
            if (err)
                return next(err);

            if (count > config.MAX_SHARED_STORIES)
                return next(new Error('Shared story limit reached'));
		
            // Make sure the story was not already shared
            req.db.collection.count({ type: 'SHAREDSTORY_TYPE', _id: req.body.storyID }, function (err, count) {
                if (err)
                    return next(err);
                if (count > 0)
                    return next(new Error('Story was already shared.'));
			
                // Now we can create this as a shared news story Document.
                // Note that we don't need to worry about simultaneous post requests creating the same story
                // as the id uniqueness will force that and fail other requests.
                var xferStory = {
                    _id: req.body.storyID,
                    type: 'SHAREDSTORY_TYPE',
                    story: req.body,
                    comments: [{
                        displayName: req.auth.displayName,
                        userId: req.auth.userId,
                        dateTime: Date.now(),
                        comment: req.auth.displayName + " thought everyone might enjoy this!"
                    }]
                };

                req.db.collection.insertOne(xferStory, function createUser(err, result) {
                    if (err)
                        return next(err);

                    res.status(201).json(result.ops[0]);
                });
            });
        });
    });
});

//
// Return all the shared news stories. Call the middleware first to verify we have a logged in user.
//
router.get('/', authHelper.checkAuth, function (req, res, next) {
    req.db.collection.find({ type: 'SHAREDSTORY_TYPE' }).toArray(function (err, docs) {
        if (err)
            return next(err);

        res.status(200).json(docs);
    });
});

//
// Delete a story from the shared folder.
//
router.delete('/:sid', authHelper.checkAuth, function (req, res, next) {
    req.db.collection.findOneAndDelete({ type: 'SHAREDSTORY_TYPE', _id: req.params.sid }, function (err, result) {
        if (err) {
            console.log("+++POSSIBLE SHARED STORY DELETION CONTENTION ERROR?+++ err:", err);
            return next(err);
        } else if (result.ok != 1) {
            console.log("+++POSSIBLE SHARED STORY DELETION CONTENTION ERROR?+++ result:", result);
            return next(new Error('Shared story deletion failure'));
        }

        res.status(200).json({ msg: "Shared story Deleted" });
    });
});

//
// Post a comment from a user to a shared news story.
//
router.post('/:sid/Comments', authHelper.checkAuth, function (req, res, next) {
    // Validate the body
    var schema = {
        comment: joi.string().max(250).required()
    };

    joi.validate(req.body, schema, function (err, value) {
        if (err)
            return next(err);

        var xferComment = {
            displayName: req.auth.displayName,
            userId: req.auth.userId,
            dateTime: Date.now(),
            comment: req.body.comment.substring(0, 250)
        };

        // Not allowed at free tier!!!req.db.collection.findOneAndUpdate({ type: 'SHAREDSTORY_TYPE', _id: req.params.sid, $where: 'this.comments.length<29' },
        req.db.collection.findOneAndUpdate({ type: 'SHAREDSTORY_TYPE', _id: req.params.sid },
            { $push: { comments: xferComment } },
            function (err, result) {
                if (result && result.value == null) {
                    return next(new Error('Comment limit reached'));
                } else if (err) {
                    console.log("+++POSSIBLE COMMENT CONTENTION ERROR?+++ err:", err);
                    return next(err);
                } else if (result.ok != 1) {
                    console.log("+++POSSIBLE COMMENT CONTENTION ERROR?+++ result:", result);
                    return next(new Error('Comment save failure'));
                }

                res.status(201).json({ msg: "Comment added" });
            });
    });
});

module.exports = router;