//
// session.js: A Node.js Module for session login and logout route handling.
//

"use strict";
var express = require('express');
var bcrypt = require('bcryptjs'); // For password hash comparing
var jwt = require('jwt-simple'); // For token authentication
var joi = require('joi'); // For data validation
var authHelper = require('./authHelper');

var router = express.Router();

//
// Create a security token as the user logs in that can be passed to the client and used on subsequent calls.
// The user email and password are sent in the body of the request.
//
router.post('/', function postSession(req, res, next) {
  // Password must be 7 to 15 characters in length and contain at least one numeric digit and a special character
  var schema = {
    email: joi.string().email().min(7).max(50).required(),
    password: joi.string().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/).required()
  };

  joi.validate(req.body, schema, function (err) {
    if (err) {
      let err = new Error('Invalid field: password 7 to 15 (one number, one special character)');
      err.status = 400;
      return next(err);
    }

    req.db.collection.findOne({ type: 'USER_TYPE', email: req.body.email }, function (err, user) {
      if (err) {
        err.status = 400;
        return next(err);
      }

      if (!user) {
        let err = new Error('User was not found.');
        err.status = 404;
        return next(err);
      }

      bcrypt.compare(req.body.password, user.passwordHash, function comparePassword(err, match) {
        if (match) {
          try {
            var token = jwt.encode({ authorized: true, sessionIP: req.ip, sessionUA: req.headers['user-agent'], userId: user._id.toHexString(), displayName: user.displayName }, process.env.JWT_SECRET);
            res.status(201).json({ displayName: user.displayName, userId: user._id.toHexString(), token: token, msg: 'Authorized' });
          } catch (err) {
            err.status = 400;
            return next(err);
          }
        } else {
          let err = new Error('Wrong password');
          err.status = 401;
          return next(err);
        }
      });
    });
  });
});

//
// Delete the token as a user logs out
//
router.delete('/:id', authHelper.checkAuth, function (req, res, next) {
  // Verify the passed in id is the same as that in the auth token
  if (req.params.id != req.auth.userId) {
    let err = new Error('Invalid request for logout');
    err.status = 401;
    return next(err);
  }

  res.status(200).json({ msg: 'Logged out' });
});

module.exports = router;