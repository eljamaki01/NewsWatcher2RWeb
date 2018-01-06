import React, { Component } from 'react';
import './App.css';
import { HashRouter, Switch, Route } from 'react-router-dom'
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { IndexLinkContainer } from 'react-router-bootstrap';
import { connect } from 'react-redux'
import LoginView from './views/loginview';
import NewsView from './views/newsview';
import HomeNewsView from './views/homenewsview';
import SharedNewsView from './views/sharednewsview';
import ProfileView from './views/profileview';
import NotFound from './views/notfound';

class App extends Component {

  componentDidMount() {
    // Check for token in HTML5 client side local storage
    const storedToken = window.localStorage.getItem("userToken");
    if (storedToken) {
      const tokenObject = JSON.parse(storedToken);
      this.props.dispatch({ type: 'RECEIVE_TOKEN_SUCCESS', msg: `Signed in as ${tokenObject.displayName}`, session: tokenObject });
    } else {
    }
  }

  handleLogout = (event) => {
    const { dispatch } = this.props
    event && event.preventDefault();
    fetch(`/api/sessions/${this.props.session.userId}`, {
      method: 'DELETE',
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
        dispatch({ type: 'DELETE_TOKEN_SUCCESS', msg: "Signed out" });
        window.localStorage.removeItem("userToken");
        window.location.hash = "";
      })
      .catch(error => {
        dispatch({ type: 'MSG_DISPLAY', msg: `Sign out failed: ${error.message}` });
      });
  }

  render() {
    return (
      <HashRouter>
        <div>
          <Navbar fluid default collapseOnSelect>
            <Navbar.Header>
              <Navbar.Brand>
                NewsWatcher {this.props.currentMsg && <span><small id="currentMsgId">({this.props.currentMsg})</small></span>}
              </Navbar.Brand>
              <Navbar.Toggle />
            </Navbar.Header>
            <Navbar.Collapse>
              <Nav>
                {<IndexLinkContainer to="/" replace><NavItem >Home Page News</NavItem></IndexLinkContainer>}
                {this.props.loggedIn && <IndexLinkContainer to="/news" replace><NavItem >My News</NavItem></IndexLinkContainer>}
                {this.props.loggedIn && <IndexLinkContainer to="/sharednews" replace><NavItem >Shared News</NavItem></IndexLinkContainer>}
                {this.props.loggedIn && <IndexLinkContainer to="/profile" replace><NavItem >Profile</NavItem></IndexLinkContainer>}
                {this.props.loggedIn && <NavItem onClick={this.handleLogout}>Logout</NavItem>}
                {!this.props.loggedIn && <IndexLinkContainer to="/login" replace><NavItem id="loginLink">Login</NavItem></IndexLinkContainer>}
              </Nav>
            </Navbar.Collapse>
          </Navbar>
          <hr />
          <Switch>
            <Route exact path="/" render={() => <HomeNewsView dispatch={this.props.dispatch} />} />
            <Route path="/login" component={LoginView} />
            <Route path="/news" component={NewsView} />
            <Route path="/sharednews" component={SharedNewsView} />
            <Route path="/profile" render={props => <ProfileView appLogoutCB={this.handleLogout} {...props} />} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </HashRouter>
    );
  }
}

const mapStateToProps = state => {
  return {
    loggedIn: state.app.loggedIn,
    session: state.app.session,
    currentMsg: state.app.currentMsg
  }
}

export default connect(mapStateToProps)(App)
