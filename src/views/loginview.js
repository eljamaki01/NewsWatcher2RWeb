import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormGroup, ControlLabel, FormControl, HelpBlock, Checkbox, Button, Modal, Glyphicon } from 'react-bootstrap';
import superagent from 'superagent';
import noCache from 'superagent-no-cache';
import '../App.css';

function FieldGroup({ id, glyph, label, help, ...props }) {
  return (
    <FormGroup controlId={id}>
      <ControlLabel><Glyphicon glyph={glyph} /> {label}</ControlLabel>
      <FormControl {...props} />
      {help && <HelpBlock>{help}</HelpBlock>}
    </FormGroup>
  );
}

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
      //this.props.history.push("/#/news");
      // OR try this below
      window.location.replace(window.location.pathname + '#/news');
    }
  }

  handleRegister = (event) => {
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
        if (err || !res.ok || res.status != 201) {
          this.props.parentMsgCB({ type: "MSG_REGISTRATION_FAIL", msg: `Registration failure: ${res.body.message}` });
        } else {
          this.props.parentMsgCB({ type: "MSG_REGISTRATION_OK", msg: "Registered" });
          this.setState({ showModal: false });
        }
      });
  }

  handleLogin = (event) => {
    event.preventDefault();
    superagent.post("/api/sessions")
      .send({
        email: this.state.email,
        password: this.state.password
      })
      .set('Content-Type', 'application/json')
      .use(noCache)
      .end((err, res) => {
        if (err || !res.ok || res.status != 201) {
          this.props.parentMsgCB({ type: "MSG_LOGIN_FAIL", msg: `Sign in failed: ${res.body.message}` });
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
          this.props.parentMsgCB({ type: "MSG_LOGIN_OK", msg: `Signed in as ${res.body.displayName}`, data: res.body });
          // window.location.replace(window.location.pathname + '#/news');
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
          <Checkbox checked onChange={this.handleCheckboxChange}>
            Keep me logged in
          </Checkbox>
          <Button bsStyle="success" bsSize="lg" block type="submit">
            Login
          </Button>
        </form>
        <p>Not a NewsWatcher user? <a id="registerLink" href="javascript:void(0)" onClick={this.handleOpenRegModal}>Sign Up</a></p>
        <Modal show={this.state.showModal} onHide={this.handleCloseRegModal}>
          <Modal.Header closeButton>
            <Modal.Title>Register</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form onSubmit={this.handleRegister}>
              <FieldGroup
                id="formControlsEmail"
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
  session: PropTypes.func.isRequired,
  parentMsgCB: PropTypes.func.isRequired
};

export default LoginView;
