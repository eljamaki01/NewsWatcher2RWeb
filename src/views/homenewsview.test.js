import React from 'react';
import ReactDOM from 'react-dom';
import { shallow, mount } from 'enzyme';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducer from '../reducers';
import HomeNewsView from '../views/homenewsview';

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
    const mockData = [{
      contentSnippet: "The launch of a new rocket by Elon Musk’s SpaceX.",
      date: 1514911829000,
      hours: "33 hours ago",
      imageUrl: "https://static01.nyt.com/images/2018/01/02/science/02LAUNCHES1/02LAUNCHES1-thumbStandard-v2.jpg",
      link: "https://www.nytimes.com/2018/01/01/science/2018-spacex-moon.html",
      source: "Science",
      storyID: "$2a$10$.vSR32A1as5taaZ1pS.gQ.m1OgS6OI_poeb8U_E.NUq9azGRdXbIe",
      title: "Rocket Launches and Trips to the Moon",
    }];

    const store = createStore(reducer)
    global.fetch = () => Promise.resolve(mockResponse(200, null, JSON.stringify(mockData)));

    const rc = shallow(<HomeNewsView dispatch={store.dispatch} />, { disableLifecycleMethods: true })

    rc.instance().componentDidMount().then((value) => {
      // All state properties will be updated by now, however, the render may not have happened yet
      // The update() call is made, so the test of the <h1> element will have the refreshed value
      rc.update();
      expect(rc.state().isLoading).toEqual(false);
      expect(rc.find('h1').text()).toEqual('Home Page News');
      const listNews = rc.state().news;
      expect(listNews.length).toEqual(1);
      expect(listNews[0].title).toEqual('Rocket Launches and Trips to the Moon');
      expect(rc.find('b').first().text()).toEqual('Rocket Launches and Trips to the Moon');
      // Verify the Redux state was set with a successful message on fetch completion
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
