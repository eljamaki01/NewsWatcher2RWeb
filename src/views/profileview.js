import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormGroup, FormControl, Checkbox, Button, Modal, Glyphicon, ButtonToolbar } from 'react-bootstrap';
import { connect } from 'react-redux'
import superagent from 'superagent';
import noCache from 'superagent-no-cache';
import { FieldGroup } from '../utils/utils';
import '../App.css';

class ProfileView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      deleteOK: false,
      selectedIdx: 0,
    };
  }

  componentDidMount() {
    if (!this.props.session) {
      return window.location.hash = "";
    }

    const { dispatch } = this.props
    superagent.get(`/api/users/${this.props.session.userId}`)
      .set('Cache-Control', 'no-cache')
      .set('Pragma', 'no-cache')
      .set('If-Modified-Since', '0')
      .set('x-auth', this.props.session.token)
      .use(noCache)
      .end((err, res) => {
        if (err || !res.ok || res.status !== 200) {
          dispatch({ type: 'MSG_DISPLAY', msg: `Profile fetch failed: ${res.body.message}` });
        } else {
          for (var i = 0; i < res.body.newsFilters.length; i++) {
            res.body.newsFilters[i].keywordsStr = res.body.newsFilters[i].keyWords.join(',');
          }
          dispatch({ type: 'RECEIVE_PROFILE_SUCCESS', user: res.body });
          dispatch({ type: 'MSG_DISPLAY', msg: "Profile fetched" });
        }
      });
  }

  handleUnRegister = (event) => {
    const { dispatch } = this.props
    event.preventDefault();
    superagent.delete(`/api/users/${this.props.session.userId}`)
      .send(this.props.user)
      .set('Content-Type', 'application/json')
      .set('x-auth', this.props.session.token)
      .end((err, res) => {
        if (err || !res.ok || res.status !== 200) {
          dispatch({ type: 'MSG_DISPLAY', msg: `Account delete failed: ${res.body.message}` });
        } else {
          this.props.appLogoutCB();
          dispatch({ type: 'MSG_DISPLAY', msg: "Account deleted" });
        }
      });
  }

  handleNameChange = (event) => {
    this.props.dispatch({ type: 'ALTER_FILTER_NAME', filterIdx: this.state.selectedIdx, value: event.target.value });
  }

  handleKeywordsChange = (event) => {
    this.props.dispatch({ type: 'ALTER_FILTER_KEYWORDS', filterIdx: this.state.selectedIdx, value: event.target.value });
  }

  handleOpenModal = (event) => {
    this.setState({ showModal: true });
  }

  handleCloseModal = (event) => {
    this.setState({ showModal: false });
  }

  handleChangeFilter = (event) => {
    this.setState({ selectedIdx: parseInt(event.target.value, 10) });
  }

  handleAdd = (event) => {
    const { dispatch } = this.props
    event.preventDefault();
    if (this.props.user.newsFilters.length === 5) {
      dispatch({ type: 'MSG_DISPLAY', msg: "No more newsFilters allowed" });
    } else {
      var len = this.props.user.newsFilters.length;
      dispatch({ type: 'ADD_FILTER' });
      this.setState({ selectedIdx: len });
    }
  }

  handleDelete = (event) => {
    event.preventDefault();
    this.props.dispatch({ type: 'DELETE_FILTER', selectedIdx: this.state.selectedIdx });
    this.setState({ selectedIdx: 0 });
  }

  handleSave = (event) => {
    const { dispatch } = this.props
    event.preventDefault();
    superagent.put(`/api/users/${this.props.session.userId}`)
      .send(this.props.user)
      .set('Content-Type', 'application/json')
      .set('x-auth', this.props.session.token)
      .use(noCache)
      .end((err, res) => {
        if (err || !res.ok || res.status !== 200) {
          dispatch({ type: 'MSG_DISPLAY', msg: `Profile save failed: ${res.body.message}` });
        } else {
          dispatch({ type: 'MSG_DISPLAY', msg: "Profile saved" });
        }
      });
  }

  handleCheckboxChange = (event) => {
    this.setState({ deleteOK: event.target.checked });
  }

  render() {
    if (this.props.isLoading) {
      return (
        <h1>Loading...</h1>
      );
    }
    return (
      <div>
        <h1>Profile: News Filters</h1>
        <FormGroup controlId="formControlsSelect">
          <FormControl bsSize="lg" componentClass="select" placeholder="select" onChange={this.handleChangeFilter} value={this.state.selectedIdx}>
            {this.props.user.newsFilters.map((filter, idx) =>
              <option value={idx}><strong>{filter.name}</strong></option>
            )}
          </FormControl>
        </FormGroup>
        <hr />
        <form>
          <FieldGroup
            id="formControlsName"
            type="text"
            label="Name"
            placeholder="NewFilter"
            onChange={this.handleNameChange}
            value={this.props.user.newsFilters[this.state.selectedIdx].name}
          />
          <FieldGroup
            id="formControlsKeywords"
            type="text"
            label="Keywords"
            placeholder="Keywords"
            onChange={this.handleKeywordsChange}
            value={this.props.user.newsFilters[this.state.selectedIdx].keywordsStr}
          />
          <div class="btn-group btn-group-justified" role="group" aria-label="...">
            <ButtonToolbar>
              <Button bsStyle="primary" bsSize="default" onClick={this.handleAdd}><Glyphicon glyph="plus" /> Add</Button>
              <Button bsStyle="primary" bsSize="default" onClick={this.handleDelete}><Glyphicon glyph="trash" /> Delete</Button>
              <Button bsStyle="primary" bsSize="default" onClick={this.handleSave}><Glyphicon glyph="save" /> Save</Button>
            </ButtonToolbar>
          </div>
        </form>
        <hr />
        <p>No longer have a need for NewsWatcher? <a id="deleteLink" style={{ cursor: 'pointer' }} onClick={this.handleOpenModal}>Delete your NewsWatcher Account</a></p>
        <Modal show={this.state.showModal} onHide={this.handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Un-Register</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form onSubmit={this.handleUnRegister}>
              <Checkbox checked={this.state.deleteOK} onChange={this.handleCheckboxChange}>
                Check if you are sure you want to delete your NewsWatcher account
              </Checkbox>
              <Button disabled={!this.state.deleteOK} bsStyle="success" bsSize="lg" block type="submit">
                <Glyphicon glyph="off" /> Delete NewsWatcher Account
              </Button>
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button bsStyle="danger" bsSize="default" onClick={this.handleCloseModal}><Glyphicon glyph="remove" /> Cancel</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

ProfileView.propTypes = {
  appLogoutCB: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    session: state.app.session,
    user: state.profile.user,
    isLoading: state.profile.isLoading
  }
}

export default connect(mapStateToProps)(ProfileView)
