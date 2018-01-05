import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux'
import reducer from './reducers'
import { Provider } from 'react-redux'
import { shallow } from 'enzyme';
import App from './App';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';
import './index.css';

const store = createStore(reducer);

it('renders without crashing', () => {
  const app = shallow(<Provider store={store}>
    <App />
  </Provider>, { disableLifecycleMethods: true })
});
