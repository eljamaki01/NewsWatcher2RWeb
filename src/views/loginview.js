import React, { useState } from 'react';
import { useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from 'react-redux'
import { Form, FormCheck, Button, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faUser, faPowerOff, faWindowClose } from '@fortawesome/free-solid-svg-icons'
import { FieldGroup } from '../utils/utils';
import '../App.css';

function LoginView() {
  const session = useSelector((state) => state.app.session);
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remeberMe, setRemeberMe] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleRegister = (event) => {
    event.preventDefault();
    return fetch('/api/users', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      cache: 'default', // no-store or no-cache ro default?
      body: JSON.stringify({
        displayName: name,
        email: email,
        password: password
      })
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 201) {
          throw new Error(response.json.message);
        }
        dispatch({ type: 'MSG_DISPLAY', msg: "Registered" });
        setShowModal(false);
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Registration failure: ${error.message}` });
      });
  }

  const handleLogin = (event) => {
    event.preventDefault();
    return fetch('/api/sessions', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      cache: 'default', // no-store or no-cache ro default?
      body: JSON.stringify({
        email: email,
        password: password
      })
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 201) {
          throw new Error(response.json.message);
        }
        // Set the token in client side storage if the user desires
        if (remeberMe) {
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
        navigate("/news")
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Sign in failed: ${error.message}` });
      });
  }

  const handleNameChange = (event) => {
    setName(event.target.value);
  }

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  }

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  }

  const handleCheckboxChange = (event) => {
    setRemeberMe(event.target.checked);
  }

  const handleOpenRegModal = (event) => {
    setShowModal(true);
  }

  const handleCloseRegModal = (event) => {
    setShowModal(false);
  }

  const _renderRegisterModal = () => {
    return (<Modal show={showModal} onHide={handleCloseRegModal}>
      <Modal.Header closeButton>
        <Modal.Title>Register</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleRegister}>
          <FieldGroup
            id="formControlsName"
            type="text"
            icon={faUser}
            label="Display Name"
            placeholder="Enter display name"
            onChange={handleNameChange}
          />
          <FieldGroup
            id="formControlsEmail"
            type="email"
            icon={faUser}
            label="Email Address"
            placeholder="Enter email"
            onChange={handleEmailChange}
          />
          <FieldGroup
            id="formControlsPassword"
            icon={faEye}
            label="Password"
            type="password"
            onChange={handlePasswordChange}
          />
          <Button bsstyle="success" bssize="lg" block="true" type="submit">
            <FontAwesomeIcon icon={faPowerOff} /> Register
          </Button>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button bsstyle="danger" bssize="lg" onClick={handleCloseRegModal}><FontAwesomeIcon icon={faWindowClose} /> Cancel</Button>
      </Modal.Footer>
    </Modal>)
  }

  // If already logged in, then don't go here and route to the news view as per code above
  if (session) {
    return (
      <h1 id="h1ExistID">Logged in...</h1>
    );
  } else {
    return (
      <div>
        <h1 data-testid="login_heading_id">Log in Page</h1>
        <Form onSubmit={handleLogin}>
          <FieldGroup
            id="formControlsEmail2"
            type="email"
            icon={faUser}
            label="Email Address"
            placeholder="Enter email"
            onChange={handleEmailChange}
          />
          <FieldGroup
            id="formControlsPassword2"
            icon={faEye}
            label="Password"
            type="password"
            onChange={handlePasswordChange}
          />
          <FormCheck type="checkbox" label="Keep me logged in" id="rememberMeChk" checked={remeberMe} onChange={handleCheckboxChange} />
          <Button id="btnLogin" bsstyle="success" bssize="lg" block="true" type="submit">
            Login
          </Button>
        </Form>
        <p>Not a NewsWatcher user? <button style={{ cursor: 'pointer' }} onClick={handleOpenRegModal}>Sign Up</button></p>
        {_renderRegisterModal()}
      </div>
    );
  }
}

export default LoginView
