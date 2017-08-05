import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormGroup, FormControl, Media } from 'react-bootstrap';
import { connect } from 'react-redux'
import superagent from 'superagent';
import noCache from 'superagent-no-cache';
import { toHours } from '../utils/utils';
import '../App.css';

class NewsView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIdx: 0
    };
  }

  componentDidMount() {
    if (!this.props.session) {
      return window.location.hash = "";
    }

    const { dispatch } = this.props
    // dispatch(fetchUserNewsFilters(this.props.session.userId))
    // dispatch({ type: 'REQUEST_NEWS', userId: this.props.session.userId });
    superagent.get(`/api/users/${this.props.session.userId}`)
      .set('Cache-Control', 'no-cache')
      .set('Pragma', 'no-cache')
      .set('If-Modified-Since', '0')
      .set('x-auth', this.props.session.token)
      .use(noCache)
      .end((err, res) => {
        if (err || !res.ok || res.status !== 200) {
          // this.props.parentMsgCB({ type: "MSG_FAIL", msg: `News fetch failed: ${res.body.message}` });
          dispatch({ type: 'MSG_DISPLAY', msg: `News fetch failed: ${res.body.message}` });
        } else {
          for (var i = 0; i < res.body.newsFilters.length; i++) {
            for (var j = 0; j < res.body.newsFilters[i].newsStories.length; j++) {
              res.body.newsFilters[i].newsStories[j].hours = toHours(res.body.newsFilters[i].newsStories[j].date);
            }
          }
          // this.setState({ newsFilters: res.body.newsFilters, isLoading: false });
          // this.props.parentMsgCB({ type: "MSG_OK", msg: "News fetched" });
          dispatch({ type: 'RECEIVE_NEWS_SUCCESS', newsFilters: res.body.newsFilters });
          dispatch({ type: 'MSG_DISPLAY', msg: "News fetched" });
        }
      });
  }

  handleChangeFilter = (event) => {
    this.setState({ selectedIdx: parseInt(event.target.value, 10) });
  }

  handleShareStory = (index, event) => {
    const { dispatch } = this.props
    event.preventDefault();
    superagent.post('/api/sharednews')
      .send(this.props.newsFilters[this.state.selectedIdx].newsStories[index])
      .set('Content-Type', 'application/json')
      .set('x-auth', this.props.session.token)
      .end((err, res) => {
        if (err || !res.ok || res.status !== 201) {
          // this.props.parentMsgCB({ type: "MSG_FAIL", msg: `Share of story failed: ${res.body.message}` });
          dispatch({ type: 'MSG_DISPLAY', msg: `Share of story failed: ${res.body.message}` });
        } else {
          // this.props.parentMsgCB({ type: "MSG_OK", msg: "Story shared" });
          dispatch({ type: 'MSG_DISPLAY', msg: "Story shared" });
        }
      });
  }

  render() {
    if (this.props.isLoading) {
      return (
        <h1>Loading...</h1>
      );
    }
    return (
      <div>
        <h1>News</h1 >
        <FormGroup controlId="formControlsSelect">
          <FormControl bsSize="lg" componentClass="select" placeholder="select" onChange={this.handleChangeFilter} value={this.state.selectedIdx}>
            {this.props.newsFilters.map((filter, idx) =>
              <option value={idx}><strong>{filter.name}</strong></option>
            )}
          </FormControl>
        </FormGroup>
        <hr />
        <Media.List>
          {this.props.newsFilters[this.state.selectedIdx].newsStories.map((story, idx) =>
            <Media.ListItem>
              <Media.Left>
                <a href={story.link} target="_blank">
                  <img alt="" className="media-object" src={story.imageUrl} />
                </a>
              </Media.Left>
              <Media.Body>
                <Media.Heading><b>{story.title}</b></Media.Heading>
                <p>{story.contentSnippet}</p>
                {story.source} <span>{story.hours}</span>
                <Media.Body>
                  <a style={{ cursor: 'pointer' }} onClick={(event) => this.handleShareStory(idx, event)}>Share</a>
                </Media.Body>
              </Media.Body>
            </Media.ListItem>
          )}
          <Media.ListItem>
            <Media.Left>
              <a href="http://developer.nytimes.com" target="_blank" rel="noopener noreferrer">
                <img alt="" src="poweredby_nytimes_30b.png" />
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
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    session: state.app.session,
    newsFilters: state.news.newsFilters,
    isLoading: state.news.isLoading
  }
}

export default connect(mapStateToProps)(NewsView)
