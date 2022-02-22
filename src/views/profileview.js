import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom"
import PropTypes from 'prop-types';
import { Form, FormSelect, FormGroup, FormCheck, Button, Modal, ButtonToolbar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPowerOff, faTrashAlt, faPlus, faSave, faWindowClose } from '@fortawesome/free-solid-svg-icons'
import { FieldGroup } from '../utils/utils';
import '../App.css';

function ProfileView(props) {
  const [user, setUser] = useState(null);
  const [deleteOK, setDeleteOK] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!props.session) {
      return navigate("/")
    }

    const { dispatch } = props;
    dispatch({ type: 'REQUEST_PROFILE' });
    fetch(`/api/users/${props.session.userId}`, {
      method: 'GET',
      headers: new Headers({
        'x-auth': props.session.token,
        'Content-Type': 'application/json'
      }),
      cache: 'default'
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 200) {
          throw new Error(response.json.message);
        }
        for (var i = 0; i < response.json.newsFilters.length; i++) {
          response.json.newsFilters[i].keywordsStr = response.json.newsFilters[i].keyWords.join(',');
        }
        setUser(response.json);
        dispatch({ type: 'MSG_DISPLAY', msg: "Profile fetched" });
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Profile fetch failed: ${error.message}` });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUnRegister = (event) => {
    const { dispatch } = props
    event.preventDefault();
    fetch(`/api/users/${props.session.userId}`, {
      method: 'DELETE',
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
        props.appLogoutCB();
        dispatch({ type: 'MSG_DISPLAY', msg: "Account deleted" });
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Account delete failed: ${error.message}` });
      });
  }

  const handleNameChange = (event) => {
    setUser(prevUser => {
      let newNewFilters = [...prevUser.newsFilters];
      newNewFilters[selectedIdx].name = event.target.value;
      return { ...prevUser, newsFilters: newNewFilters };
    });
  }

  const handleKeywordsChange = (event) => {
    setUser(prevUser => {
      let newNewFilters = [...prevUser.newsFilters];
      newNewFilters[selectedIdx].keywordsStr = event.target.value;
      newNewFilters[selectedIdx].keyWords = event.target.value.split(',');
      return { ...prevUser, newsFilters: newNewFilters };
    });
  }

  const handleOpenModal = (event) => {
    setShowModal(true);
  }

  const handleCloseModal = (event) => {
    setShowModal(false);
  }

  const handleChangeFilter = (event) => {
    setSelectedIdx(parseInt(event.target.value, 10));
  }

  const handleAdd = (event) => {
    const { dispatch } = props
    event.preventDefault();
    if (user.newsFilters.length === 5) {
      dispatch({ type: 'MSG_DISPLAY', msg: "No more newsFilters allowed" });
    } else {
      var len = user.newsFilters.length;
      setUser(prevUser => {
        let newNewFilters = [...prevUser.newsFilters];
        newNewFilters.push({
          name: 'New Filter',
          keyWords: ["Keyword"],
          keywordsStr: "Keyword",
          enableAlert: false,
          alertFrequency: 0,
          enableAutoDelete: false,
          deleteTime: 0,
          timeOfLastScan: 0
        });
        return { ...prevUser, newsFilters: newNewFilters };
      });
      setSelectedIdx(len);
    }
  }

  const handleDelete = (event) => {
    event.preventDefault();
    setUser(prevUser => {
      let newNewFilters = [...prevUser.newsFilters];
      newNewFilters.splice(selectedIdx, 1);
      return { ...prevUser, newsFilters: newNewFilters };
    });
    setSelectedIdx(0);
  }

  const handleSave = (event) => {
    const { dispatch } = props
    event.preventDefault();
    fetch(`/api/users/${props.session.userId}`, {
      method: 'PUT',
      headers: new Headers({
        'x-auth': props.session.token,
        'Content-Type': 'application/json'
      }),
      cache: 'default',
      body: JSON.stringify(user)
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 200) {
          throw new Error(response.json.message);
        }
        dispatch({ type: 'MSG_DISPLAY', msg: "Profile saved" });
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Profile save failed: ${error.message}` });
      });
  }

  // *****************************************
  // Rendering of main view UI for the Profile
  // *****************************************
  if (!user) {
    return (<h1>Loading profile...</h1>);
  } else {
    return (
      <div>
        <h1>Profile: News Filters</h1>
        <Form>
          <FormGroup controlId="formControlsSelect">
            <FormSelect aria-label="News filter selection" onChange={handleChangeFilter} value={selectedIdx}>
              {user.newsFilters.map((filter, idx) =>
                <option key={idx} value={idx}>{filter.name}</option>
              )}
            </FormSelect>
          </FormGroup>
        </Form>
        <hr />
        <Form>
          <FieldGroup
            id="formControlsName"
            type="text"
            label="Name"
            placeholder="NewFilter"
            onChange={handleNameChange}
            value={user.newsFilters[selectedIdx].name}
          />
          <FieldGroup
            id="formControlsKeywords"
            type="text"
            label="Keywords"
            placeholder="Keywords"
            onChange={handleKeywordsChange}
            value={user.newsFilters[selectedIdx].keywordsStr}
          />
          <div className="btn-group btn-group-justified" role="group" aria-label="...">
            <ButtonToolbar>
              <Button disabled={user.newsFilters.length > 4} bsstyle="primary" bssize="sm" onClick={handleAdd}><FontAwesomeIcon icon={faPlus} /> Add</Button>
              <Button disabled={user.newsFilters.length < 2} bsstyle="primary" bssize="sm" onClick={handleDelete}><FontAwesomeIcon icon={faTrashAlt} /> Delete</Button>
              <Button bsstyle="primary" bssize="sm" onClick={handleSave}><FontAwesomeIcon icon={faSave} /> Save</Button>
            </ButtonToolbar>
          </div>
        </Form>
        <hr />
        <p>No longer have a need for NewsWatcher? <button id="deleteLink" style={{ cursor: 'pointer' }} onClick={handleOpenModal}>Delete your NewsWatcher Account</button></p>
        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>Un-Register</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleUnRegister}>
              <FormCheck type="checkbox"
                label="Check if you are sure you want to delete your NewsWatcher account"
                checked={deleteOK}
                onChange={(event) => setDeleteOK(event.target.checked)} />
              <Button disabled={!deleteOK} bsstyle="success" bssize="lg" block="true" type="submit">
                <FontAwesomeIcon icon={faPowerOff} /> Delete NewsWatcher Account
              </Button>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button bsstyle="danger" bssize="lg" onClick={handleCloseModal}><FontAwesomeIcon icon={faWindowClose} /> Cancel</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

ProfileView.propTypes = {
  session: PropTypes.object.isRequired,
  appLogoutCB: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired
};

export default ProfileView
