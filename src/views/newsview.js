import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom"
import PropTypes from 'prop-types';
import { FormSelect, FormGroup, Card } from 'react-bootstrap';
import '../App.css';

function NewsView(props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [newsState, setNewsState] = useState({ isLoading: true, newsFilters: null });
  const navigate = useNavigate();

  useEffect(() => {
    if (!props.session) {
      return navigate("/")
    }

    const { dispatch } = props
    setNewsState({ isLoading: true, newsFilters: [] });
    fetch(`/api/users/${props.session.userId}`, {
      method: 'GET',
      headers: new Headers({
        'x-auth': props.session.token
      }),
      cache: 'default'
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 200) {
          throw new Error(response.json.message);
        }
        setNewsState({ isLoading: false, newsFilters: response.json.newsFilters });
        dispatch({ type: 'MSG_DISPLAY', msg: "News fetched" });
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `News fetch failed: ${error.message}` });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const handleChangeFilter = (event) => {
    setSelectedIdx(parseInt(event.target.value, 10));
  }

  const handleShareStory = (index, event) => {
    const { dispatch } = props
    event.preventDefault();
    fetch('/api/sharednews', {
      method: 'POST',
      headers: new Headers({
        'x-auth': props.session.token,
        'Content-Type': 'application/json'
      }),
      cache: 'default',
      body: JSON.stringify(newsState.newsFilters[selectedIdx].newsStories[index])
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

  if (newsState.isLoading) {
    return (
      <h1>Loading news...</h1>
    );
  } else {
    return (
      <div>
        <h1>News</h1 >
        <FormGroup controlId="formControlsSelect">
          <FormSelect aria-label="News filter selection" onChange={handleChangeFilter} value={selectedIdx}>
            {newsState.newsFilters.map((filter, idx) =>
              <option key={idx} value={idx}>{filter.name}</option>
            )}
          </FormSelect>
        </FormGroup>
        <hr />
        <Card bg="light" key={newsState.newsFilters[selectedIdx].newsStories.length}>
          <div className="row g-0">
            <div className="col-md-4">
              <a href="http://developer.nytimes.com" target="_blank" rel="noopener noreferrer">
                <img alt="" src="poweredby_nytimes_30b.png" />
              </a>
            </div>
            <div className="col-md-8">
              <Card.Body>
                <a href="http://developer.nytimes.com" target="_blank" rel="noopener noreferrer">
                  <h5 className="card-title"><b>Data provided by The New York Times</b></h5>
                </a>
              </Card.Body>
            </div>
          </div>
        </Card>
        <ul>
          {newsState.newsFilters[selectedIdx].newsStories.map((newsStory, idx) =>
            <Card bg="light" key={idx}>
              <div className="row g-0">
                <div className="col-md-4">
                  <a href={newsStory.link} target="_blank" rel="noopener noreferrer">
                    <img alt="" style={{ height: 150 }} src={newsStory.imageUrl} crossOrigin="true" />
                  </a>
                </div>
                <div className="col-md-8">
                  <Card.Body>
                    <h5 className="card-title"><b>{newsStory.title}</b></h5>
                    <p className="card-text">{newsStory.contentSnippet}</p>
                    <p className="card-text"><small className="text-muted">{newsStory.source} - <span>{newsStory.hoursString}</span></small></p>
                    <p className="card-text"><small className="text-muted"><button type="button" className="btn btn-link" onClick={(event) => handleShareStory(idx, event)}>Share</button></small></p>
                  </Card.Body>
                </div>
              </div>
            </Card>
          )}
        </ul>
      </div>
    );
  }
}

NewsView.propTypes = {
  session: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

export default NewsView
