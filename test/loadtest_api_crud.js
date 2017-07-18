// This will be used by the mocha test framework to be digested and run and provide functional testing.
// We want to exercise as much of our web service API as possible..
// First, start up the node.js application locally, or have it deployed to point to.
// node server.js
// Then you can run mocha from the local project install.
// node test/loadtest_api_crud.js
//

//var http = require('http');
var async = require('async');
var assert = require('assert');

//var request = require('supertest')('https://www.newswatcherfs.com/'); // To hit production AWS!
var request = require('supertest')('http://localhost:3000'); // For local testing

var NUM_USERS = 5;
var MAX_PARALLEL_BEFOREAFTER = 2;
var MAX_PARALLEL_WORKLOAD = 3;
var NUM_WORK_LOOPS = 2;

var usersP = [];
for (var i = 0; i < NUM_USERS; i++) {
    usersP.push({ idx: i, email: 'testrunPPP87654980' + i + '@example.com', displayName: 'testrunPPP87654980' + i, password: 'abc123*', token: null, userId: null, savedDoc: null });
}

// Note: RU limits S1=250/sec, S2=1000/sec, S3=2500/sec
console.log("START: load testing");
console.time('LOAD TEST DURATION');
async.series({
    //setup: function (callback) {
    //   console.log("STEP: Start CPU profiling");
    //   request.post("/testing/startcpuprofile")
    //   .send({
    //   })
    //   .end(function (err, res) {
    //      assert.equal(res.status, 201);
    //      callback(err, 1);
    //   });
	
    //   //console.log("STEP: Take heap snapshot");
    //   //request.post("/testing/takeheapsnapshot")
    //   //   .send({
    //   //})
    //   //   .end(function (err, res) {
    //   //   assert.equal(res.status, 201);
    //   //   callback(err, 1);
    //   //});
    //},
    one: function (callback) { // Account creations
        console.log("STEP: Create all test user accounts and set filter to have stories");
        async.eachLimit(usersP, MAX_PARALLEL_BEFOREAFTER, function (user, innercallback) {
            request.post("/api/users")
                .send({
                    email: usersP[user.idx].email,
                    displayName: usersP[user.idx].displayName,
                    password: usersP[user.idx].password
                })
                .end(function (err, res) {
                    assert.equal(res.status, 201);
                    innercallback();
                });
        }, function (err) {
            if (err) {
                console.log('User creation failure');
            } else {
                console.log('User creation success');
            }
            callback(err, 1);
        });
    },
    two: function (callback) { // logins
        console.log("STEP: Log in all accounts");
        async.eachLimit(usersP, MAX_PARALLEL_BEFOREAFTER, function (user, innercallback) {
            request.post("/api/sessions")
                .send({
                    email: usersP[user.idx].email,
                    password: usersP[user.idx].password
                })
                .end(function (err, res) {
                    assert.equal(res.status, 201);
                    usersP[user.idx].token = res.body.token;
                    usersP[user.idx].userId = res.body.userId;
                    innercallback();
                });
        }, function (err) {
            if (err) {
                console.log('User login failure');
            } else {
                console.log('User login success');
            }
            callback(err, 1);
        });
    },
    three: function (callback) { // Filter setting
        console.log("STEP: Set newsFilters to all have test story");
        async.eachSeries(usersP, function (user, innercallback) {
            request.put("/api/users/" + usersP[user.idx].userId)
                .send({
                    settings: {
                        requireWIFI: true,
                        enableAlerts: false
                    },
                    newsFilters: [{
                        name: 'Words',
                        keyWords: ["testingKeyword"],
                        enableAlert: false,
                        alertFrequency: 0,
                        enableAutoDelete: false,
                        deleteTime: 0,
                        timeOfLastScan: 0
                    }]
                })
                .set('x-auth', usersP[user.idx].token)
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    innercallback();
                });
        }, function (err) {
            if (err) {
                console.log('User filter set failure');
            } else {
                console.log('User filter set success');
            }
            callback(err, 1);
        });
    },
    four: function (callback) {
        console.log("STEP: Hold onto one of the news stories for later use");
        async.eachSeries(usersP, function (user, innercallback) {
            request.get("/api/users/" + usersP[user.idx].userId)
                .set('x-auth', usersP[user.idx].token)
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    var storyChoice = Math.floor(Math.random() * res.body.newsFilters[0].newsStories.length)
                    usersP[user.idx].savedDoc = res.body.newsFilters[0].newsStories[storyChoice];
                    innercallback();
                });
        }, function (err) {
            if (err) {
                console.log('User filter set failure');
            } else {
                console.log('User filter set success');
            }
            console.log('Share one story to start');
            request.post("/api/sharednews")
                .send(usersP[0].savedDoc)
                .set('x-auth', usersP[0].token)
                .end(function (err, res) {
                    // res.status could be 201 or 500. depending on if the story was added already or not
                    assert.equal((res.status == 201 || res.status == 500), true);
                    request.get("/api/sharednews")
                        .set('x-auth', usersP[0].token)
                        .end(function (err, res) {
                            assert.equal(res.status, 200);
                            callback(err, 1);
                        });
                });
        });
    },
    five: function (callback) { // Do some work flows
        console.log("STEP: Run parallel and series tasks in a loop");
        async.timesSeries(NUM_WORK_LOOPS, function (n, next) {
            async.eachLimit(usersP, MAX_PARALLEL_WORKLOAD, function (user, innercallback) {
                array_of_scenarioFcns[Math.floor(Math.random() * array_of_scenarioFcns.length)](user, innercallback);
            }, function (err) {
                if (err) {
                    console.log('User workload pass failure');
                } else {
                    console.log('User workload pass success');
                }
                next(err, 1)
                //console.log("STEP: Take heap snapshot");
                //request.post("/testing/takeheapsnapshot")
                //.send({
                //})
                //.end(function (err, res) {
                //   assert.equal(res.status, 201);
                //   next(err, 1)
                //});
            });
        }, function (err, users) {
            if (err) {
                console.log('WORKLOAD failure');
            } else {
                console.log('WORLOAD success');
            }
            callback(err, 1);
        });
    },
    six: function (callback) {
        console.log("STEP: Delete all test shared news stories left around");
        request.get("/api/sharednews")
            .set('x-auth', usersP[0].token)
            .end(function (err, res) {
                assert.equal(res.status, 200);
                // We have to at least leave one news story around to comment on!
                if (res.body.length > 0) {
                    async.eachSeries(res.body, function (story, innercallback) {
                        if (story.story.title.indexOf("testingKeyword") >= 0) {
                            request.del("/api/sharednews/" + story.story.storyID)
                                .set('x-auth', usersP[0].token)
                                .end(function (err, res) {
                                    assert.equal(res.status, 200);
                                    innercallback();
                                });
                        } else {
                            innercallback();
                        }
                    }, function (err) {
                        if (err) {
                            console.log('story deletion failure');
                        }
                        callback(err, 1);
                    });
                } else {
                    callback(err, 1);
                }
            });
    },
    seven: function (callback) { // User account deletions
        console.log("STEP: Delete all test user accounts");
        async.eachLimit(usersP, MAX_PARALLEL_BEFOREAFTER, function (user, innercallback) {
            request.del("/api/users/" + usersP[user.idx].userId)
                .set('x-auth', usersP[user.idx].token)
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    innercallback();
                });
        }, function (err) {
            if (err) {
                console.log('User deletion failure');
            } else {
                console.log('User deletion success');
            }
            callback(err, 1);
        });
    }
    //teardown: function (callback) {
    //   console.log("STEP: Stop CPU profiling");
    //   request.post("/testing/stopcpuprofile")
    //   .send({
    //   })
    //   .end(function (err, res) {
    //      assert.equal(res.status, 201);
    //      callback(err, 1);
    //   });

    //   //console.log("STEP: Take heap snapshot");
    //   //request.post("/testing/takeheapsnapshot")
    //   //   .send({
    //   //})
    //   //   .end(function (err, res) {
    //   //   assert.equal(res.status, 201);
    //   //   callback(err, 1);
    //   //});
    //}
},
    function (err, results) {
        console.log("END: load testing");
        console.timeEnd('LOAD TEST DURATION');
        // results will be an object with properties of return values of each series task
    });

// array of fucntions of ramdomly selected scenarios
var array_of_scenarioFcns = [
    function (user, innercallback) {
        console.log("It should not create a User twice")
        request.post("/api/users")
            .send({
                email: usersP[user.idx].email,
                displayName: usersP[user.idx].displayName,
                password: usersP[user.idx].password
            })
            .end(function (err, res) {
                assert.equal(res.status, 500);
                assert.equal(res.body.message, "Error: Email account already registered", "Error should be already registered");
                innercallback();
            });
    },
    function (user, innercallback) {
        console.log("It should detect incorrect password")
        request.post("/api/sessions")
            .send({
                email: usersP[user.idx].email,
                password: 'wrong1*'
            })
            .end(function (err, res) {
                assert.equal(res.status, 500);
                assert.equal(res.body.message, "Error: Wrong password", "Error should be already registered");
                innercallback();
            });
    },
    function (user, innercallback) {
        console.log("It should allow access if logged in")
        request.get("/api/users/" + usersP[user.idx].userId)
            .set('x-auth', usersP[user.idx].token)
            .end(function (err, res) {
                assert.equal(res.status, 200);
                innercallback();
            });
    },
    function (user, innercallback) {
        console.log("It should log someone out and then back in")
        request.del("/api/sessions/" + usersP[user.idx].userId)
            .set('x-auth', usersP[user.idx].token)
            .end(function (err, res) {
                assert.equal(res.status, 200);
                request.post("/api/sessions")
                    .send({
                        email: usersP[user.idx].email,
                        password: usersP[user.idx].password
                    })
                    .end(function (err, res) {
                        usersP[user.idx].token = res.body.token;
                        usersP[user.idx].userId = res.body.userId;
                        assert.equal(res.status, 201);
                        innercallback();
                    });
            });
    },
    function (user, innercallback) {
        console.log("It should update the profile with newsFilters")
        request.get("/api/users/" + usersP[user.idx].userId)
            .send({
                settings: {
                    requireWIFI: true,
                    enableAlerts: false
                },
                newsFilters: [{
                    name: 'Politics',
                    keyWords: ["testingKeyword"],
                    enableAlert: false,
                    alertFrequency: 0,
                    enableAutoDelete: false,
                    deleteTime: 0,
                    timeOfLastScan: 0
                },
                    {
                        name: 'Countries',
                        keyWords: ["United States"],
                        enableAlert: false,
                        alertFrequency: 0,
                        enableAutoDelete: false,
                        deleteTime: 0,
                        timeOfLastScan: 0
                    }]
            })
            .set('x-auth', usersP[user.idx].token)
            .end(function (err, res) {
                assert.equal(res.status, 200);
                setTimeout(function () {
                    request.get("/api/users/" + usersP[user.idx].userId)
                        .set('x-auth', usersP[user.idx].token)
                        .end(function (err, res) {
                            assert.equal(res.status, 200);
                            if (res.body.newsFilters[0].newsStories.length > 0) {
                                var storyChoice = Math.floor(Math.random() * res.body.newsFilters[0].newsStories.length)
                                usersP[user.idx].savedDoc = res.body.newsFilters[0].newsStories[storyChoice];
                            }
                            innercallback();
                        });
                }, 500);
            });
    },
    function (user, innercallback) {
        console.log("It should move a news story to the savedStories folder and then delete it")
        request.post("/api/users/" + usersP[user.idx].userId + "/savedstories")
            .send(usersP[user.idx].savedDoc)
            .set('x-auth', usersP[user.idx].token)
            .end(function (err, res) {
                assert.equal(res.status, 200);
                request.del("/api/users/" + usersP[user.idx].userId + "/savedstories/" + usersP[user.idx].savedDoc.storyID)
                    .set('x-auth', usersP[user.idx].token)
                    .end(function (err, res) {
                        assert.equal(res.status, 200);
                        innercallback();
                    });
            });
    },
    function (user, innercallback) {
        console.log("It should create a shared news story")
        request.post("/api/sharednews")
            .send(usersP[user.idx].savedDoc)
            .set('x-auth', usersP[user.idx].token)
            .end(function (err, res) {
                // res.status could be 201 or 500. depending on if the story was added already or not
                assert.equal((res.status == 201 || res.status == 500), true);
                innercallback();
            });
    },
    function (user, innercallback) {
        console.log("It should get shared news stories and comment on random one")
        request.get("/api/sharednews")
            .set('x-auth', usersP[user.idx].token)
            .end(function (err, res) {
                assert.equal(res.status, 200);
                if (res.body.length > 0) {
                    var storyChoice = Math.floor(Math.random() * res.body.length)
                    var storyID = res.body[storyChoice].story.storyID;
                    request.post("/api/sharednews/" + storyID + "/Comments")
                        .send({ comment: "This is amazing news!" })
                        .set('x-auth', usersP[user.idx].token)
                        .end(function (err, res) {
                            // Accept a 201, or a 500 if message is "Comment limit reached"
                            if (res.status == 500) {
                                assert.equal(res.body.message, "Error: Comment limit reached", "Limit message was expecetd");
                            } else {
                                assert.equal(res.status, 201);
                            }

                            innercallback();
                        });
                } else {
                    console.log("NO NO NO NO NO stories returned! NONONONONO NONONO NO NO")
                    innercallback();
                }
            });
    },
    function (user, innercallback) {
        console.log("It should delete a random shared news story")
        request.get("/api/sharednews")
            .set('x-auth', usersP[user.idx].token)
            .end(function (err, res) {
                assert.equal(res.status, 200);
                // We have to at least leave one news story around to comment on!
                if (res.body.length > 1) {
                    var storyChoice = Math.floor(Math.random() * res.body.length);
                    var storyID = res.body[storyChoice].story.storyID;
                    request.del("/api/sharednews/" + storyID)
                        .set('x-auth', usersP[user.idx].token)
                        .end(function (err, res) {
                            assert.equal(res.status, 200);
                            innercallback();
                        });
                } else {
                    innercallback();
                }
            });
    }
]