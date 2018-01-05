import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormGroup, ControlLabel, Button, Modal, Glyphicon, Media } from 'react-bootstrap';
import { connect } from 'react-redux'
import { FieldGroup, toHours } from '../utils/utils';
import '../App.css';

class SharedNewsView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      comment: "",
      selectedStoryIdx: 0
    };
  }

  componentDidMount() {
    if (!this.props.session) {
      return window.location.hash = "";
    }

    const { dispatch } = this.props
    dispatch({ type: 'REQUEST_SHAREDNEWS' });
    fetch('/api/sharednews', {
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
        for (var i = 0; i < response.json.length; i++) {
          response.json[i].story.hours = toHours(response.json[i].story.date);
        }
        dispatch({ type: 'RECEIVE_SHAREDNEWS_SUCCESS', news: response.json });
        dispatch({ type: 'MSG_DISPLAY', msg: "Shared News fetched" });
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Shared News fetch failed: ${error.message}` });
      });
  }

  handleOpenModal = (index, event) => {
    this.setState({ selectedStoryIdx: index, showModal: true });
  }

  handleCloseModal = (event) => {
    this.setState({ showModal: false });
  }

  handleAddComment = (event) => {
    const { dispatch } = this.props
    event.preventDefault();
    fetch(`/api/sharednews/${this.props.news[this.state.selectedStoryIdx].story.storyID}/Comments`, {
      method: 'POST',
      headers: new Headers({
        'x-auth': this.props.session.token
      }),
      cache: 'default', // no-store or no-cache ro default?
      body: JSON.stringify({ comment: this.state.comment })
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 201) {
          throw new Error(response.json.message);
        }
        var storyIdx = this.state.selectedStoryIdx;
        dispatch({ type: 'ADD_COMMENT_SUCCESS', comment: this.state.comment, displayName: this.props.session.displayName, storyIdx: storyIdx });
        this.setState({ showModal: false, comment: "" });
        dispatch({ type: 'MSG_DISPLAY', msg: "Comment added" });
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Comment add failed: ${error.message}` });
      });
  }

  handleCommentChange = (event) => {
    this.setState({ comment: event.target.value });
  }

  render() {
    if (this.props.isLoading) {
      return (
        <h1>Loading shared news...</h1>
      );
    }
    return (
      <div>
        <h1>Shared News</h1 >
        <Media.List>
          {this.props.news.map((sharedStory, idx) =>
            <Media.ListItem key={idx}>
              <Media.Left>
                <a href={sharedStory.story.link} target="_blank">
                  <img alt="" className="media-object" src={sharedStory.story.imageUrl} />
                </a>
              </Media.Left>
              <Media.Body>
                <Media.Heading><b>{sharedStory.story.title}</b></Media.Heading>
                <p>{sharedStory.story.contentSnippet}</p>
                {sharedStory.story.source} - <span>{sharedStory.story.hours}</span>
                <a style={{ cursor: 'pointer' }} onClick={(event) => this.handleOpenModal(idx, event)}> Comments</a>
              </Media.Body>
            </Media.ListItem>
          )}
          <Media.ListItem key={this.props.news.length}>
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
        {this.props.news.length > 0 &&
          <Modal show={this.state.showModal} onHide={this.handleCloseModal}>
            <Modal.Header closeButton>
              <Modal.Title>Add Comment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form onSubmit={this.handleAddComment}>
                <FormGroup controlId="commentList">
                  <ControlLabel><Glyphicon glyph="user" /> Comments</ControlLabel>
                  <ul style={{ height: '10em', overflow: 'auto', 'overflow-x': 'hidden' }}>
                    {this.props.news[this.state.selectedStoryIdx].comments.map(comment =>
                      <li>
                        <div>
                          <p>'{comment.comment}' - {comment.displayName} </p>
                        </div>
                      </li>
                    )}
                  </ul>
                </FormGroup>
                {this.props.news[this.state.selectedStoryIdx].comments.length < 30 &&
                  <div>
                    <FieldGroup
                      id="formControlsComment"
                      type="text"
                      glyph="user"
                      label="Comment"
                      placeholder="Enter your comment"
                      onChange={this.handleCommentChange}
                    />
                    <Button disabled={this.state.comment.length === 0} bsStyle="success" bsSize="lg" block type="submit">
                      <Glyphicon glyph="off" /> Add
                    </Button>
                  </div>
                }
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button bsStyle="danger" bsSize="default" onClick={this.handleCloseModal}><Glyphicon glyph="remove" /> Close</Button>
            </Modal.Footer>
          </Modal>
        }
      </div>
    );
  }
}

SharedNewsView.propTypes = {
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    session: state.app.session,
    news: state.sharednews.news,
    isLoading: state.sharednews.isLoading
  }
}

export default connect(mapStateToProps)(SharedNewsView)

