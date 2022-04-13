import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { Card } from 'react-bootstrap';
import '../App.css';

function HomeNewsView(props) {
  let reduxState = useSelector((state) => state.homenews);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!reduxState.isSSR) {
      dispatch({ type: 'REQUEST_HOMENEWS' });
      fetch('/api/homenews', {
        method: 'GET',
        cache: 'default'
      })
        .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
        .then(response => {
          if (!response.ok || response.status !== 200) {
            throw new Error(response.json.message);
          }
          dispatch({ type: 'RECEIVE_HOMENEWS_SUCCESS', news: response.json });
          props.dispatch({ type: 'MSG_DISPLAY', msg: "Home Page news fetched" });
        })
        .catch(error => {
          props.dispatch({ type: 'MSG_DISPLAY', msg: `Home News fetch failed: ${error.message}` });
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (reduxState.isLoading) {
    return (<h1 data-testid="loading_id">Loading home page news...</h1>);
  } else {
    return (
      <div>
        <h1 data-testid="homepage_heading_id">Home Page News</h1>
        <Card bg="light" key={reduxState.news.length}>
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
          {reduxState.news.map((newsStory, idx) =>
            <Card bg="light" key={idx}>
              <div className="row g-0">
                <div className="col-md-4">
                  <a href={newsStory.link} target="_blank" rel="noopener noreferrer">
                    <img alt="" style={{ height: 150 }} src={newsStory.imageUrl} crossOrigin="true" />
                  </a>
                </div>
                <div className="col-md-8">
                  <Card.Body>
                    <h5 className="card-title"><b data-testid="story-name_id">{newsStory.title}</b></h5>
                    <p className="card-text">{newsStory.contentSnippet}</p>
                    <p className="card-text"><small className="text-muted">{newsStory.source} - <span>{newsStory.hoursString}</span></small></p>
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

export default HomeNewsView;
