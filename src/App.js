import React, { Component } from 'react';
import superagent from 'superagent';
import './App.css';
import { HashRouter, Switch, Route, Link } from 'react-router-dom'
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import LoginView from './views/loginview';
import NewsView from './views/newsview';
import ProfileView from './views/profileview';

const News = () => (
  <div>
    <h2>News</h2>
  </div>
)

const SharedNews = () => (
  <div>
    <h2>Shared News</h2>
  </div>
)

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loggedIn: false,
      session: null,
      currentMsg: ""
    };
  }

  componentDidMount() {
    // Check for token in HTML5 client side local storage
    var retrievedObject = window.localStorage.getItem("userToken");
    if (retrievedObject) {
      this.setState({ session: JSON.parse(retrievedObject) });
      this.setState({ loggedIn: true });
      this.setState({ currentMsg: `Signed in as ${retrievedObject.displayName}` });
      window.location.replace(window.location.pathname + '#/news');
    } else {
      window.location.replace(window.location.pathname + '#/');
    }
  }

  handleLogin = (payload) => {
    if (payload.type === "MSG_LOGIN_OK") {
      this.setState({ loggedIn: true });
      this.setState({ session: payload.data });
      window.location.replace(window.location.pathname + '#/news');
      //window.history.replaceState(undefined, undefined, "#/news")
    }
    this.setState({ currentMsg: payload.msg });
  }

  handleLogout = (event) => {
    event.preventDefault();
    superagent.delete(`/api/sessions/${this.state.session.userId}`)
      .set('Content-Type', 'application/json')
      .set('x-auth', this.state.session.token)
      .end((err, res) => {
        if (err || !res.ok || res.status != 200) {
          this.setState({ currentMsg: `Sign out failed: ${res.body.message}` });
        } else {
          this.setState({ loggedIn: false });
          this.setState({ session: null });
          window.localStorage.removeItem("userToken");
          this.setState({ currentMsg: "Signed out" });
          window.location.replace(window.location.pathname + '#/');
        }
      });
  }

  render() {
    return (
      <HashRouter>
        <div>
          <Navbar fluid default collapseOnSelect>
            <Navbar.Header>
              <Navbar.Brand>
                NewsWatcher {this.state.currentMsg && <span><small id="currentMsgIndex">({this.state.currentMsg})</small></span>}
              </Navbar.Brand>
              <Navbar.Toggle />
            </Navbar.Header>
            <Navbar.Collapse>
              <Nav>
                {this.state.loggedIn && <NavItem id="newsLink" eventKey={1} href="javascript:void(0)"><Link to="/news" replace>News</Link></NavItem>}
                {this.state.loggedIn && <NavItem id="savedLink" eventKey={2} href="javascript:void(0)"><Link to="/savednews" replace>Saved News</Link></NavItem>}
                {this.state.loggedIn && <NavItem id="sharedLink" eventKey={3} href="javascript:void(0)"><Link to="/sharednews" replace>Shared News</Link></NavItem>}
                {this.state.loggedIn && <NavItem id="profileLink" eventKey={4} href="javascript:void(0)"><Link to="/profile" replace>Profile</Link></NavItem>}
                {this.state.loggedIn && <NavItem id="logoutLink" eventKey={5} href="javascript:void(0)" onClick={this.handleLogout}>Logout</NavItem>}
                {!this.state.loggedIn && <NavItem eventKey={6} href="javascript:void(0)"><Link to="/" replace>Login</Link></NavItem>}
              </Nav>
            </Navbar.Collapse>
          </Navbar>
          <hr />
          <Switch>
            <Route path="/news" render={props => <NewsView session={this.state.session} parentMsgCB={this.handleLogin} {...props} />} />
            <Route path="/savednews" component={News} />
            <Route path="/sharednews" component={SharedNews} />
            <Route path="/profile" render={props => <ProfileView session={this.state.session} parentMsgCB={this.handleLogin} {...props} />} />
            <Route path="/" render={props => <LoginView session={this.state.session} parentMsgCB={this.handleLogin} {...props} />} />
          </Switch>
        </div>
      </HashRouter>
    );
  }
}

export default App;
