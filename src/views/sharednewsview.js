import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom"
import PropTypes from 'prop-types';
import { Form, FormGroup, FormLabel, Button, Modal, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPowerOff, faWindowClose, faUser } from '@fortawesome/free-solid-svg-icons'
import { FieldGroup } from '../utils/utils';
import '../App.css';


function SharedNewsView(props) {
  const [comment, setComment] = useState("");
  const [selectedStoryIdx, setSelectedStoryIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [newsState, setNewsState] = useState({ isLoading: true, news: null });
  const navigate = useNavigate();

  useEffect(() => {
    if (!props.session) {
      return navigate("/")
    }

    const { dispatch } = props
    setNewsState({ isLoading: true, news: [] });
    fetch('/api/sharednews', {
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
        setNewsState({ isLoading: false, news: response.json });
        dispatch({ type: 'MSG_DISPLAY', msg: "Shared News fetched" });
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Shared News fetch failed: ${error.message}` });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenModal = (index, event) => {
    setSelectedStoryIdx(index);
    setShowModal(true);
  }

  const handleCloseModal = (event) => {
    setShowModal(false);
  }

  const handleAddComment = (event) => {
    const { dispatch } = props
    event.preventDefault();
    fetch(`/api/sharednews/${newsState.news[selectedStoryIdx].story.storyID}/Comments`, {
      method: 'POST',
      headers: new Headers({
        'x-auth': props.session.token,
        'Content-Type': 'application/json'
      }),
      cache: 'default',
      body: JSON.stringify({ comment: comment })
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 201) {
          throw new Error(response.json.message);
        }
        let newNewsArray = [...newsState.news];
        newNewsArray[selectedStoryIdx].comments.push({ displayName: props.session.displayName, comment: comment });
        setNewsState({ isLoading: newsState.isLoading, news: newNewsArray });
        setComment("");
        setShowModal(false);
        dispatch({ type: 'MSG_DISPLAY', msg: "Comment added" });
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Comment add failed: ${error.message}` });
      });
  }

  const handleCommentChange = (event) => {
    setComment(event.target.value);
  }

  if (newsState.isLoading) {
    return (
      <h1>Loading shared news...</h1>
    );
  } else {
    return (
      <div>
        <h1>Shared News</h1 >
        <Card bg="light" key={newsState.news.length}>
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
          {newsState.news.map((sharedStory, idx) =>
            <Card bg="light" key={idx}>
              <div className="row g-0">
                <div className="col-md-4">
                  <a href={sharedStory.story.link} target="_blank" rel="noopener noreferrer">
                    <img alt="" style={{ height: 150 }} src={sharedStory.story.imageUrl} crossOrigin="true" />
                  </a>
                </div>
                <div className="col-md-8">
                  <Card.Body>
                    <h5 className="card-title"><b>{sharedStory.story.title}</b></h5>
                    <p className="card-text">{sharedStory.story.contentSnippet}</p>
                    <p className="card-text"><small className="text-muted">{sharedStory.story.source} - <span>{sharedStory.story.hoursString}</span></small></p>
                    <p className="card-text"><small className="text-muted"><button type="button" className="btn btn-link" onClick={(event) => handleOpenModal(idx, event)}>Comments</button></small></p>
                  </Card.Body>
                </div>
              </div>
            </Card>
          )}
        </ul>
        {newsState.news.length > 0 &&
          <Modal show={showModal} onHide={handleCloseModal}>
            <Modal.Header closeButton>
              <Modal.Title>Add Comment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleAddComment}>
                <FormGroup controlId="commentList">
                  <FormLabel><FontAwesomeIcon icon={faUser} /> Comments</FormLabel>
                  <ul style={{ height: '10em', overflow: 'auto', 'overflow-x': 'hidden' }}>
                    {newsState.news[selectedStoryIdx].comments.map(comment =>
                      <li>
                        <div>
                          <p>'{comment.comment}' - {comment.displayName} </p>
                        </div>
                      </li>
                    )}
                  </ul>
                </FormGroup>
                {newsState.news[selectedStoryIdx].comments.length < 30 &&
                  <div>
                    <FieldGroup
                      id="formControlsComment"
                      type="text"
                      icon={faUser}
                      label="Comment"
                      placeholder="Enter your comment"
                      onChange={handleCommentChange}
                    />
                    <Button disabled={comment.length === 0} bsstyle="success" bssize="lg" block="true" type="submit">
                      <FontAwesomeIcon icon={faPowerOff} /> Add
                    </Button>
                  </div>
                }
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button bsstyle="danger" bssize="lg" onClick={handleCloseModal}><FontAwesomeIcon icon={faWindowClose} /> Close</Button>
            </Modal.Footer>
          </Modal>
        }
      </div>
    );
  }
}

SharedNewsView.propTypes = {
  session: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

export default SharedNewsView
