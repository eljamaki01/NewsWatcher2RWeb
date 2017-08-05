import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Button, Modal, Glyphicon } from 'react-bootstrap';
import { connect } from 'react-redux'
import superagent from 'superagent';
import noCache from 'superagent-no-cache';
import { FieldGroup } from '../utils/utils';
import '../App.css';

class LoginView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: "",
      email: "",
      password: "",
      remeberMe: false,
      showModal: false
    };
  }

  componentDidMount() {
    if (this.props.session) {
      return window.location.hash = "#news";
    }

    window.location.hash = "";
  }

  handleRegister = (event) => {
    const { dispatch } = this.props
    event.preventDefault();
    superagent.post("/api/users")
      .send({
        displayName: this.state.name,
        email: this.state.email,
        password: this.state.password
      })
      .set('Content-Type', 'application/json')
      .use(noCache)
      .end((err, res) => {
        if (err || !res.ok || res.status !== 201) {
          dispatch({ type: 'MSG_DISPLAY', msg: `Registration failure: ${res.body.message}` });
        } else {
          dispatch({ type: 'MSG_DISPLAY', msg: "Registered" });
          this.setState({ showModal: false });
        }
      });
  }

  handleLogin = (event) => {
    const { dispatch } = this.props
    event.preventDefault();
    superagent.post("/api/sessions")
      .send({
        email: this.state.email,
        password: this.state.password
      })
      .set('Content-Type', 'application/json')
      .use(noCache)
      .end((err, res) => {
        if (err || !res.ok || res.status !== 201) {
          // this.props.parentMsgCB({ type: "MSG_LOGIN_FAIL", msg: `Sign in failed: ${res.body.message}` });
          dispatch({ type: 'MSG_DISPLAY', msg: `Sign in failed: ${res.body.message}` });
        } else {
          // Set the token in client side storage if the user desires
          if (this.state.remeberMe) {
            var xfer = {
              token: res.body.token,
              displayName: res.body.displayName,
              userId: res.body.userId
            };
            window.localStorage.setItem("userToken", JSON.stringify(xfer));
          } else {
            window.localStorage.removeItem("userToken");
          }
          // this.props.parentMsgCB({ type: "MSG_LOGIN_OK", msg: `Signed in as ${res.body.displayName}`, data: res.body });
          dispatch({ type: 'RECEIVE_TOKEN_SUCCESS', msg: `Signed in as ${res.body.displayName}`, session: res.body });
          // dispatch({ type: 'MSG_DISPLAY', msg: `Signed in as ${res.body.displayName}` });
          window.location.hash = "#news";
        }
      });
  }

  handleNameChange = (event) => {
    this.setState({ name: event.target.value });
  }

  handleEmailChange = (event) => {
    this.setState({ email: event.target.value });
  }

  handlePasswordChange = (event) => {
    this.setState({ password: event.target.value });
  }

  handleCheckboxChange = (event) => {
    this.setState({ remeberMe: event.target.checked });
  }

  handleOpenRegModal = (event) => {
    this.setState({ showModal: true });
  }

  handleCloseRegModal = (event) => {
    this.setState({ showModal: false });
  }

  render() {
    // If already logged in, then don't go here and get routed to the news view
    if (this.props.session) {
      return null;
    }
    return (
      <div>
        <form onSubmit={this.handleLogin}>
          <FieldGroup
            id="formControlsEmail"
            type="email"
            glyph="user"
            label="Email Address"
            placeholder="Enter email"
            onChange={this.handleEmailChange}
          />
          <FieldGroup
            id="formControlsPassword"
            glyph="eye-open"
            label="Password"
            type="password"
            onChange={this.handlePasswordChange}
          />
          <Checkbox checked={this.state.remeberMe} onChange={this.handleCheckboxChange}>
            Keep me logged in
          </Checkbox>
          <Button bsStyle="success" bsSize="lg" block type="submit">
            Login
          </Button>
        </form>
        <p>Not a NewsWatcher user? <a style={{ cursor: 'pointer' }} onClick={this.handleOpenRegModal}>Sign Up</a></p>
        <Modal show={this.state.showModal} onHide={this.handleCloseRegModal}>
          <Modal.Header closeButton>
            <Modal.Title>Register</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form onSubmit={this.handleRegister}>
              <FieldGroup
                id="formControlsName"
                type="text"
                glyph="user"
                label="Display Name"
                placeholder="Enter display name"
                onChange={this.handleNameChange}
              />
              <FieldGroup
                id="formControlsEmail"
                type="email"
                glyph="user"
                label="Email Address"
                placeholder="Enter email"
                onChange={this.handleEmailChange}
              />
              <FieldGroup
                id="formControlsPassword"
                glyph="eye-open"
                label="Password"
                type="password"
                onChange={this.handlePasswordChange}
              />
              <Button bsStyle="success" bsSize="lg" block type="submit">
                <Glyphicon glyph="off" /> Register
              </Button>
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button bsStyle="danger" bsSize="default" onClick={this.handleCloseRegModal}><Glyphicon glyph="remove" /> Cancel</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

LoginView.propTypes = {
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    session: state.app.session
  }
}

export default connect(mapStateToProps)(LoginView)
