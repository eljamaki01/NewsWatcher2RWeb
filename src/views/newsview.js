import React, { Component } from 'react';
import { Redirect } from 'react-router'
import PropTypes from 'prop-types';
import '../App.css';

function toHours(date) {
	var d1 = date;
	var d2 = Date.now();
	var diff = Math.floor((d2 - d1) / 3600000);
	if (diff == 0 || diff < 2) {
		return "1 hour ago";
	} else {
		return diff.toString() + " hours ago";
	}
}

class NewsView extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			selectedIdx: 0,
			user: null,
			news: null
		};
	}

	componentDidMount() {
		var myInit = {
			method: 'GET',
			cache: "no-cache",
			headers: new Headers({
				'Cache-Control': 'no-cache',
				'Pragma': 'no-cache',
				'If-Modified-Since': '0',
				"x-auth": this.props.session.token
			})
		};

		fetch(`/api/sessions/${this.state.session.userId}`, myInit).then(function (response) {
			if (response.ok) {
				return response.json()
			}
			throw new Error('Network response was not ok.');
		}).then(function (myJson) {
			console.log("HERE10");
			console.log(myJson);
			this.setState({ user: myJson.data });
			this.state.news = this.state.user.newsFilters[this.state.selectedIdx].newsStories;
			for (var i = 0; i < this.state.user.newsFilters.length; i++) {
				for (var j = 0; j < this.state.user.newsFilters[i].newsStories.length; j++) {
					this.state.user.newsFilters[i].newsStories[j].hours = toHours(this.state.user.newsFilters[i].newsStories[j].date);
				}
			}

			//$scope.$emit('msg', "News fetched");CAN have a callback to the parent!!!!!!!!!!!!!!!!
		}).catch(function (error) {
			console.log("NEWS FETCH FAILURE:" + error);
			//$rootScope.loggedIn = false;PASS up back through a callback!. Could make a single one that reacts to msg and these also
			// Just pass up a single failure message an then can do all these there
			//$rootScope.session = null;
			//$window.localStorage.removeItem("userToken");
			//$scope.$emit('msg', "News fetch failed. " + response.data.message);CAN have a callback to the parent!!!!!!!!!!!!!!!!
			<Redirect to="/" />
		});
	}

	render() {
		//look for some react Bootstrap component that put up a loading state
		if (this.state.isLoading) {
			return (
				<h1>Loading...</h1>
			);
		}
		return (
			<div>
				<ul>
					{this.state.news.map(story =>
						<li key={story.id}>{story.title}</li>
					)}
				</ul>
			</div>
		);
	}
}

// NewsView.propTypes = {
// 	name1: PropTypes.string.isRequired,
// 	name2: PropTypes.string
// };

// NewsView.defaultProps = {
// 	name2: 'Unknown person'
// };

export default NewsView;
// //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// ???As take over, switch everything to usage of react- bootsrap components if ines are available
// 				< h1 > News</h1 >
// 				<hr />
// 				<ul class="media-list">
// 					{this.state.news.map(story =>
// 						<li key={post.id}>{post.title}</li>
// 						<li class="media">
// 						<div class="media-left">
// 							<a href={story.link} target="_blank">
// 								<img class="media-object" ng-src={story.imageUrl}>
// 			</a>
// 		</div>
// 							<div class="media-body">
// 								<h class="media-heading"><b>{story.title}</b></h>
// 								<p>{story.contentSnippet}</p>
// 								{story.source} <span>{story.hours}</span>
// 								<div class="media-body">
// 									<a href="javascript:void(0)" ng-click="saveStory($index)">Save</a> | <span><a href="javascript:void(0)" ng-click="shareStory($index)">Share</a></span>
// 								</div>
// 							</div>
// 	</li>
// 						<li class="media">
// 							<div class="media-left">
// 								<a href="http://developer.nytimes.com" target="_blank">
// 									<img ng-src="poweredby_nytimes_30b.png">
// 			</a>
// 		</div>
// 								<div class="media-body">
// 									<h class="media-heading"><b>Data provided by The New York Times</b></h>
// 								</div>
// 	</li>
// 					)}
// 				</ul>
// //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX


// $scope.selectOne = function (index) {
// 	$scope.selectedIdx = index;
// 	$scope.news = $scope.user.newsFilters[$scope.selectedIdx].newsStories;
// }

// $scope.saveStory = function (index) {
// 	$http({
// 		method: 'POST',
// 		url: "/api/users/" + $rootScope.session.userId + "/savedstories",
// 		headers: {
// 			'Content-Type': 'application/json'
// 		},
// 		responseType: 'json',
// 		data: $scope.news[index]
// 	}).then(function successCallback(response) {
// 		$scope.$emit('msg', "Story saved");
// 	}, function errorCallback(response) {
// 		$scope.$emit('msg', "Story save failed. " + response.data.message);
// 	});
// }

// $scope.shareStory = function (index) {
// 	$http({
// 		method: 'POST',
// 		url: '/api/sharednews',
// 		headers: {
// 			'Content-Type': 'application/json'
// 		},
// 		responseType: 'json',
// 		data: $scope.news[index]
// 	}).then(function successCallback(response) {
// 		$scope.$emit('msg', "Story shared");
// 	}, function errorCallback(response) {
// 		$scope.$emit('msg', "Story share failed. " + response.data.message);
// 	});
// }
// 	}])
