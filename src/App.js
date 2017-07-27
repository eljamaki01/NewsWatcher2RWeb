import React, { Component } from 'react';
import superagent from 'superagent';
import './App.css';
import { HashRouter, Switch, Route, Link } from 'react-router-dom'
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import LoginView from './views/loginview';
import NewsView from './views/newsview';
import SharedNewsView from './views/sharednewsview';
import ProfileView from './views/profileview';
import NotFound from './views/notfound';

class App extends Component {
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
    const storedToken = window.localStorage.getItem("userToken");
    if (storedToken) {
      const tokenObject = JSON.parse(storedToken);
      this.setState({ session: tokenObject, loggedIn: true, currentMsg: `Signed in as ${tokenObject.displayName}` });
      setTimeout(() => {
        window.location.hash = "#news";
      }, 1000);
    } else {
      window.location.hash = "";
    }
  }

  handleMSG = (payload) => {
    if (payload.type === "MSG_LOGIN_OK") {
      this.setState({ loggedIn: true, session: payload.data });
      window.location.hash = "#news";
    } else if (payload.type === "MSG_ACCT_DELETE_OK") {
      this.handleLogout(null);
    }

    this.setState({ currentMsg: payload.msg });
  }

  handleLogout = (event) => {
    event && event.preventDefault();
    superagent.delete(`/api/sessions/${this.state.session.userId}`)
      .set('Content-Type', 'application/json')
      .set('x-auth', this.state.session.token)
      .end((err, res) => {
        if (err || !res.ok || res.status !== 200) {
          this.setState({ currentMsg: `Sign out failed: ${res.body.message}` });
        } else {
          this.setState({ loggedIn: false, session: null, currentMsg: "Signed out" });
          window.localStorage.removeItem("userToken");
          window.location.hash = "";
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
                {this.state.loggedIn && <NavItem id="newsLink" eventKey={1} ><Link to="/news" replace>News</Link></NavItem>}
                {this.state.loggedIn && <NavItem id="sharedLink" eventKey={3} style={{ cursor: 'pointer' }}><Link to="/sharednews" replace>Shared News</Link></NavItem>}
                {this.state.loggedIn && <NavItem id="profileLink" eventKey={4} style={{ cursor: 'pointer' }}><Link to="/profile" replace>Profile</Link></NavItem>}
                {this.state.loggedIn && <NavItem id="logoutLink" eventKey={5} style={{ cursor: 'pointer' }} onClick={this.handleLogout}>Logout</NavItem>}
                {!this.state.loggedIn && <NavItem eventKey={6} style={{ cursor: 'pointer' }}><Link to="/" replace>Login</Link></NavItem>}
              </Nav>
            </Navbar.Collapse>
          </Navbar>
          <hr />
          <Switch>
            <Route exact path="/" render={props => <LoginView session={this.state.session} parentMsgCB={this.handleMSG} {...props} />} />
            <Route path="/news" render={props => <NewsView session={this.state.session} parentMsgCB={this.handleMSG} {...props} />} />
            <Route path="/sharednews" render={props => <SharedNewsView session={this.state.session} parentMsgCB={this.handleMSG} {...props} />} />
            <Route path="/profile" render={props => <ProfileView session={this.state.session} parentMsgCB={this.handleMSG} {...props} />} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </HashRouter>
    );
  }
}

export default App;
