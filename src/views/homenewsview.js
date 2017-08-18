import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Media } from 'react-bootstrap';
import { connect } from 'react-redux'
import superagent from 'superagent';
import noCache from 'superagent-no-cache';
import { toHours } from '../utils/utils';
import '../App.css';

class HomeNewsView extends Component {

  componentDidMount() {
    const { dispatch } = this.props
    dispatch({ type: 'REQUEST_HOMENEWS' });    
    superagent.get('/api/homenews')
      .set('Cache-Control', 'no-cache')
      .set('Pragma', 'no-cache')
      .set('If-Modified-Since', '0')
      .use(noCache)
      .end((err, res) => {
        if (err || !res.ok || res.status !== 200) {
          dispatch({ type: 'MSG_DISPLAY', msg: `Home News fetch failed: ${res.body.message}` });
        } else {
          for (var i = 0; i < res.body.length; i++) {
            res.body[i].hours = toHours(res.body[i].date);
          }
          dispatch({ type: 'RECEIVE_HOMENEWS_SUCCESS', news: res.body });
          dispatch({ type: 'MSG_DISPLAY', msg: "Home Page news fetched" });
        }
      });
  }

  render() {
    if (this.props.isLoading) {
      return (
        <h1>Loading home page news...</h1>
      );
    }
    return (
      <div>
        <h1>Home Page News</h1 >
        <Media.List>
          {this.props.news.map((newsStory, idx) =>
            <Media.ListItem>
              <Media.Left>
                <a href={newsStory.link} target="_blank">
                  <img alt="" className="media-object" src={newsStory.imageUrl} />
                </a>
              </Media.Left>
              <Media.Body>
                <Media.Heading><b>{newsStory.title}</b></Media.Heading>
                <p>{newsStory.contentSnippet}</p>
                {newsStory.source} - <span>{newsStory.hours}</span>
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

HomeNewsView.propTypes = {
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    news: state.homenews.news,
    isLoading: state.homenews.isLoading
  }
}

export default connect(mapStateToProps)(HomeNewsView)
