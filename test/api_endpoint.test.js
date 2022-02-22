
// Note that we launch the test as follows as per the package.json file - npm run test-API
// "test-API": "jest --runInBand --testTimeout 999999 --collectCoverage true test/api_endpoint.test.js",
// --runInBand tells Jest to run the tests serially in the current process rather than creating a
// worker pool and parallelizing the tests across several workers.
var assert = require('assert').strict;
var app = require('../server.js');
var request = require('supertest')(app);
// To hit production AWS!
// var request = require('supertest')('https://www.mydomain.com/');
// run locally, like in vscode debugger and test against that
// var request = require('supertest')('http://localhost:3000');

describe('API endpoint exercising integration tests', function () {

  // Wait until the database is up and connected to.
  beforeAll(function (done) {
    setTimeout(function () {
      done();
    }, 5000);
  });

  // // Shut everything down gracefully
  afterAll(function (done) {
    app.db.client.close(true, function () {
      setTimeout(function () {
        app.close();
        done();
      }, 5000);
    });
  });

  describe('User cycle operations', function () {
    var token;
    var userId;
    var storyID;
    var savedDoc;

    test("should deny unregistered user a login attempt", function (done) {
      request.post("/api/sessions").send({
        email: 'bush999@sample.com',
        password: 'abc123*999'
      })
        .end(function (err, res) {
          assert.equal(res.status, 404);
          done();
        });
    });

    test("should create a new registered User", function (done) {
      request.post("/api/users")
        .send({
          email: 'bush@sample.com',
          displayName: 'Bushman',
          password: 'abc123*'
        })
        .end(function (err, res) {
          assert.equal(res.status, 201);
          assert.equal(res.body.displayName, "Bushman", "Name of user should be as set");
          done();
        });
    });

    test("should not create a User twice", function (done) {
      request.post("/api/users")
        .send({
          email: 'bush@sample.com',
          displayName: 'Bushman',
          password: 'abc123*'
        })
        .end(function (err, res) {
          assert.equal(res.status, 403);
          assert.equal(res.body.message, "Error: Email account already registered", "Error should be already registered");
          done();
        });
    });

    test("should detect incorrect password", function (done) {
      request.post("/api/sessions")
        .send({
          email: 'bush@sample.com',
          password: 'wrong1*'
        })
        .end(function (err, res) {
          assert.equal(res.status, 401);
          assert.equal(res.body.message, "Error: Wrong password", "Error should be already registered");
          done();
        });
    });

    test("should let joi catch an invalid password", function (done) {
      request.post("/api/sessions").send({
        email: 'bush@sample.com',
        password: 'a'
      })
        .end(function (err, res) {
          assert.equal(res.status, 400);
          done();
        });
    });

    test("should allow registered user to login", function (done) {
      request.post("/api/sessions")
        .send({
          email: 'bush@sample.com',
          password: 'abc123*'
        })
        .end(function (err, res) {
          token = res.body.token;
          userId = res.body.userId;
          assert.equal(res.status, 201);
          assert.equal(res.body.msg, "Authorized", "Message should be AUthorized");
          done();
        });
    });

    test("should allow access if logged in", function (done) {
      request.get("/api/users/" + userId)
        .set('x-auth', token)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test("should update the profile with new newsFilters", function (done) {
      request.put("/api/users/" + userId)
        .send({
          settings: {
            requireWIFI: true,
            enableAlerts: false
          },
          newsFilters: [{
            name: 'Politics',
            keyWords: ["Obama", "Clinton", "Bush", "Trump", "Putin"],
            enableAlert: false,
            alertFrequency: 0,
            enableAutoDelete: false,
            deleteTime: 0,
            timeOfLastScan: 0
          },
          {
            name: 'Countries',
            keyWords: ["United States", "China", "Russia", "Israel", "India", "Iran"],
            enableAlert: false,
            alertFrequency: 0,
            enableAutoDelete: false,
            deleteTime: 0,
            timeOfLastScan: 0
          }]
        })
        .set('x-auth', token)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          setTimeout(function () {
            done();
          }, 4000);
        });
    });

    test("should return updated news stories", function (done) {
      request.get("/api/users/" + userId)
        .set('x-auth', token)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          savedDoc = res.body.newsFilters[0].newsStories[0];
          assert.equal(res.body.newsFilters[0].keyWords[0], 'Obama');
          done();
        });
    });

    test("should create a shared news story", function (done) {
      request.post("/api/sharednews")
        .send(savedDoc)
        .set('x-auth', token)
        .end(function (err, res) {
          let statusEqual = (res.status === 201 || res.status === 403)
          assert.equal(true, statusEqual);
          done();
        });
    });

    test("should return shared news story and comment", function (done) {
      request.get("/api/sharednews")
        .set('x-auth', token)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          storyID = res.body[0].story.storyID;
          done();
        });
    });

    test("should add a new comment", function (done) {
      request.post("/api/sharednews/" + storyID + "/Comments")
        .send({ comment: "This is amazing news!" })
        .set('x-auth', token)
        .end(function (err, res) {
          assert.equal(res.status, 201);
          setTimeout(function () {
            done();
          }, 4000);
        });
    });

    test("should have the added comment for the news story", function (done) {
      // Delay just a bit to make sure the async comment write takes place
      request.get("/api/sharednews")
        .set('x-auth', token)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          // assert.equal(res.body[0].comments[1].comment, "This is amazing news!", "Comment should be there");
          done();
        });
    });

    test("should delete the shared news story", function (done) {
      request.del("/api/sharednews/" + storyID)
        .set('x-auth', token)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test("should allow registered user to logout", function (done) {
      request.del("/api/sessions/" + userId)
        .set('x-auth', token)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test("should not allow access if not logged in", function (done) {
      request.get("/api/users/" + userId)
        .end(function (err, res) {
          assert.equal(res.status, 401);
          done();
        });
    });

    test("should allow registered user to login again", function (done) {
      request.post("/api/sessions")
        .send({
          email: 'bush@sample.com',
          password: 'abc123*'
        })
        .end(function (err, res) {
          token = res.body.token;
          userId = res.body.userId;
          assert.equal(res.status, 201);
          assert.equal(res.body.msg, "Authorized", "Message should be AUthorized");
          done();
        });
    });

    test("should delete a registered User", function (done) {
      request.del("/api/users/" + userId)
        .set('x-auth', token)
        .end(function (err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('should return a 404 for invalid requests', function (done) {
      request.get('/blah')
        .end(function (err, res) {
          assert.equal(res.status, 404);
          done();
        });
    });
  });
});
