import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormGroup, FormControl, Media } from 'react-bootstrap';
import { connect } from 'react-redux'
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
    dispatch({ type: 'REQUEST_NEWS' });
    fetch(`/api/users/${this.props.session.userId}`, {
      method: 'GET',
      headers: new Headers({
        'x-auth': this.props.session.token
      }),
      cache: 'default' // no-store or no-cache?
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 200) {
          throw new Error(response.json.message);
        }
        for (var i = 0; i < response.json.newsFilters.length; i++) {
          for (var j = 0; j < response.json.newsFilters[i].newsStories.length; j++) {
            response.json.newsFilters[i].newsStories[j].hours = toHours(response.json.newsFilters[i].newsStories[j].date);
          }
        }
        dispatch({ type: 'RECEIVE_NEWS_SUCCESS', newsFilters: response.json.newsFilters });
        dispatch({ type: 'MSG_DISPLAY', msg: "News fetched" });
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `News fetch failed: ${error.message}` });
      });
  }

  handleChangeFilter = (event) => {
    this.setState({ selectedIdx: parseInt(event.target.value, 10) });
  }

  handleShareStory = (index, event) => {
    const { dispatch } = this.props
    event.preventDefault();
    fetch('/api/sharednews', {
      method: 'POST',
      headers: new Headers({
        'x-auth': this.props.session.token,
        'Content-Type': 'application/json'
      }),
      cache: 'default', // no-store or no-cache ro default?
      body: JSON.stringify(this.props.newsFilters[this.state.selectedIdx].newsStories[index])
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 201) {
          throw new Error(response.json.message);
        }
        dispatch({ type: 'MSG_DISPLAY', msg: "Story shared" });
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Share of story failed: ${error.message}` });
      });
  }

  render() {
    if (this.props.isLoading) {
      return (
        <h1>Loading news...</h1>
      );
    }
    return (
      <div>
        <h1>News</h1 >
        <FormGroup controlId="formControlsSelect">
          <FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.handleChangeFilter} value={this.state.selectedIdx}>
            {this.props.newsFilters.map((filter, idx) =>
              <option key={idx} value={idx}>{filter.name}</option>
            )}
          </FormControl>
        </FormGroup>
        <hr />
        <Media.List>
          {this.props.newsFilters[this.state.selectedIdx].newsStories.map((story, idx) =>
            <Media.ListItem key={idx}>
              <Media.Left>
                <a href={story.link} target="_blank" rel="noopener noreferrer">
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
          <Media.ListItem key={this.props.newsFilters[this.state.selectedIdx].newsStories.length}>
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
