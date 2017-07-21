//
// AngularJS Module with all of it's Controllers
//
"use strict";

angular.module('app', ['ngRoute'])
.config(function ($routeProvider) {
	$routeProvider
  .when('/', { controller: 'LoginCtrl', templateUrl: './ngviews/login.html' })
  .when('/news', { controller: 'NewsCtrl', templateUrl: './ngviews/news.html' })
  .when('/news/:saved', { controller: 'NewsCtrl', templateUrl: './ngviews/news.html' })
  .when('/sharednews', { controller: 'SharedNewsCtrl', templateUrl: './ngviews/sharednews.html' })
  .when('/profile', { controller: 'ProfileCtrl', templateUrl: './ngviews/profile.html' })
})
.controller('ApplicationCtrl', ['$rootScope', '$scope', '$http', '$location', '$window', function ($rootScope, $scope, $http, $location, $window) {
		// Check for token in local HTML5 client side storage
		var retrievedObject = $window.localStorage.getItem("userToken");
		if (retrievedObject) {
			$rootScope.session = JSON.parse(retrievedObject);
			$scope.remeberMe = true;
			$rootScope.loggedIn = true;
			$http.defaults.headers.common['x-auth'] = $rootScope.session.token;
			$scope.$emit('msg', "Signed in as " + $rootScope.session.displayName);
			$location.path('/news').replace();
		} else {
			$scope.remeberMe = false;
			$location.path('/').replace();
		}
		
		$scope.$on('msg', function (event, msg) {
			$scope.currentMsg = msg;
		});
		
		$scope.logout = function () {
			$http({
				method: 'DELETE',
				url: "/api/sessions/" + $rootScope.session.userId,
				headers: {
					'Content-Type': 'application/json'
				},
				responseType: 'json'
			}).then(function successCallback(response) {
				$rootScope.loggedIn = false;
				$rootScope.session = null;
				$http.defaults.headers.common["x-auth"] = null;
				$window.localStorage.removeItem("userToken");
				$scope.$emit('msg', "Signed out");
				$location.path('/').replace();
			}, function errorCallback(response) {
				$scope.$emit('msg', "Sign out failed. " + response.data.message);
			});
		}
		
		$scope.changeView = function (view) {
			$location.path(view).replace();
		}
		
		$scope.dismissError = function () {
			$scope.currentMsg = null;
		}
	}])
.controller('LoginCtrl', ['$rootScope', '$scope', '$http', '$location', '$window', function ($rootScope, $scope, $http, $location, $window) { // Login a user to use NewsWatcher
		$scope.login = function (email, password) {
			$http({
				method: 'POST',
				url: '/api/sessions',
				cache: false,
				headers: {
					'Content-Type': 'application/json'
				},
				responseType: 'json',
				data: { email: email, password: password }
			}).then(function successCallback(response) {
				$rootScope.loggedIn = true;
				$rootScope.session = response.data;
				$http.defaults.headers.common['x-auth'] = response.data.token;
				$scope.$emit('msg', "Signed in as " + response.data.displayName);
				// Set the token in client side storage if the user desires
				if ($scope.remeberMe) {
					var xfer = {
						token : response.data.token,
						displayName: response.data.displayName,
						userId: response.data.userId
					};
					$window.localStorage.setItem("userToken", JSON.stringify(xfer));
				} else {
					$window.localStorage.removeItem("userToken");
				}
				$location.path('/news').replace();
			}, function errorCallback(response) {
				$scope.$emit('msg', "Sign in failed: " + response.data.message);
			});
		}
		
		$scope.register = function () {
			$http({
				method: 'POST',
				url: '/api/users',
				cache: false,
				headers: {
					'Content-Type': 'application/json'
				},
				responseType: 'json',
				data: { email: $scope.emailReg, displayName: $scope.displayNameReg, password: $scope.passwordReg }
			}).then(function successCallback(response) {
				$scope.$emit('msg', "Registered");
			}, function errorCallback(response) {
				$scope.$emit('msg', "Failed to Register. " + response.data.message);
			});
		}
		
		$scope.openRegModal = function () {
			angular.element('#myRegModal').modal('show');
		}
	}])
.controller('ProfileCtrl', ['$rootScope', '$scope', '$http', '$location', '$window', function ($rootScope, $scope, $http, $location, $window) { // Retrieve a NewsWatcher user profile
		$http({
			method: 'GET',
			url: "/api/users/" + $rootScope.session.userId,
			cache: false,
			headers: {
				'Cache-Control': 'no-cache',
				'Pragma': 'no-cache',
				'If-Modified-Since': '0'
			},
			responseType: 'json'
		}).then(function successCallback(response) {
			$scope.user = response.data;
			for (var i = 0; i < $scope.user.newsFilters.length; i++) {
				$scope.user.newsFilters[i].keywordsStr = $scope.user.newsFilters[i].keyWords.join(',');
			}
			$scope.$emit('msg', "Profile fetched");
		}, function errorCallback(response) {
			$scope.$emit('msg', "Profile fetch failed. " + response.data.message);
		});
		
		$scope.selectedIdx = 0;
		
		$scope.selectOne = function (index) {
			$scope.selectedIdx = index;
		}
		
		$scope.deleteFilter = function () {
			$scope.user.newsFilters.splice($scope.selectedIdx, 1);
			$scope.selectedIdx = 0;
		}
		
		$scope.addFilter = function () {
			if ($scope.user.newsFilters.length == 5) {
				$scope.$emit('msg', "No more newsFilters allowed");
			} else {
				$scope.user.newsFilters.push({
					name: 'New Filter',
					keyWords : ["Keyword"],
					keywordsStr : "Keyword",
					enableAlert : false,
					alertFrequency : 0,
					enableAutoDelete : false,
					deleteTime : 0,
					timeOfLastScan : 0
				});
				$scope.selectedIdx = $scope.user.newsFilters.length - 1;
			}
		}
		
		$scope.saveProfile = function () {
			// Take the comma separated words and turn back into array.
			for (var i = 0; i < $scope.user.newsFilters.length; i++) {
				$scope.user.newsFilters[i].keyWords = $scope.user.newsFilters[i].keywordsStr.split(',');
			}
			
			$http({
				method: 'PUT',
				url: "/api/users/" + $rootScope.session.userId,
				cache: false,
				headers: {
					'Content-Type': 'application/json'
				},
				responseType: 'json',
				data: $scope.user
			}).then(function successCallback(response) {
				$scope.$emit('msg', "Profile saved");
			}, function errorCallback(response) {
				$scope.$emit('msg', "Profile save failed. " + response.data.message);
			});
		}
		
		$scope.deleteRegistration = function () {
			$http({
				method: 'DELETE',
				url: "/api/users/" + $rootScope.session.userId,
				headers: {
					'Content-Type': 'application/json'
				},
				responseType: 'json'
			}).then(function successCallback(response) {
				$rootScope.loggedIn = false;
				$rootScope.session = null;
				$http.defaults.headers.common["x-auth"] = null;
				$window.localStorage.removeItem("userToken");
				$scope.$emit('msg', "Account deleted");
				$location.path('/').replace();
			}, function errorCallback(response) {
				$scope.$emit('msg', "Account delete failed. " + response.data.message);
			});
		}
		
		$scope.openDelModal = function () {
			angular.element('#myDelModal').modal('show');
		}
	}])
.controller('NewsCtrl', ['$rootScope', '$scope', '$http', '$routeParams', function ($rootScope, $scope, $http, $routeParams) { // Retrieve NewsWatcher news
		$scope.selectedIdx = 0;
		$scope.showSavedNews = $routeParams.saved;
		
		$http({
			method: 'GET',
			url: "/api/users/" + $rootScope.session.userId,
			cache: false,
			headers: {
				'Cache-Control': 'no-cache',
				'Pragma': 'no-cache',
				'If-Modified-Since': '0'
			},
			responseType: 'json'
		}).then(function successCallback(response) {
			$scope.user = response.data;
			if ($routeParams.saved) {
				$scope.news = response.data.savedStories;
				for (var i = 0; i < $scope.news.length; i++) {
					$scope.news[i].hours = toHours($scope.news[i].date);
				}
			}
			else {
				$scope.news = $scope.user.newsFilters[$scope.selectedIdx].newsStories;
				for (var i = 0; i < $scope.user.newsFilters.length; i++) {
					for (var j = 0; j < $scope.user.newsFilters[i].newsStories.length; j++) {
						$scope.user.newsFilters[i].newsStories[j].hours = toHours($scope.user.newsFilters[i].newsStories[j].date);
					}
				}
			}
			
			$scope.$emit('msg', "News fetched");
		}, function errorCallback(response) {
			$rootScope.loggedIn = false;
			$rootScope.session = null;
			$http.defaults.headers.common["x-auth"] = null;
			$window.localStorage.removeItem("userToken");
			$scope.$emit('msg', "News fetch failed. " + response.data.message);
			$location.path('/').replace();
		});
		
		$scope.selectOne = function (index) {
			$scope.selectedIdx = index;
			$scope.news = $scope.user.newsFilters[$scope.selectedIdx].newsStories;
		}
		
		$scope.saveStory = function (index) {
			$http({
				method: 'POST',
				url: "/api/users/" + $rootScope.session.userId + "/savedstories",
				headers: {
					'Content-Type': 'application/json'
				},
				responseType: 'json',
				data: $scope.news[index]
			}).then(function successCallback(response) {
				$scope.$emit('msg', "Story saved");
			}, function errorCallback(response) {
				$scope.$emit('msg', "Story save failed. " + response.data.message);
			});
		}
		
		$scope.deleteSavedStory = function (index) {
			$http({
				method: 'DELETE',
				url: "/api/users/" + $rootScope.session.userId + "/savedstories/" + $scope.news[index].storyID,
				headers: {
					'Content-Type': 'application/json'
				},
				responseType: 'json'
			}).then(function successCallback(response) {
				$scope.news.splice(index, 1);
				$scope.$emit('msg', "Story deleted");
			}, function errorCallback(response) {
				$scope.$emit('msg', "Story delete failed. " + response.data.message);
			});
		}
		
		$scope.shareStory = function (index) {
			$http({
				method: 'POST',
				url: '/api/sharednews',
				headers: {
					'Content-Type': 'application/json'
				},
				responseType: 'json',
				data: $scope.news[index]
			}).then(function successCallback(response) {
				$scope.$emit('msg', "Story shared");
			}, function errorCallback(response) {
				$scope.$emit('msg', "Story share failed. " + response.data.message);
			});
		}
	}])
.controller('SharedNewsCtrl', ['$rootScope', '$scope', '$http', function ($rootScope, $scope, $http) { // Retrieve shared NewsWatcher stories
		$scope.selectedStoryIdx = null;
		
		$http({
			method: 'GET',
			url: '/api/sharednews',
			cache: false,
			headers: {
				'Cache-Control': 'no-cache',
				'Pragma': 'no-cache',
				'If-Modified-Since': '0'
			},
			responseType: 'json'
		}).then(function successCallback(response) {
			$scope.news = response.data;
			for (var i = 0; i < $scope.news.length; i++) {
				$scope.news[i].story.hours = toHours($scope.news[i].story.date);
			}
			$scope.$emit('msg', "News fetched");
		}, function errorCallback(response) {
			$scope.$emit('msg', "News fetch failed. " + response.data.message);
		});
		
		$scope.addStoryComment = function (index) {
			$http({
				method: 'POST',
				url: "/api/sharednews/" + $scope.news[$scope.selectedStoryIdx].story.storyID + "/Comments",
				headers: {
					'Content-Type': 'application/json'
				},
				responseType: 'json',
				data: { comment: $scope.comment }
			}).then(function successCallback(response) {
				$scope.news[$scope.selectedStoryIdx].comments.push({ displayName: $rootScope.session.displayName, comment: $scope.comment });
				$scope.$emit('msg', "Comment added");
			}, function errorCallback(response) {
				$scope.$emit('msg', "Comment add failed. " + response.data.message);
			});
		}
		
		$scope.openModal = function (index) {
			$scope.selectedStoryIdx = index;
			angular.element('#mySharedModal').modal('show');
		}
		
		$scope.showAddComment = function () {
			if ($scope.selectedStoryIdx != null)
				return $scope.news[$scope.selectedStoryIdx].comments.length < 30;
			else
				return false;
		}
	}]);

function toHours(date)
{
	var d1 = date;
	var d2 = Date.now();
	var diff = Math.floor((d2 - d1) / 3600000);
	if (diff == 0 || diff < 2) {
		return "1 hour ago";
	} else {
		return diff.toString() + " hours ago";
	}
}