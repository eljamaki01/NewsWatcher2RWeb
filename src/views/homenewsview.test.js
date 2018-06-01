import React from 'react';
import { shallow } from 'enzyme';
import { createStore } from 'redux';
import reducer from '../reducers';
import HomeNewsView from './homenewsview';

// A helper function to put together an HTTP response for our mocking
const mockResponse = (status, statusText, response) => {
  return new window.Response(response, {
    status: status,
    statusText: statusText,
    headers: {
      'Content-type': 'application/json'
    }
  });
};

describe('<HomeNewsView /> (mocked data)', () => {
  it('news stories are displayed', (done) => {
    // This is the payload that our mocking will return
    const mockData = [{
      contentSnippet: "The launch of a new rocket by Elon Musk’s SpaceX.",
      date: 1514911829000,
      hours: "33 hours ago",
      imageUrl: "https://static01.nyt.com/images/blah.jpg",
      link: "https://www.nytimes.com/2018/01/01/science/blah.html",
      source: "Science",
      storyID: "5777",
      title: "Rocket Launches and Trips to the Moon",
    }];

    // We use the actual redux store with our official reducers
    // We replace the JavaScript fetch() function with our own
    // and always return our mock data
    const store = createStore(reducer)
    global.fetch = () => Promise.resolve(mockResponse(200, null, JSON.stringify(mockData)));

    // Here is the usage of Enzyme to instantiate our component
    const rc = shallow(<HomeNewsView dispatch={store.dispatch} />, { disableLifecycleMethods: true })
    expect(rc.state().isLoading).toEqual(true);

    // We are doing shallow instantiation, so we need to call by hand
    // the componentDidMount() function and wait on the promise resolve
    // to then do testing against what is expected as a result of the
    // news story fetch and render with that data
    rc.instance().componentDidMount().then((value) => {
      // All state properties will be updated by now,
      // however, the render may not have happened yet.
      // The update() call is made, so the test of the <h1> element
      // will now have the refreshed value
      rc.update();
      // Verify some of the state that was set
      expect(rc.state().isLoading).toEqual(false);
      // verify some actual elements that were rendered
      expect(rc.find('h1').text()).toEqual('Home Page News');
      const listNews = rc.state().news;
      expect(listNews.length).toEqual(1);
      expect(listNews[0].title).toEqual('Rocket Launches and Trips to the Moon');
      expect(rc.find('b').first().text()).toEqual('Rocket Launches and Trips to the Moon');
      // Verify the Redux state was set and there is
      // a successful message on fetch completion.
      expect(store.getState().app.currentMsg).toEqual('Home Page news fetched');
      // expect(rc.find('li.div.a').last().props().href).toEqual('http://developer.nytimes.com');
      done();
    })
  });

  it('fetch error is handled and news UI is not rendered', (done) => {
    const mockData = {
      message: "Error: This is bad",
      error: {}
    };

    const store = createStore(reducer)
    global.fetch = () => Promise.resolve(mockResponse(500, null, JSON.stringify(mockData)));

    const rc = shallow(<HomeNewsView dispatch={store.dispatch} />, { disableLifecycleMethods: true })

    rc.instance().componentDidMount().then((value) => {
      rc.update();
      expect(rc.state().isLoading).toEqual(true);
      expect(rc.find('h1').text()).toEqual('Loading home page news...');
      expect(store.getState().app.currentMsg).toEqual('Home News fetch failed: Error: This is bad');
      done();
    })
  });
});
