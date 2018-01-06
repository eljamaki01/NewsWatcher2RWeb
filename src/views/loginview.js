import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Button, Modal, Glyphicon } from 'react-bootstrap';
import { connect } from 'react-redux'
import { FieldGroup } from '../utils/utils';
import '../App.css';

export class LoginView extends Component {
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

  handleRegister = (event) => {
    const { dispatch } = this.props
    event.preventDefault();
    return fetch('/api/users', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      cache: 'default', // no-store or no-cache ro default?
      body: JSON.stringify({
        displayName: this.state.name,
        email: this.state.email,
        password: this.state.password
      })
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 201) {
          throw new Error(response.json.message);
        }
        dispatch({ type: 'MSG_DISPLAY', msg: "Registered" });
        this.setState({ showModal: false });
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Registration failure: ${error.message}` });
      });
  }

  handleLogin = (event) => {
    const { dispatch } = this.props
    event.preventDefault();
    return fetch('/api/sessions', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      cache: 'default', // no-store or no-cache ro default?
      body: JSON.stringify({
        email: this.state.email,
        password: this.state.password
      })
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 201) {
          throw new Error(response.json.message);
        }
        // Set the token in client side storage if the user desires
        if (this.state.remeberMe) {
          var xfer = {
            token: response.json.token,
            displayName: response.json.displayName,
            userId: response.json.userId
          };
          window.localStorage.setItem("userToken", JSON.stringify(xfer));
        } else {
          window.localStorage.removeItem("userToken");
        }
        dispatch({ type: 'RECEIVE_TOKEN_SUCCESS', msg: `Signed in as ${response.json.displayName}`, session: response.json });
        window.location.hash = "#news";
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Sign in failed: ${error.message}` });
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

  _renderRegisterModal = () => {
    return (<Modal show={this.state.showModal} onHide={this.handleCloseRegModal}>
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
        <Button bsStyle="danger" bsSize="lg" onClick={this.handleCloseRegModal}><Glyphicon glyph="remove" /> Cancel</Button>
      </Modal.Footer>
    </Modal>)
  }

  render() {
    // If already logged in, then don't go here and get routed to the news view
    if (this.props.session) {
      // return null;
      return (
        <h1 id="h1ExistID">Logged in...</h1>
      );
    }
    return (
      <div>
        <form onSubmit={this.handleLogin}>
          <FieldGroup
            id="formControlsEmail2"
            type="email"
            glyph="user"
            label="Email Address"
            placeholder="Enter email"
            onChange={this.handleEmailChange}
          />
          <FieldGroup
            id="formControlsPassword2"
            glyph="eye-open"
            label="Password"
            type="password"
            onChange={this.handlePasswordChange}
          />
          <Checkbox id="rememberMeChk" checked={this.state.remeberMe} onChange={this.handleCheckboxChange}>
            Keep me logged in
          </Checkbox>
          <Button id="btnLogin" bsStyle="success" bsSize="lg" block type="submit">
            Login
          </Button>
        </form>
        <p>Not a NewsWatcher user? <a style={{ cursor: 'pointer' }} onClick={this.handleOpenRegModal}>Sign Up</a></p>
        {this._renderRegisterModal()}
      </div>
    );
  }
}

LoginView.propTypes = {
  dispatch: PropTypes.func.isRequired,
  session: PropTypes.object
};

const mapStateToProps = state => {
  return {
    session: state.app.session
  }
}

export default connect(mapStateToProps)(LoginView)
