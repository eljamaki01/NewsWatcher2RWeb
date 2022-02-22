//
// authHelper.js: A Node.js Module to inject middleware that validates the request header User token.
//
var jwt = require("jwt-simple");
//
// Check for a token in the custom header setting and verify that it is
// signed and has not been tampered with.
// If no header token is present, maybe the user
// The JWT Simple package will throw exceptions
//
module.exports.checkAuth = function (req, res, next) {
  if (req.headers['x-auth']) {
    try {
      req.auth = jwt.decode(req.headers['x-auth'], process.env.JWT_SECRET);

      // Could verify that token was from the same origionating machine as this request, test would be as follows
      // if (req.auth && req.auth.authorized && req.auth.userId && req.auth.sessionIP===req.ip && req.auth.sessionUA===req.headers['user-agent']) {
      if (req.auth && req.auth.authorized && req.auth.userId) {
        return next();
      } else {
        let err = new Error('User is not logged in.');
        err.status = 401;
        return next(err);
      }
    } catch (err) {
      err.status = 401;
      return next(err);
    }
  } else {
    let err = new Error('User is not logged in.');
    err.status = 401;
    return next(err);
  }
};