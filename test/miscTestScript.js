//
// For things I need handy for one time scripts, like creating and deleteing lots of users.
//
// node test\miscTestScript.js

var async = require('async');
var assert = require('assert');

//var request = require('supertest')('https://www.newswatcherfs.com/'); // To hit production AWS!
var request = require('supertest')('http://localhost:3000'); // For local testing

var NUM_USERS = 50;
var usersP = [];
for (var i = 0; i < NUM_USERS; i++) {
	usersP.push({ idx: i, email: 'testrunPPP87654980' + i + '@example.com', displayName: 'testrunPPP87654980' + i, password: 'abc123*', token: null, userId: null, savedDoc: null });
}

async.series({
	//one: function (callback) { // Account creations
	//	console.log("STEP: Create all test user accounts and set filter to have stories");
	//	async.eachLimit(usersP, 2, function (user, innercallback) {
	//		request.post("/api/users")
	//        .send({
	//			email: usersP[user.idx].email,
	//			displayName: usersP[user.idx].displayName,
	//			password: usersP[user.idx].password
	//		})
	//        .end(function (err, res) {
	//			assert.equal(res.status, 201);
	//			innercallback();
	//		});
	//	}, function (err) {
	//		if (err) {
	//			console.log('User creation failure');
	//		} else {
	//			console.log('User creation success');
	//		}
	//		setTimeout(function () {
	//			console.log('Wait for news story update after creation phase');
	//			callback(err, 1);
	//		}, 500);
	//	});
	//}
	
	two: function (callback) { // logins
		console.log("STEP: Log in all accounts");
		async.eachLimit(usersP, 2, function (user, innercallback) {
			request.post("/api/sessions")
         .send({
				email: usersP[user.idx].email,
				password: usersP[user.idx].password
			})
         .end(function (err, res) {
				if (res.status == 201) {
					usersP[user.idx].token = res.body.token;
					usersP[user.idx].userId = res.body.userId;
				}
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
	five: function (callback) { // User account deletions
		console.log("STEP: Delete all test user accounts");
		async.eachLimit(usersP, 2, function (user, innercallback) {
			if (usersP[user.idx].userId != null) {
				request.del("/api/users/" + usersP[user.idx].userId)
				.set('x-auth', usersP[user.idx].token)
				.end(function (err, res) {
					assert.equal(res.status, 200);
					innercallback();
				});
			} else {
				innercallback();
			}
		}, function (err) {
			if (err) {
				console.log('User deletion failure');
			} else {
				console.log('User deletion success');
			}
			callback(err, 1);
		});
	}
},
function (err, results) {
	console.log("END: misc script");
});