//
// sharedNews.js: A Node.js Module for for shared news story management.
//
// Each shared story is kept in its own Document.
//
// Users cannot delete individual stories, so there is no delete.
// There is a background timer that deletes shared stories that are old.
//
var express = require('express');
var joi = require('joi'); // For data validation
var authHelper = require('./authHelper');

var router = express.Router();

//
// Share a story for all NewsWatcher users to see and comment on.
// Don't allow a story to be shared twice. We compare the id/link to tell.
// There is a limit to how many stories can be shared.
//
router.post('/', authHelper.checkAuth, function (req, res, next) {
  // Validate the body
  var schema = joi.object({
    contentSnippet: joi.string().max(300).required(),
    date: joi.date().required(),
    hours: joi.string().max(20),
    imageUrl: joi.string().max(300).required(),
    keep: joi.boolean().required(),
    link: joi.string().max(300).required(),
    source: joi.string().max(50).required(),
    storyID: joi.string().max(100).required(),
    title: joi.string().max(200).required()
  });
  schema.validateAsync(req.body)
    .then(value => { // eslint-disable-line no-unused-vars
      req.db.collection.countDocuments({ type: 'SHAREDSTORY_TYPE' }, function (err, count) {
        if (err) {
          err.status = 400;
          return next(err);
        }

        if (count > process.env.MAX_SHARED_STORIES) {
          let err = new Error('Shared story limit reached');
          err.status = 403;
          return next(err);
        }

        // Make sure the story was not already shared
        req.db.collection.countDocuments({ type: 'SHAREDSTORY_TYPE', _id: req.body.storyID }, function (err, count) {
          if (err) {
            err.status = 400;
            return next(err);
          }
          if (count > 0) {
            let err = new Error('Story was already shared.');
            err.status = 403;
            return next(err);
          }

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

          req.db.collection.findOneAndReplace({ type: 'SHAREDSTORY_TYPE', _id: req.body.storyID }, xferStory, { upsert: true },
            function (err, result) {
              if (err) {
                console.log("+++POSSIBLE COMMENT CONTENTION ERROR?+++ err:", err);
                err.status = 409;
                return next(err);
              } else if (result.acknowledged !== true && result.ok !== 1) {
                console.log("+++POSSIBLE COMMENT CONTENTION ERROR?+++ result:", result);
                let err = new Error('Shared story save failure');
                err.status = 409;
                return next(err);
              }

              if (result.insertedId)
                xferStory._id = result.insertedId;
              else
                xferStory._id = req.body.storyID;
              res.status(201).json(xferStory);
            });
        });
      });
    })
    .catch(error => {
      error.status = 400;
      return next(error);
    });
});

//
// Return all the shared news stories. Call the middleware first to verify we have a logged in user.
//
router.get('/', authHelper.checkAuth, function (req, res, next) {
  req.db.collection.find({ type: 'SHAREDSTORY_TYPE' }).toArray(function (err, docs) {
    if (err) {
      err.status = 400;
      return next(err);
    }

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
      err.status = 400;
      return next(err);
    } else if (result.acknowledged !== true && result.ok !== 1) {
      console.log("+++POSSIBLE SHARED STORY DELETION CONTENTION ERROR?+++ result:", result);
      let err = new Error('Shared story deletion failure');
      err.status = 409;
      return next(err);
    }

    res.status(200).json({ msg: "Shared story Deleted" });
  });
});

//
// Post a comment from a user to a shared news story.
//
router.post('/:sid/Comments', authHelper.checkAuth, function (req, res, next) {
  // Validate the body
  var schema = joi.object({
    comment: joi.string().max(250).required()
  });
  schema.validateAsync(req.body)
    .then(value => { // eslint-disable-line no-unused-vars
      var xferComment = {
        displayName: req.auth.displayName,
        userId: req.auth.userId,
        dateTime: Date.now(),
        comment: req.body.comment.substring(0, 250)
      };

      req.db.collection.findOne({ _id: req.params.sid }, { comments: 1 }, function (err, doc) {
        if (err) {
          err.status = 403;
          return next(err);
        } else if (doc.comments.length > 30) {
          let err = new Error('Comment limit reached');
          err.status = 403;
          return next(err);
        }
        // Not allowed at free tier!!!req.db.collection.findOneAndUpdate({ type: 'SHAREDSTORY_TYPE', _id: req.params.sid, $where: 'this.comments.length<29' },
        req.db.collection.findOneAndUpdate({ _id: req.params.sid },
          { $push: { comments: xferComment } },
          function (err, result) {
            if (result && result.value == null) {
              let err = new Error('Comment insert failed');
              err.status = 403;
              return next(err);
            } else if (err) {
              console.log("+++POSSIBLE COMMENT CONTENTION ERROR?+++ err:", err);
              err.status = 409;
              return next(err);
            } else if (result.acknowledged !== true && result.ok !== 1) {
              console.log("+++POSSIBLE COMMENT CONTENTION ERROR?+++ result:", result);
              let err = new Error('Comment save failure');
              err.status = 409;
              return next(err);
            }

            res.status(201).json({ msg: "Comment added" });
          });
      });
    })
    .catch(error => {
      error.status = 400;
      return next(error);
    });
});

module.exports = router;