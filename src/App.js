import React, { useEffect } from 'react';
import './App.css';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar, Nav } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux'
import LoginView from './views/loginview';
import NewsView from './views/newsview';
import HomeNewsView from './views/homenewsview';
import SharedNewsView from './views/sharednewsview';
import ProfileView from './views/profileview';
import NotFound from './views/notfound';

function App(props) {
  let loggedIn = useSelector((state) => state.app.loggedIn);
  let session = useSelector((state) => state.app.session);
  let currentMsg = useSelector((state) => state.app.currentMsg);
  const dispatch = useDispatch();

  useEffect(() => {
    // Check for token in HTML5 client side local storage
    const storedToken = window.localStorage.getItem("userToken");
    if (storedToken) {
      const tokenObject = JSON.parse(storedToken);
      dispatch({ type: 'RECEIVE_TOKEN_SUCCESS', msg: `Signed in as ${tokenObject.displayName}`, session: tokenObject });
    } else {
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = (event) => {
    event && event.preventDefault();
    fetch(`/api/sessions/${session.userId}`, {
      method: 'DELETE',
      headers: new Headers({
        'x-auth': session.token
      }),
      cache: 'default' // no-store or no-cache?
    })
      .then(r => r.json().then(json => ({ ok: r.ok, status: r.status, json })))
      .then(response => {
        if (!response.ok || response.status !== 200) {
          throw new Error(response.json.message);
        }
        dispatch({ type: 'DELETE_TOKEN_SUCCESS', msg: "Signed out" });
        window.localStorage.removeItem("userToken");
        window.localStorage.clear();
        window.location.hash = "";
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Sign out failed: ${error.message}` });
      });
  }

  return (
    <div>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand href="/#">
          NewsWatcher {currentMsg && <span><small id="currentMsgId">({currentMsg})</small></span>}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ml-auto" >
            {
              <Nav.Link>
                <NavLink exact="true" to="/" style={({ isActive }) => ({ color: isActive ? 'green' : 'blue' })} >Home Page News</NavLink>
                <span className="d-lg-none"> &sdot; </span>
              </Nav.Link>
            }
            {loggedIn &&
              <Nav.Link>
                <NavLink exact="true" to="/news" style={({ isActive }) => ({ color: isActive ? 'green' : 'blue' })} >My News</NavLink>
                <span className="d-lg-none"> &sdot; </span>
              </Nav.Link>
            }
            {loggedIn &&
              <Nav.Link>
                <NavLink exact="true" to="/sharednews" style={({ isActive }) => ({ color: isActive ? 'green' : 'blue' })} >Shared News</NavLink>
                <span className="d-lg-none"> &sdot; </span>
              </Nav.Link>
            }
            {loggedIn &&
              <Nav.Link>
                <NavLink exact="true" to="/profile" style={({ isActive }) => ({ color: isActive ? 'green' : 'blue' })} >Profile</NavLink>
                <span className="d-lg-none"> &sdot; </span>
              </Nav.Link>
            }
            {loggedIn &&
              <Nav.Link>
                <Nav onClick={handleLogout}>Logout</Nav>
              </Nav.Link>
            }
            {!loggedIn &&
              <Nav.Link>
                <NavLink to="/login" style={({ isActive }) => ({ color: isActive ? 'green' : 'blue' })} >Login</NavLink>
              </Nav.Link>
            }
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <hr />
      <Routes>
        <Route exact="true" path="/" element={<HomeNewsView dispatch={dispatch} />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/news" element={<NewsView session={session} dispatch={dispatch} />} />
        <Route path="/sharednews" element={<SharedNewsView session={session} dispatch={dispatch} />} />
        <Route path="/profile" element={<ProfileView appLogoutCB={handleLogout} session={session} dispatch={dispatch} />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate replace to="/404" />} />
      </Routes>
    </div>
  );
}

export default App
