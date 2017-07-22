import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Media } from 'react-bootstrap';
import superagent from 'superagent';
import noCache from 'superagent-no-cache';
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
    superagent.get(`/api/users/${this.props.session.userId}`)
      .set('Cache-Control', 'no-cache')
      .set('Pragma', 'no-cache')
      .set('If-Modified-Since', '0')
      .set('x-auth', this.props.session.token)
      .use(noCache)
      .end((err, res) => {
        if (err || !res.ok || res.status != 200) {
          //$rootScope.loggedIn = false;PASS up back through a callback!. Could make a single one that reacts to msg and these also
          // Just pass up a single failure message an then can do all these there
          //$rootScope.session = null;
          //$window.localStorage.removeItem("userToken");
          this.props.parentMsgCB({ type: "MSG_FAIL", msg: `News fetch failed: ${res.body.message}` });
          window.location.replace(window.location.pathname + '#/');
        } else {
          this.setState({ user: res.body });
          this.state.news = this.state.user.newsFilters[this.state.selectedIdx].newsStories;
          for (var i = 0; i < this.state.user.newsFilters.length; i++) {
            for (var j = 0; j < this.state.user.newsFilters[i].newsStories.length; j++) {
              this.state.user.newsFilters[i].newsStories[j].hours = toHours(this.state.user.newsFilters[i].newsStories[j].date);
            }
          }
          this.setState({ isLoading: false });
          this.props.parentMsgCB({ type: "MSG_OK", msg: "News fetched" });
        }
      });
  }

  render() {
    if (this.state.isLoading) {
      return (
        <h1>Loading...</h1>
      );
    }
    return (
      <div>
        < h1 > News</h1 >
        {/* <button ng-repeat="filter in user.newsFilters" type="button" className="list-group-item" onClick="selectOne($index)" className="{active: $index == selectedIdx}"><strong>{filter.name}</strong></button> */}
        <hr />

        <Media.List>
          {this.state.news.map(story =>
            <Media.ListItem>
              <Media.Left>
                <a href={story.link} target="_blank">
                  <img className="media-object" src={story.imageUrl} />
                </a>
              </Media.Left>
              <Media.Body>
                <Media.Heading><b>{story.title}</b></Media.Heading>
                <p>{story.contentSnippet}</p>
                {story.source} <span>{story.hours}</span>
                <Media.Body>
                  <a href="javascript:void(0)">Save</a>
                  {/* <a href="javascript:void(0)" onClick={this.saveStory($index)}>Save</a> | <span><a href="javascript:void(0)" onClick={this.shareStory($index)}>Share</a></span> */}
                </Media.Body>
              </Media.Body>
            </Media.ListItem>
          )}
          <Media.ListItem>
            <Media.Left>
              <a href="http://developer.nytimes.com" target="_blank">
                <img src="poweredby_nytimes_30b.png" />
              </a>
            </Media.Left>
            <Media.Body>
              <Media.Heading><b>Data provided by The New York Times</b></Media.Heading>
            </Media.Body>
          </Media.ListItem>
        </Media.List>
      </div>
    );
  }
}

NewsView.propTypes = {
  session: PropTypes.func.isRequired,
  parentMsgCB: PropTypes.func.isRequired
};

export default NewsView;
