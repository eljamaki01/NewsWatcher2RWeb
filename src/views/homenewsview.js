import React, { Component } from 'react';
import { Media } from 'react-bootstrap';
import { toHours } from '../utils/utils';
import '../App.css';

class HomeNewsView extends Component {
  constructor(props) {
    super(props);
    this.state = { isLoading: true, news: null };
  }

  componentDidMount() {
    return fetch('/api/homenews', {
      method: 'GET',
      cache: 'default'
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 200) {
          throw new Error(response.json.message);
        }
        for (var i = 0; i < response.json.length; i++) {
          response.json[i].hours = toHours(response.json[i].date);
        }
        this.setState({
          isLoading: false,
          news: response.json
        });
        this.props.dispatch({ type: 'MSG_DISPLAY', msg: "Home Page news fetched" });
      })
      .catch(error => {
        this.props.dispatch({ type: 'MSG_DISPLAY', msg: `Home News fetch failed: ${error.message}` });
      });
  }

  render() {
    if (this.state.isLoading) {
      return (
        <h1>Loading home page news...</h1>
      );
    }
    return (
      <div>
        <h1>Home Page News</h1 >
        <Media.List>
          {this.state.news.map((newsStory, idx) =>
            <Media.ListItem key={idx}>
              <Media.Left>
                <a href={newsStory.link} target="_blank" rel="noopener noreferrer">
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
          <Media.ListItem key={this.state.news.length}>
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

export default HomeNewsView;
