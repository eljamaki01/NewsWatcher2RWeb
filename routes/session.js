//
// session.js: A Node.js Module for session login and logout route handling.
//

"use strict";
var express = require('express');
var bcrypt = require('bcryptjs'); // For password hash comparing
var jwt = require('jwt-simple'); // For token authentication
var joi = require('joi'); // For data validation
var authHelper = require('./authHelper');
var AWSXRay = require('aws-xray-sdk');

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
    if (err)
      return next(new Error('Invalid field: password 7 to 15 (one number, one special character)'));

    AWSXRay.captureAsyncFunc('session:POST', function (subsegment) {
      req.db.collection.findOne({ type: 'USER_TYPE', email: req.body.email }, function (err, user) {
        var err = new Error('My test error!');

        if (err) {
          subsegment.addException(err);
          subsegment.addMetadata("findOneErrornew", err);
          subsegment.close();
          return next(err);
        }

        if (!user) {
          return next(new Error('User was not found.'));
        }

        bcrypt.compare(req.body.password, user.passwordHash, function comparePassword(err, match) {
          if (match) {
            try {
              var token = jwt.encode({ authorized: true, sessionIP: req.ip, sessionUA: req.headers['user-agent'], userId: user._id.toHexString(), displayName: user.displayName }, process.env.JWT_SECRET);
              res.status(201).json({ displayName: user.displayName, userId: user._id.toHexString(), token: token, msg: 'Authorized' });
            } catch (err) {
              return next(err);
            }
          } else {
            return next(new Error('Wrong password'));
          }
        });
      });
    });

  });
});

//
// Delete the token as a user logs out
//
router.delete('/:id', authHelper.checkAuth, function (req, res, next) {
  // Verify the passed in id is the same as that in the auth token
  if (req.params.id != req.auth.userId)
    return next(new Error('Invalid request for logout'));

  res.status(200).json({ msg: 'Logged out' });
});

module.exports = router;