import React, { Component } from 'react';
import PropTypes from 'prop-types';
//Get rid of ones on next line that don't need!
import { FormGroup, ControlLabel, FormControl, HelpBlock, Checkbox, Button, Modal, Glyphicon, ButtonToolbar } from 'react-bootstrap';
// import _ from 'lodash';
import update from 'immutability-helper';
import superagent from 'superagent';
import noCache from 'superagent-no-cache';
import '../App.css';

function FieldGroup({ id, label, help, ...props }) {
  return (
    <FormGroup controlId={id}>
      <ControlLabel>{label}</ControlLabel>
      <FormControl {...props} />
      {help && <HelpBlock>{help}</HelpBlock>}
    </FormGroup>
  );
}

class ProfileView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      deleteOK: false,
      selectedIdx: 0,
      user: null
    };
  }

  componentDidMount() {
    if (!this.props.session) {
      return window.location.hash = "";
    }

    superagent.get(`/api/users/${this.props.session.userId}`)
      .set('Cache-Control', 'no-cache')
      .set('Pragma', 'no-cache')
      .set('If-Modified-Since', '0')
      .set('x-auth', this.props.session.token)
      .use(noCache)
      .end((err, res) => {
        if (err || !res.ok || res.status !== 200) {
          this.props.parentMsgCB({ type: "MSG_FAIL", msg: `Profile fetch failed: ${res.body.message}` });
        } else {
          for (var i = 0; i < res.body.newsFilters.length; i++) {
            res.body.newsFilters[i].keywordsStr = res.body.newsFilters[i].keyWords.join(',');
          }
          this.setState({ user: res.body, isLoading: false });
          this.props.parentMsgCB({ type: "MSG_OK", msg: "Profile fetched" });
        }
      });
  }

  handleUnRegister = (event) => {
    event.preventDefault();
    superagent.delete(`/api/users/${this.props.session.userId}`)
      .send(this.state.user)
      .set('Content-Type', 'application/json')
      .set('x-auth', this.props.session.token)
      .end((err, res) => {
        if (err || !res.ok || res.status !== 200) {
          this.props.parentMsgCB({ type: "MSG_FAIL", msg: `Account delete failed: ${res.body.message}` });
        } else {
          this.props.parentMsgCB({ type: "MSG_ACCT_DELETE_OK", msg: "Account deleted" });
        }
      });
  }

  handleNameChange = (event) => {
    var filterIdx = this.state.selectedIdx;
    this.setState({
      user: update(this.state.user, {
        newsFilters: {
          [filterIdx]: { name: { $set: event.target.value } }
        }
      })
    })
  }

  handleKeywordsChange = (event) => {
    var filterIdx = this.state.selectedIdx;
    this.setState({
      user: update(this.state.user, {
        newsFilters: {
          [filterIdx]: { keywordsStr: { $set: event.target.value }, keyWords: { $set: event.target.value.split(',') } }
        }
      })
    })
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
    event.preventDefault();
    if (this.state.user.newsFilters.length === 5) {
      this.props.parentMsgCB({ type: "MSG_OK", msg: "No more newsFilters allowed" });
    } else {
      var len = this.state.user.newsFilters.length;
      this.setState({
        user: update(this.state.user, {
          newsFilters: {
            $push: [{
              name: 'New Filter',
              keyWords: ["Keyword"],
              keywordsStr: "Keyword",
              enableAlert: false,
              alertFrequency: 0,
              enableAutoDelete: false,
              deleteTime: 0,
              timeOfLastScan: 0
            }]
          }
        })
      })
      this.setState({ selectedIdx: len });
    }
  }

  handleDelete = (event) => {
    event.preventDefault();
    this.setState({
      user: update(this.state.user, {
        newsFilters: {
          $splice: [[this.state.selectedIdx, 1]]
        }
      })
    })
    this.setState({ selectedIdx: 0 });
  }

  handleSave = (event) => {
    event.preventDefault();
    superagent.put(`/api/users/${this.props.session.userId}`)
      .send(this.state.user)
      .set('Content-Type', 'application/json')
      .set('x-auth', this.props.session.token)
      .use(noCache)
      .end((err, res) => {
        if (err || !res.ok || res.status !== 200) {
          this.props.parentMsgCB({ type: "MSG_FAIL", msg: `Profile save failed: ${res.body.message}` });
        } else {
          this.props.parentMsgCB({ type: "MSG_OK", msg: "Profile saved" });
        }
      });
  }

  handleCheckboxChange = (event) => {
    this.setState({ deleteOK: event.target.checked });
  }

  render() {
    if (this.state.isLoading) {
      return (
        <h1>Loading...</h1>
      );
    }
    return (
      <div>
        <h1>Profile: News Filters</h1>
        <FormGroup controlId="formControlsSelect">
          <FormControl bsSize="lg" componentClass="select" placeholder="select" onChange={this.handleChangeFilter} value={this.state.selectedIdx}>
            {this.state.user.newsFilters.map((filter, idx) =>
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
            value={this.state.user.newsFilters[this.state.selectedIdx].name}
          />
          <FieldGroup
            id="formControlsKeywords"
            type="text"
            label="Keywords"
            placeholder="Keywords"
            onChange={this.handleKeywordsChange}
            value={this.state.user.newsFilters[this.state.selectedIdx].keywordsStr}
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
  session: PropTypes.func.isRequired,
  parentMsgCB: PropTypes.func.isRequired
};

export default ProfileView;
