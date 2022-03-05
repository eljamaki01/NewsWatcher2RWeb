import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import reducer from './reducers'
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.css';
// import reportWebVitals from './reportWebVitals';


// Grab the state from a global variable injected into the server-generated HTML
// if (window.__PRELOADED_STATE__) {
let store;
if (window.__PRELOADED_STATE__) {
  store = createStore(reducer, window.__PRELOADED_STATE__);
  delete window.__PRELOADED_STATE__
  ReactDOM.hydrate(
    <React.StrictMode>
      <Provider store={store}>
        <HashRouter>
          <App />
        </HashRouter>
      </Provider>
    </React.StrictMode>,
    document.getElementById('root')
  );
} else {
  store = createStore(reducer);
  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <HashRouter>
          <App />
        </HashRouter>
      </Provider>
    </React.StrictMode>,
    document.getElementById('root')
  );
}


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
