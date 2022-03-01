//
// users.js: A Node.js Module for for management of a NewsWatcher user settings and news newsFilters CRUD operations.
// There is middleware that makes sure a user is logged in so they can only get their profile.
// A profile is really associated with a user and never goes away,
// so there is no post as it is already there and a delete is also not needed
//
var express = require('express');
var bcrypt = require('bcryptjs');
var joi = require('joi'); // For data validation
var authHelper = require('./authHelper');
var ObjectId = require('mongodb').ObjectId;
if (process.env.NODE_ENV !== 'production') {
  var storiesRefreshLambda = require('../Lambda/NYTStoriesRefresh');
}

var router = express.Router();

const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
try {
  var LambdaClientInst = new LambdaClient({ region: 'us-east-1' });
} catch (e) {
  console.log(e);
}

//
// Create a User in the Collection for NewsWatcher.
// Does not require session authentication at this point as this is the registration step.
//
router.post('/', function postUser(req, res, next) {
  // Password must be 7 to 15 characters in length and contain at least one numeric digit and a special character
  var schema = joi.object({
    displayName: joi.string().alphanum().min(3).max(50).required(),
    email: joi.string().email().min(7).max(50).required(),
    password: joi.string().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/).required()
  });
  schema.validateAsync(req.body)
    .then(value => { // eslint-disable-line no-unused-vars
      req.db.collection.findOne({ type: 'USER_TYPE', email: req.body.email }, function (err, doc) {
        if (err) {
          err.status = 400;
          return next(err);
        }

        if (doc) {
          let err = new Error('Email account already registered');
          err.status = 403;
          return next(err);
        }

        var xferUser = {
          type: 'USER_TYPE',
          displayName: req.body.displayName,
          email: req.body.email,
          passwordHash: null,
          date: Date.now(),
          completed: false,
          settings: {
            requireWIFI: true,
            enableAlerts: false
          },
          newsFilters: [{
            name: 'Technology Companies',
            keyWords: ['Apple', 'Microsoft', 'IBM', 'Amazon', 'Google', 'Intel'],
            enableAlert: false,
            alertFrequency: 0,
            enableAutoDelete: false,
            deleteTime: 0,
            timeOfLastScan: 0,
            newsStories: []
          }],
          savedStories: []
        };

        bcrypt.hash(req.body.password, 10, function getHash(err, hash) {
          if (err) {
            err.status = 400;
            return next(err);
          }

          xferUser.passwordHash = hash;
          req.db.collection.insertOne(xferUser, function createUser(err, result) {
            if (err) {
              err.status = 400;
              return next(err);
            }

            xferUser._id = result.insertedId;
            // Fire the Lambda to update the filtered news stories
            if (process.env.USE_LOCAL_LAMBDA === 'TRUE') {
              storiesRefreshLambda.handler({ params_call_type: "refreshForUserFilter_call", doc: xferUser }, {}, (error, data) => { // eslint-disable-line no-unused-vars
                if (error) {
                  console.log("Lambda: INVOKE ERROR!", error);
                } else {
                  console.log("LAMBDA INVOKE SUCCESS")
                }
              });
            } else {
              let params = {
                FunctionName: 'NYTStoriesMgmt', /* required */
                InvocationType: "Event", // "Event" means to invoke asyncronously. Use "RequestResponse" for syncronous calls
                LogType: "Tail",
                Payload: JSON.stringify({ params_call_type: "refreshForUserFilter_call", doc: xferUser })
              };

              const command = new InvokeCommand(params);
              LambdaClientInst.send(command, function (error, data) { // eslint-disable-line no-unused-vars
                if (error) {
                  console.log("Lambda: INVOKE ERROR!", error);
                } else {
                  console.log("Lambda INVOKE SUCCESS");
                }
              });
            }
            res.status(201).json(xferUser);
          });
        });
      });
    })
    .catch(error => {
      let err = new Error(`Invalid field: display name 3 to 50 alpanumeric, valid email, password 7 to 15 (one number, one special character): ${error}`);
      err.status = 400;
      return next(err);
    });
});

//
// Delete a User in the Collection for NewsWatcher.
//
router.delete('/:id', authHelper.checkAuth, function (req, res, next) {
  // Verify that the passed in id to delete is the same as that in the auth token
  if (req.params.id !== req.auth.userId) {
    let err = new Error('Invalid request for account deletion');
    err.status = 401;
    return next(err);
  }

  // MongoDB should do the work of queuing this up and retrying if there is a conflict, According to their documentation.
  // This actually requires a write lock on their part.
  req.db.collection.findOneAndDelete({ type: 'USER_TYPE', _id: ObjectId(req.auth.userId) }, function (err, result) {
    if (err) {
      console.log("+++POSSIBLE USER DELETION CONTENTION ERROR?+++ err:", err);
      err.status = 409;
      return next(err);
    } else if (result.acknowledged !== true && result.ok !== 1) {
      console.log("+++POSSIBLE USER DELETION CONTENTION ERROR?+++ result:", result);
      let err = new Error('Account deletion failure');
      err.status = 409;
      return next(err);
    }

    res.status(200).json({ msg: "User Deleted" });
  });
});

//
// Get a NewsWatcher user
//
router.get('/:id', authHelper.checkAuth, function (req, res, next) {
  // Verify that the passed in id to delete is the same as that in the auth token
  if (req.params.id !== req.auth.userId) {
    let err = new Error('Invalid request for account fetch');
    err.status = 401;
    return next(err);
  }

  req.db.collection.findOne({ type: 'USER_TYPE', _id: ObjectId(req.auth.userId) }, function (err, doc) {
    if (err) {
      err.status = 400;
      return next(err);
    }

    var xferProfile = {
      email: doc.email,
      displayName: doc.displayName,
      date: doc.date,
      settings: doc.settings,
      newsFilters: doc.newsFilters,
      savedStories: doc.savedStories
    };
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    res.status(200).json(xferProfile);
  });
});

//
// Update a user profile. For example, they have edited their newsFilters.
//
router.put('/:id', authHelper.checkAuth, function (req, res, next) {
  // Verify that the passed in id is the same as that in the auth token
  if (req.params.id !== req.auth.userId) {
    let err = new Error('Invalid request for account update');
    err.status = 401;
    return next(err);
  }

  // Limit the number of newsFilters
  if (req.body.newsFilters.length > process.env.MAX_FILTERS) {
    let err = new Error('Too many news newsFilters');
    err.status = 403;
    return next(err);
  }

  // clear out leading and trailing spaces
  for (var i = 0; i < req.body.newsFilters.length; i++) {
    if ("keyWords" in req.body.newsFilters[i] && req.body.newsFilters[i].keyWords[0] !== "") {
      for (var j = 0; j < req.body.newsFilters[i].keyWords.length; j++) {
        req.body.newsFilters[i].keyWords[j] = req.body.newsFilters[i].keyWords[j].trim();
      }
    }
  }

  // Validate the newsFilters
  var schema = joi.object({
    settings: joi.object({
      requireWIFI: joi.boolean().strict().allow(null).required(),
      enableAlerts: joi.boolean().strict().allow(null).required(),
    }).optional(),
    date: joi.number().optional(),
    displayName: joi.string().alphanum().min(3).max(50).optional(),
    email: joi.string().email().min(7).max(50).optional(),
    savedStories: joi.array().optional(),
    newsFilters: joi.array().min(1).items(joi.object({
      name: joi.string().min(1).max(30).regex(/^[-_ a-zA-Z0-9]+$/).required(),
      keyWords: joi.array().max(10).items(joi.string().max(20)).required(),
      enableAlert: joi.boolean(),
      alertFrequency: joi.number().min(0),
      enableAutoDelete: joi.boolean(),
      deleteTime: joi.date(),
      timeOfLastScan: joi.date(),
      newsStories: joi.array(),
      keywordsStr: joi.string().min(1).max(100)
    })).required()
  });

  schema.validateAsync(req.body)
    .then(value => { // eslint-disable-line no-unused-vars
      // MongoDB implements optomistic concurrency for us.
      // We were not holding on to the document, so we just do a quick read and replace of just those properties and not the complete document.
      // We need the {returnDocument: "after"}, so a test could verify what happened, otherwise the defualt is to return the origional.
      req.db.collection.findOneAndUpdate({ type: 'USER_TYPE', _id: ObjectId(req.auth.userId) },
        { $set: { settings: { requireWIFI: req.body.requireWIFI, enableAlerts: req.body.enableAlerts }, newsFilters: req.body.newsFilters } },
        { returnDocument: "after" },
        function (err, result) {
          if (err) {
            console.log("+++POSSIBLE USER PUT CONTENTION ERROR?+++ err:", err);
            err.status = 400;
            return next(err);
          } else if (result.acknowledged !== true && result.ok !== 1) {
            console.log("+++POSSIBLE USER PUT CONTENTION ERROR?+++ result:", result);
            let err = new Error('User PUT failure');
            err.status = 409;
            return next(err);
          }

          // Fire the Lambda to update the filtered news stories
          if (process.env.USE_LOCAL_LAMBDA === 'TRUE') {
            storiesRefreshLambda.handler({ params_call_type: "refreshForUserFilter_call", doc: result.value }, {}, (error, data) => { // eslint-disable-line no-unused-vars
              if (error) {
                console.log("Lambda: INVOKE ERROR!", error);
              } else {
                console.log("LAMBDA INVOKE SUCCESS")
              }
            });
          } else {
            let params = {
              FunctionName: 'NYTStoriesMgmt', /* required */
              InvocationType: "Event", // "Event" means to invoke asyncronously. Use "RequestResponse" for syncronous calls
              LogType: "Tail",
              Payload: JSON.stringify({ params_call_type: "refreshForUserFilter_call", doc: result.value })
            };

            const command = new InvokeCommand(params);
            LambdaClientInst.send(command, function (error, data) { // eslint-disable-line no-unused-vars
              if (error) {
                console.log("Lambda: INVOKE ERROR!", error);
              } else {
                console.log("Lambda INVOKE SUCCESS");
              }
            });
          }
          res.status(200).json(result.value);
        });
    })
    .catch(error => {
      error.status = 400;
      return next(error);
    });
});

//
// Move a story to the save folder.
// We can't move a story there that is already there. We compare the link to tell.
// There is a limit to how many can be saved.
//
router.post('/:id/savedstories', authHelper.checkAuth, function (req, res, next) {
  // Verify that the passed in id to delete is the same as that in the auth token
  if (req.params.id !== req.auth.userId) {
    let err = new Error('Invalid request for saving story');
    err.status = 401;
    return next(err);
  }

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
      // This uses the MongoDB operators to test the savedStories array to make sure:
      // A. Story is not aready in there.
      // B. We limit the number of saved stories to 30
      // Not allowed at free tier!!!req.db.collection.findOneAndUpdate({ type: 'USER_TYPE', _id: ObjectId(req.auth.userId), $where: 'this.savedStories.length<29' },
      req.db.collection.findOneAndUpdate({ type: 'USER_TYPE', _id: ObjectId(req.auth.userId) },
        { $addToSet: { savedStories: req.body } },
        { returnDocument: "before" },
        function (err, result) {
          if (result && result.value === null) {
            let err = new Error('Over the save limit, or story already saved');
            err.status = 403;
            return next(err);
          } else if (err) {
            console.log("+++POSSIBLE save story CONTENTION ERROR?+++ err:", err);
            err.status = 409;
            return next(err);
          } else if (result.acknowledged !== true && result.ok !== 1) {
            console.log("+++POSSIBLE save story CONTENTION ERROR?+++ result:", result);
            let err = new Error('Story save failure');
            err.status = 409;
            return next(err);
          }

          res.status(200).json(result.value);
        });

    })
    .catch(error => {
      error.status = 400;
      return next(error);
    });
});

//
// Delete a story from the save folder.
//
router.delete('/:id/savedstories/:sid', authHelper.checkAuth, function (req, res, next) {
  // Verify that the passed in id to delete is the same as that in the auth token
  if (req.params.id !== req.auth.userId) {
    let err = new Error('Invalid request for deletion of saved story');
    err.status = 401;
    return next(err);
  }


  req.db.collection.findOneAndUpdate({ type: 'USER_TYPE', _id: ObjectId(req.auth.userId) },
    { $pull: { savedStories: { storyID: req.params.sid } } },
    { returnDocument: "before" },
    function (err, result) {
      if (err) {
        console.log("+++POSSIBLE saved story delete CONTENTION ERROR?+++ err:", err);
        err.status = 400;
        return next(err);
      } else if (result.acknowledged !== true && result.ok !== 1) {
        console.log("+++POSSIBLE saved story delete CONTENTION ERROR?+++ result:", result);
        let err = new Error('Story delete failure');
        err.status = 409;
        return next(err);
      }

      res.status(200).json(result.value);
    });
});

module.exports = router;