import React from 'react';
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import { createStore } from 'redux';
import { Provider } from 'react-redux'
import reducer from '../reducers';
import HomeNewsView from './homenewsview';

describe('<HomeNewsView /> (render with mocked data)', () => {
  beforeAll(() => jest.spyOn(window, 'fetch'))
  afterAll(() => window.fetch.mockClear())

  test('news stories are displayed', async () => {
    window.fetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ([{
        contentSnippet: "The launch of a new rocket by Elon Musk SpaceX.",
        date: 1514911829000,
        hours: "33 hours ago",
        imageUrl: "https://static01.nyt.com/images/blah.jpg",
        link: "https://www.nytimes.com/2018/01/01/science/blah.html",
        source: "Science",
        storyID: "5777",
        title: "Rocket Launches and Trips to the Moon",
      }]),
    })

    const store = createStore(reducer)
    render();
    render(
      <Provider store={store}>
        <HomeNewsView dispatch={store.dispatch} />
      </Provider>
    );
    // await waitFor(() => screen.getByTestId('homepage_heading_id'));
    // await screen.findByTestId('homepage_heading_id');
    expect(await screen.findByTestId('homepage_heading_id')).toBeInTheDocument();
    expect(window.fetch).toHaveBeenCalledTimes(1);
    expect(window.fetch).toHaveBeenCalledWith('/api/homenews', { "cache": "default", "method": "GET" });
    expect(store.getState().app.loggedIn).toEqual(false);
    expect(store.getState().app.currentMsg).toEqual('Home Page news fetched');
    // screen.debug();
    expect(screen.getByText('Home Page News')).toBeInTheDocument();
    expect(screen.getByTestId('homepage_heading_id')).toHaveTextContent('Home Page News');
    expect(screen.getAllByTestId('story-name_id')[0].textContent).toEqual('Rocket Launches and Trips to the Moon');
    // expect(getByText("Click Me").href).toBe('https://www.nytimes.com/2018/01/01/science/blah.html')
    // expect(screen.getByRole('link')).toHaveAttribute('href', 'https://www.nytimes.com/2018/01/01/science/blah.html');
    const items = screen.getAllByTestId('story-name_id');
    expect(items).toHaveLength(1)
  });

  test('handle fetch error', async () => {
    window.fetch.mockResolvedValueOnce({
      status: 500,
      ok: true,
      json: async () => ({
        message: "Error: This is bad",
        error: {}
      }),
    })

    const store = createStore(reducer)
    render(
      <Provider store={store}>
        <HomeNewsView dispatch={store.dispatch} />
      </Provider>
    );
    expect(await screen.findByTestId('loading_id')).toBeInTheDocument();
    expect(screen.getByText('Loading home page news...')).toBeInTheDocument();
    await waitFor(() => expect(store.getState().app.currentMsg).toEqual('Home News fetch failed: Error: This is bad'))
  });
});