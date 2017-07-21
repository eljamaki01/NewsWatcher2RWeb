import React, { Component } from 'react';
import './App.css';
import {
  HashRouter,
  Switch,
  Route,
  Link
} from 'react-router-dom'
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { Redirect } from 'react-router'
import LoginView from './views/loginview';
import NewsView from './views/newsview';

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

const Profile = () => (
  <div>
    <h2>Profile</h2>
  </div>
)

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loggedIn: false,
      session: null,
      currentMsg: "..."
    };
  }

  componentDidMount() {
    console.log("HERE");
    // Check for token in HTML5 client side local storage
    var retrievedObject = window.localStorage.getItem("userToken");
    if (retrievedObject) {
      console.log(retrievedObject);//????????????????????????????
      this.setState({ session: JSON.parse(retrievedObject) });
      //$scope.remeberMe = true;
      this.setState({ loggedIn: true });
      //$http.defaults.headers.common['x-auth'] = this.state.session.token;
      //$scope.$emit('msg', "Signed in as " + this.state.session.displayName);
      this.setState({ currentMsg: `Signed in as ${this.state.session.displayName}` });
      ////$location.path('/news').replace();
      <Redirect to="/#/news" />
    } else {
      console.log("HERE2");
      //$scope.remeberMe = false;
      ////$location.path('/').replace();
      ///////////////////////////////////<Redirect to="/" /> // "/#/" ?????
      <Redirect to="/#/news" />
      //this.props.history.push("/new/url")
      //window.location.replace(window.location.pathname + '#/news');
    }
  }

  onMsg = (msg) => {
    //			$scope.currentMsg = msg;
  }

  handleLogout = (event) => {
    event.preventDefault();
    // this.props.history.push(event.currentTarget.getAttribute('href'));
    // Try to get a hold of react routing on its own, else, read this article after googling for other ways -
    // http://serverless-stack.com/chapters/adding-links-in-the-navbar.html
    // $http({
    //   method: 'DELETE',
    //   url: "/api/sessions/" + this.state.session.userId,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'x-auth': this.state.session.token
    //   },
    //   responseType: 'json'
    // }).then(function successCallback(response) {
    //   this.setState({ loggedIn: false });
    //   this.setState({ session: null });
    //   //$http.defaults.headers.common["x-auth"] = null;
    //   window.localStorage.removeItem("userToken");
    //   //$scope.$emit('msg', "Signed out");
    //   this.setState({ currentMsg: "Signed out" });
    //   ///////$location.path('/').replace();
    //   <Redirect to="/" />
    //   //this.props.history.push("/new/url")
    //   //window.location.replace(window.location.pathname + window.location.search + '#/unicorn/pacomo/edit');
    // }, function errorCallback(response) {
    //   //$scope.$emit('msg', "Sign out failed. " + response.data.message);
    //   this.setState({ currentMsg: `Sign out failed: ${response.data.message}` });
    // });
    // var myInit = {
    //   method: 'GET',
    //   headers: myHeaders,
    //   mode: 'cors',
    //   cache: 'default'
    // };
    var myInit = {
      method: 'DELETE',
      headers: new Headers({
        "Content-Type": "application/json",
        "x-auth": this.state.session.token
      })
    };

    fetch(`/api/sessions/${this.state.session.userId}`, myInit).then(function (response) {
      if (response.ok) {
        return response.json()
      }
      throw new Error('Network response was not ok.');
    }).then(function (myJson) {
      this.setState({ loggedIn: false });
      this.setState({ session: null });
      window.localStorage.removeItem("userToken");
      this.setState({ currentMsg: "Signed out" });
      <Redirect to="/" />
    }).catch(function (error) {
      this.setState({ currentMsg: `Sign out failed: ${error.message}` });
    });
  }

  handleLogin = (payload) => {
    if (payload.type === "MSG_LOGIN_OK") {
      console.log(payload.msg);
      console.log(payload.data);
      this.setState({ loggedIn: true });
      this.setState({ session: payload.data });
    }
    this.setState({ currentMsg: payload.msg });
  }

  render() {
    return (
      <HashRouter>
        <div>
          <Navbar fluid default collapseOnSelect>
            <Navbar.Header>
              <Navbar.Brand>
                <a href="#">NewsWatcher {this.state.currentMsg && <span><small id="currentMsgIndex">({this.state.currentMsg})</small></span>}</a>
              </Navbar.Brand>
              <Navbar.Toggle />
            </Navbar.Header>
            <Navbar.Collapse>
              <Nav>
                {this.state.loggedIn && <NavItem id="newsLink" eventKey={1} href="javascript:void(0)"><Link to="/news">News</Link></NavItem>}
                {this.state.loggedIn && <NavItem id="savedLink" eventKey={2} href="javascript:void(0)"><Link to="/savednews">Saved News</Link></NavItem>}
                {this.state.loggedIn && <NavItem id="sharedLink" eventKey={3} href="javascript:void(0)"><Link to="/sharednews">Shared News</Link></NavItem>}
                {this.state.loggedIn && <NavItem id="profileLink" eventKey={4} href="javascript:void(0)"><Link to="/profile">Profile</Link></NavItem>}
                {this.state.loggedIn && <NavItem id="logoutLink" eventKey={5} href="javascript:void(0)" onClick={this.handleLogout}>Logout</NavItem>}
                {!this.state.loggedIn && <NavItem eventKey={6} href="javascript:void(0)"><Link to="/">Login</Link></NavItem>}
              </Nav>
            </Navbar.Collapse>
          </Navbar>
          <hr />
          <Switch>
            <Route path="/news" component={NewsView} />
            <Route path="/savednews" component={News} />
            <Route path="/sharednews" component={SharedNews} />
            <Route path="/profile" component={Profile} />
            {/* <Route path="/" component={LoginView} />
            <Route path="/" render={props => <LoginView session={this.state.session} loginHandler={this.handleClick} {...props} />} /> */}
            <Route path="/" render={props => <LoginView parentMsgCB={this.handleLogin} {...props} />} />
          </Switch>
        </div>
      </HashRouter>
    );
  }
}

export default App;
