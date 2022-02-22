import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { createStore } from 'redux';
import { Provider } from 'react-redux'
import { HashRouter as Router } from 'react-router-dom';
import reducer from '../reducers';
import LoginView from './loginview';

describe('<LoginView /> (render with mocked data)', () => {
  beforeAll(() => jest.spyOn(window, 'fetch'))
  afterAll(() => window.fetch.mockClear())

  // Need to mock the local storage call as well
  global.localStorage = {
    setItem: () => { },
    removeItem: () => { }
  }

  test('User can log in', async () => {
    window.fetch.mockResolvedValueOnce({
      status: 201,
      ok: true,
      json: async () => ({
        displayName: "Buzz",
        userId: "1234",
        token: "zzz",
        msg: "Authorized"
      }),
    })
    const store = createStore(reducer);

    render(
      <Provider store={store}>
        <Router>
          <LoginView />
        </Router>
      </Provider>
    );
    expect(await screen.findByTestId('login_heading_id')).toBeInTheDocument();
    expect(store.getState().app.session).toEqual(null);
    expect(screen.getByText('Log in Page')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Login'));
    expect(await screen.findByText('Logged in...')).toBeInTheDocument();
    // const overnightRB = screen.getByTestId('some-button');
    // expect(overnightRB.checked).toEqual(true);

    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(window.fetch).toHaveBeenCalledWith('/api/sessions', {
      "body": "{\"email\":\"\",\"password\":\"\"}",
      "cache": "default",
      "headers": {
        "map": {
          "content-type": "application/json",
        },
      },
      "method": "POST",
    });
    expect(store.getState().app.currentMsg).toEqual('Signed in as Buzz');
    expect(store.getState().app.session).not.toEqual(null);
  });

  test('User not found', async () => {
    window.fetch.mockResolvedValueOnce({
      status: 404,
      ok: true,
      json: async () => ({ "message": "Error: User was not found.", "error": {} }),
    })
    const store = createStore(reducer);

    render(
      <Provider store={store}>
        <Router>
          <LoginView />
        </Router>
      </Provider>
    );
    expect(await screen.findByTestId('login_heading_id')).toBeInTheDocument();
    expect(store.getState().app.session).toEqual(null);
    expect(screen.getByText('Log in Page')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Login'));
    expect(await screen.findByTestId('login_heading_id')).toBeInTheDocument();

    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(store.getState().app.currentMsg).toEqual('Sign in failed: Error: User was not found.');
    expect(store.getState().app.session).toEqual(null);
  });
});