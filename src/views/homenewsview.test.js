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

  it('new stories are displayed', (done) => {
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

    const app = shallow(<HomeNewsView dispatch={store.dispatch} />, { disableLifecycleMethods: true })

    app.instance().componentDidMount().then((value) => {
      // All state properties will be updated by now, however, the render may not have happened yet
      // The update() call is made, so the test of the <h1> element will have the refreshed value
      app.update();
      expect(app.state().isLoading).toEqual(false);
      expect(app.find('h1').text()).toEqual('Home Page News');
      const listNews = app.state().news;
      expect(listNews.length).toEqual(1);
      expect(listNews[0].title).toEqual('Rocket Launches and Trips to the Moon');
      expect(app.find('b').first().text()).toEqual('Rocket Launches and Trips to the Moon');
      // Verify the Redux state was set with a successful message on fetch completion
      expect(store.getState().app.currentMsg).toEqual('Home Page news fetched');
      done();
    })

    // // We have to play this little trick where we delay the resolve of the Promise
    // // This is so we can verify the simulated timing of the UI rendering before the fetch
    // // and after the fetch of the news stories
    // // var outsideResolve;
    // // var outsideReject;
    // // const mockResponsePromise = new Promise(function (resolve, reject) {
    // //   outsideResolve = resolve;
    // //   outsideReject = reject;
    // // });
    // const mockResponsePromise = Promise.resolve(mockResponse(200, null, JSON.stringify(mockData)));
    // // We mock the fetch to control the response so the componentDidMount() does
    // // actually run, but get the controlled returned data This also can exercise
    // // any asyncronous usage and also Redux if that is involved
    // window.fetch = jest.fn().mockImplementationOnce(() => mockResponsePromise);

    // const store = createStore(reducer)

    // // let hnv = mount(<HomeNewsView dispatch={store.dispatch} />);
    // // let hnv = shallow(<HomeNewsView dispatch={store.dispatch} />, { disableLifecycleMethods: true });
    // let hnv = mount(<HomeNewsView dispatch={store.dispatch} /> );

    // expect(hnv.state().isLoading).toEqual(true);

    // // This would be code that runs after the componentDidMount() fetch has finished
    // await hnv.instance().componentDidMount()
    // // hnv.instance().componentDidMount().then((value) => {
    //   // Since componentDidMount() ran asycronously, we need to update our DOM
    //   hnv.update();
    //   console.log(`test state = ${hnv.state().isLoading}`);
    //   expect(hnv.state().isLoading).toEqual(false);
    //   expect(hnv.find('h1').text()).toEqual('Home Page News');
    //   const listNews = hnv.state().news;
    //   expect(listNews.length).toEqual(1);
    //   expect(listNews[0].contentSnippet).toEqual('The launch of a new rocket by Elon Musk’s SpaceX.');
    //   // Verify the Redux state was set with a successful message on fetch completion
    //   expect(store.getState().app.currentMsg).toEqual('Home Page news fetched');
    //   console.log("DONE WITH TESTS call done()");
    // //   done();
    // // })
    // // .catch(error => {
    // //   console.log(`Test Failure: ${error.message}`);
    // //   expect(false).toEqual(true);
    // //   done(Error("Bad"));
    // //   done(Error("Bad"));
    // // });
    // console.log("FIRE IT OFF!");
    // // This triggers the simulation of the fetch being given data
    // // outsideResolve(mockResponse(200, null, JSON.stringify(mockData)));
  });
});

// This is for error condition from fetch!!!!!!!!!
  //   const mockData = {
  //     message: "Error: This is bad",
  //     error: {}
  //   };

  //     expect(hnv.state().isLoading).toEqual(false);
  //     expect(hnv.find('h1').text()).toEqual('Loading home page news...');
  //     expect(store.getState().app.currentMsg).toEqual('Home News fetch failed: Error: This is bad');

  // Mention that you will see people advise away from mount to shallow, but then you don't get the 
  // full hierarchy like bootstrap components that need
  // Try doing a shallow anyway fopr fun as default use of componentdidMount now works
  // Note in book to not try a setTimeout() as Jest does not like that and it is bad form anyway as 
  // it takes away from asycronous fast running code. Imaging 300 tests that each have a 3 second delay!
  // Mention could call store.dispatch like componentdidMount() code but then get less code tested.
  // Can also mock the error case
  // Could even set the props or state directly on the component, but again that would take away code from being tested
  //That fetch inthe actual React code is actually not going to work as it is relying on the backend call
  // origionation from its location     fetch('/api/homenews', {
  // and not the full path to the actually running service URL and could have used localhost but that would be wierd
  // Best all around anyway to mock it!!!!!!!!!!!!!!! Mock the fetch and everything else can then wait on that anyway
  // and rest will still work as expected and get populated etc.
  // AND! we can force the return and thus test what it has. All the rest, such as Redux does come into play!

  // Change the homenewsview.js back to local state anyway and not useing Redux at all like did to the Native code
  // Others will probably still need the Redux, but not for everything like it is now, so alter those also

  // there is a double issue here. First off, the componentDidMount has an async call to fectch the data
  // that can be solved and we wait for it to funish, but then is uses a dispatch to set the properties!
  // That is what the kicker is, because that is async also and 
  // Could go back to local state for those properties! Nothing else is using state.homenews
  //Maybe that is why I need to test a component apart from the Redux connect version, use dive() with shallow and not have
  // componentDidMount called, or if do mount then can override it! and have it do nothing!
  // 1. test redux pieces of code
  // 2. test the "dumb" component by setting props directly for the news etc!

  // it('ensures the state is set', () => {
  //   const promise = Promise.resolve(mockData);
  //   sinon.stub(global, 'fetch', () => promise);

  //   const wrapper = mount(<ExampleComponent />);

  //   return promise.then(() => {
  //     expect(wrapper.state()).to.have.property('dataReady', true);

  //     wrapper.update();
  //   }).then(() => {
  //     expect(wrapper.text()).to.contain('data is ready');
  //   });
  // });


  //Do I need a refresh as have example of below?
  // test("test an API which takes time", () => {

  //   doYourThing()

  // }, 10000)
  // onClick() {
  //   api.getData().then(data => {
  //     this.setState({ data: data }) //should re-render when the promise resolves, and our test should assert after
  //   })
  // }
  // Your test needs to take that into account, usually by mocking the ajax call and keeping a handle on that promise.

  //   it('works async', done => {
  //     const response = Promise.resolve({ fakeData: 42 })
  //     setUpMockApiCall(api.getData, response)
  //     const wrapper = mount(<MyComponent />)
  //     wrapper.find('button').first().simulate('click')
  //     response.then(() => {
  //       expect(wrapper.find('.updatedElement')).toBe('span')
  //       done()
  //     })
  //   });

  //   it('', async() = > {
  //     const expectedItems = [{ id: 1 }, { id: 2 }];
  //     const p = Promise.resolve(expectedItems)
  //     AdminApiClient = {
  //       getItems: () = > p
  //     }
  //     const wrapper = mount(
  //       <Create adminApi={AdminApiClient} />
  //     );
  //     await p
  //     expect(wrapper.state().items).toBe(expectedItems);
  //   })

  // it('new stories are displayed (fetch mocking)', (done) => {
  // });

  // it('has a list of new items', () => {
  //   const wrapper = mount(<HomeNewsView />);
  //   expect(wrapper.find('h1').text()).toEqual('Home Page News');
  //   expect(component.find('li')).toBeGreaterThan(1) // Media.ListItem???
  //   const listNews = wrapper.props().news;
  //   expect(listNews.length).toEqual(1);
  //   expect(listNews[0].title).toEqual('???');
  // });

  // it('has a link to nytimes', () => {
  //   const wrapper = mount(<HomeNewsView />);

  //   expect(wrapper.find(li.div.a).last().props().href).to.equal('http://developer.nytimes.com');
  // });
// //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// const localStorageMock = {
//   getItem: jest.fn(),
//   setItem: jest.fn(),
//   clear: jest.fn()
// };
// global.localStorage = localStorageMock

// // replace instance method like handleLogin. Probably close, but look at other examples.
// // Maybe don't want to stub this out, but to replace - superagent.post()
// // Maybe it is time to replace that with fetch!!! and see example on how to stub that !
// describe('Overwriting methods', () => {
//   it('the simplest way of removing complexity', () => {
//     const mockedMethodB = jest.fn();
//     const wrapper = shallow(<Blog />);

//     wrapper.instance().methodB = mockedMethodB;
//     wrapper.instance().methodA();

//     expect(mockedMethodB).toHaveBeenCalledTimes(1);
//   });
// });
// X
// // FetchingThing.js
// import React, { Component } from 'react'

// class FetchingThing extends Component {
//   constructor() {
//     super();

//     this.state = {
//       data: null,
//       error: null,
//       loading: true
//     };
//   }

//   componentWillMount() {
//     this.fetchStuff();
//   }

//   fetchStuff() {
//     return fetch('/api/stuff') // Note the return
//       .then((response) => {
//         this.setState({ loading: false, data: response.json() });
//       }).catch((err) => {
//         this.setState({ loading: false, error });
//       });
//   }

//   render() {
//     // A sick render method
//   }
// }

// describe('Working with promises', () => {
//   it('is quite simple if you give the promise to the test runner', () => {
//     const mockData = { goodResponse: 'yes' };

//     /* First we need stub out fetch, we do this my providing an
//        already resolved promise with our preferred data. */
//     jest.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(mockData));

//     const wrapper = shallow(<FetchingThing />, { disableLifecycleMethods: true });

//     /* We need to return the promise to the test runner
//        so that it doesn't move on until we are done */
//     return wrapper.instance().fetchStuff()
//       .then(() => { // We hook into the end of the promise chain
//         expect(wrapper.state().data).toEqual(mockData);
//       });
//   });

//   it('take in done parameter to tell the runner your self', (done) => { // Note the done
//     const mockError = { error: 'boo!' };

//     // We can even test error paths
//     jest.spyOn(window, 'fetch').mockImplementation(() => Promise.reject(mockError));

//     const wrapper = shallow(<FetchingThing />, { disableLifecycleMethods: true });

//     // We are not returning the promise
//     wrapper.instance().fetchStuff().then(() => {
//       expect(wrapper.state().error).toEqual(mockData);

//       done(); // Now jest can move on to the next test!

//       // If we end up never calling done() the test will time out, fail and move on.
//     });
//   });
// });

// XXXX
// import * as heavyUtils from '../myHeavyUtils.js'; // Note how we import it
// import { X_OK } from 'constants';

// describe('Stubbing methods', () => {
//   it('is the best way to remove external complexity', () => {
//     const heavyUtilsSpy = jest.spyOn(heavyUtils, 'someHeavyFunction')
//       .mockImplementation(data => {
//         // Data is the parameter our method would normally recieve
//         return data + 15;
//       });
//     const wrapper = shallow(<Blog data={10} />);

//     expect(wrapper.text()).toEqual('Result from heavy method is: 25');
//   });
// });

// // Test out if this is really needed in the code - event.preventDefault();
// // If so, solve by the following:
// const wrapper = shallow(<YourComponent />);
// wrapper.find('a').simulate('click', { preventDefault() { } });

// //XXXXXXXXXXXX
// describe('App', () => {
//   let app;

//   before(() => {
//     app = shallow(<App />);
//   });
// });

// it('onAdd updates List', () => {
//   const add = app.find('Add').first();
//   add.props().onAdd('Name 1');
//   app.update();
//   const list = app.find('List').first();
//   const listData = list.props().data;
//   expect(listData.length).toEqual(1);
//   expect(listData[0]).toEqual('Name 1');
// });
// //XXXXXXXXX
// const mockStore = configureStore(middlewares);
// beforeEach(() => {
//   const store = mockStore(initialState);
//   container = shallow(<ConnectedLoginPage store={store} />);
// });

// it('+++ check Prop matches with initialState', () => {
//   expect(container.prop('currentLang')).toEqual('en');
// });

// describe('>>>LoginPage — REACT-REDUX (Mount + wrapping in Provider)', () => {
//   let container;
//   beforeEach(() => {
//     const store = mockStore(initialState);
//     container = mount(
//       <Provider store={store}><ConnectedLoginPage /></Provider>
//     );
//   });
//   it('+++ render the connected(SMART) component', () => {
//     expect(container.find(ConnectedLoginPage).length).toEqual(1);
//   });
//   it('+++ contains class component', () => {
//     expect(container.find('.grayBackground').length).toBe(1);
//   });

//   it('+++ check Prop matches with initialState', () => {
//     expect(container.find(LoginPage).prop('currentLang'))
//       .toEqual(initialState.localization.data.type);
//   });
// });
// XXXXXXXXX

// const eventEmail = {
//   target: { name: 'email', value: 'test@test.com' }
// };
// component.find('[name="email"]').simulate('change', eventEmail);
// expect(component.state('email')).toEqual('test@test.com');
// expect(component.find('[name="email"]').prop('value')).toEqual('test@test.com');
// component.find('button[type="button"]').simulate('click');

// //XXXXXXXXXXXXXXX
// module.exports = {
//   setLocalStorage: function () {
//     global.localStorage = {
//       getItem: function (key) {
//         return this[key];
//       },
//       setItem: function (key, value) {
//         this[key] = value;
//       },
//       removeItem: function (key) {
//         delete this[key];
//       }
//     };

//     const jwt = require('jsonwebtoken');
//     const token = jwt.sign({ foo: 'bar', exp: Math.floor(Date.now() / 1000) + 3000 }, 'shhhhh');
//     localStorage.setItem('id_token', token);
//   }
// };

// beforeAll(() => {
//   const ls = require("../../utils/localStorage.js");
//   ls.setLocalStorage();
// });

// //XXXXXXXXXXXXXXXXXXXXXX
// //Redux testing
// should be able to call store, dispatch!!! Or maybe not as good!
// import { ADD_TODO } from '../constants/ActionTypes'

// const initialState = [
//   {
//     text: 'Use Redux',
//     completed: false,
//     id: 0
//   }
// ]

// export default function todos(state = initialState, action) {
//   switch (action.type) {
//     case ADD_TODO:
//       return [
//         {
//           id: state.reduce((maxId, todo) => Math.max(todo.id, maxId), -1) + 1,
//           completed: false,
//           text: action.text
//         },
//         ...state
//       ]

//     default:
//       return state
//   }
// }
// //can be tested like:

// import reducer from '../../reducers/todos'
// import * as types from '../../constants/ActionTypes'

// describe('todos reducer', () => {
//   it('should return the initial state', () => {
//     expect(reducer(undefined, {})).toEqual([
//       {
//         text: 'Use Redux',
//         completed: false,
//         id: 0
//       }
//     ])
//   })

//   it('should handle ADD_TODO', () => {
//     expect(
//       reducer([], {
//         type: types.ADD_TODO,
//         text: 'Run the tests'
//       })
//     ).toEqual([
//       {
//         text: 'Run the tests',
//         completed: false,
//         id: 0
//       }
//     ])

//     expect(
//       reducer(
//         [
//           {
//             text: 'Use Redux',
//             completed: false,
//             id: 0
//           }
//         ],
//         {
//           type: types.ADD_TODO,
//           text: 'Run the tests'
//         }
//       )
//     ).toEqual([
//       {
//         text: 'Run the tests',
//         completed: false,
//         id: 1
//       },
//       {
//         text: 'Use Redux',
//         completed: false,
//         id: 0
//       }
//     ])
//   })
// })

// X
// import * as ActionType from 'actions/questions';

// function questionsReducer(state = [], action) {
//   switch (action.type) {
//     case ActionType.LOADED_QUESTIONS:
//       return action.response;
//       break;
//     default:
//       return state;
//   }
// }

// export default questionsReducer;

// import questionReducer from 'reducers/questions';
// import * as ActionType from 'actions/questions';

// describe('Reducer::Question', function () {
//   it('returns an empty array as default state', function () {
//     // setup
//     let action = { type: 'unknown' };

//     // execute
//     let newState = questionReducer(undefined, { type: 'unknown' });

//     // verify
//     expect(newState).to.deep.equal([]);
//   });

//   describe('on LOADED_QUESTIONS', function () {
//     it('returns the <code>response</code> in given action', function () {
//       // setup
//       let action = {
//         type: ActionType.LOADED_QUESTIONS,
//         response: { responseKey: 'responseVal' }
//       };

//       // execute
//       let newState = questionReducer(undefined, action);

//       // verify
//       expect(newState).to.deep.equal(action.response);
//     });
//   });
// });

// //XXXXXXXXXXXXX
// describe('Stateful reducers', function () {
//   it('should correctly block requests', function () {
//     const server = new Server(500)
//     const initialState = { blocked: false }
//     const store = createStore(function (state, action) {
//       return {
//         blocked: server.blocked(state, action),
//       }
//     }, initialState)
//     server.setStore(store)

//     const wrapper = mount(<ClientWrapper server={server} store={store} />)

//     expect(wrapper.find('button').prop('disabled')).to.be.false

//     wrapper.find('button').simulate('click')

//     wrapper.update()

//     expect(wrapper.find('button').prop('disabled')).to.be.true

//     // simulate the server timeout update
//     store.dispatch({ type: Server.REQUESTS_ENABLED })

//     wrapper.update()

//     expect(wrapper.find('button').prop('disabled')).to.be.false
//   })
// })

// //XXXXXXXXXXXXX

// import React from 'react';

// import configureMockStore from 'redux-mock-store';
// import { reducer as formReducer } from 'redux-form';
// import { createStore } from 'redux';
// import { Provider } from 'react-redux';

// import { expect } from 'chai';
// import { mount } from 'enzyme';

// import progress from '../../src/reducers';
// import Postcode from '../../src/components/postcode';

// /* global describe, it, before, expect */
// require('../setup');


// describe('Postcode Component', () => {
//   let subject; // mocked component
//   let resposeState; // to test response state

//   beforeEach(() => {
//     const store = createStore(reducer)

//     const returnState = (state) => {
//       resposeState = state;
//       return state;
//     }

//     subject = mount(
//       <Provider store={store} >
//         <Postcode onSubmit={returnState} />
//       </Provider>
//     )
//   })

//   it('shows title', () => {
//     expect(subject.text()).to.have.string('Postcode');
//   });

//   it('has postcode field', () => {
//     expect(subject.find('input[name="postcode"]')).to.have.length.of(1)
//   });

//   it('goest to NEXT_STEP when submit', () => {
//     const form = subject.find('form')
//     form.simulate('submit')
//     expect(resposeState.step).to.equal('NEXT_STEP')
//   });
// });

// //XXXXXXXXXXXXXXXXX
// //Note the .dive and can have .dive().dive()
// renderComponent = (props = {}) => shallow(<Component {...props} />).dive()

// const dispatchMock = jest.fn()
// const component = renderComponent({ dispatch: dispatchMock })

// component.find('form').simulate('submit')
// expect(dispatchMock.mock.calls.length).toBe(1)
// //X
// const store = mockStore(initialState);
// const wrapper = mount(
//   <Provider store={store}>
//     <MyContainer />
//   </Provider>
// const myContainer = wrapper.dive();

// //XXXXXXXXXXXXX
// // app/src/components/Login.js
// import React from 'react'
// import { connect } from 'react-redux'
// import { loginUser } from '../actions/users'
// class Login extends React.Component {
//   constructor() {
//     super()
//     this.state = {
//       username: '',
//       password: ''
//     }
//   }
//   handleInputChange = (event) => {
//     this.setState({
//       [event.target.name]: event.target.value
//     })
//   }
//   handleSubmit = (event) => {
//     event.preventDefault()
//     this.props.login(this.state)
//   }
//   render() {
//     return (
//       <form id='loginForm' className='login' onSubmit={this.handleSubmit}>
//         <label>Username</label>
//         <input id='email' onChange={this.handleInputChange} name='email' type='text' />
//         <label>Password</label>
//         <input id='password' onChange={this.handleInputChange} name='password' type='password' />
//         <button>Submit</button>
//       </form>
//     )
//   }
// }
// function mapDispatchToProps(dispatch) {
//   return {
//     login: (userparams, history) => {
//       dispatch(loginUser(userparams, history))
//     }
//   }
// }
// export default connect(mapDispatchToProps)(Login)
// ...
// import configureStore from 'redux-mock-store'

// // create any initial state needed
// const initialState = {};
// // here it is possible to pass in any middleware if needed into //configureStore
// const mockStore = configureStore();
// let wrapper;
// let store;
// beforeEach(() => {
//   //creates the store with any initial state or middleware needed  
//   store = mockStore(initialState)
//   wrapper = see below...
//  })

// wrapper = shallow(<Login store={store} />)
// OR
// // not suggested
// wrapper = mount(<Provider store={store}<Login /></Provider >)
// //XXXXXXXXXXXXXXXXX

// import React from 'react'
// import PropTypes from 'prop-types'
// import { connect } from 'react-redux'
// import { submitValue } from '../store/modules/showBox'

// export class ShowBox extends React.Component {
//   constructor(props) {
//     super(props)
//     this.state = {
//       searchString: this.props.search || ""
//     }
//   }

//   handleInput = (event) => {
//     this.setState({
//       searchString: event.target.value
//     })
//   }

//   render() {
//     return (
//       <form onSubmit={(e) => this.props.handleShowSubmit(this.state.searchString, e)}>
//         <div>
//           <input
//             type="search"
//             className="form-control"
//             placeholder="Search"
//             value={this.state.searchString}
//             onChange={this.handleInput}
//           />
//           <div>
//             <i className="icon-search"></i>
//           </div>
//         </div>
//       </form>
//     )
//   }
// }

// export default connect(
//   (state) => ({
//     search: state.showBox.search,
//   }),
//   (dispatch) => {
//     return {
//       handleShowSubmit: (text, e) => {
//         if (e) {
//           // Avoid redirecting
//           e.preventDefault()
//         }
//         dispatch(submitValue(text))
//       }
//     }
//   }
// )(ShowBox)
// ...
// import { shallow } from 'enzyme';

// const shallowWithStore = (component, store) => {
//   const context = {
//     store,
//   };
//   return shallow(component, { context });
// };

// export default shallowWithStore;

// describe('ConnectedShowBox', () => {
//   it("should render successfully if string is not provided by store", () => {
//     const testState = {
//       showBox: {}
//     };
//     const store = createMockStore(testState)
//     const component = shallowWithStore(<ConnectedShowBox />, store);
//     expect(component).to.be.a('object');
//   });
// });

// it("should render a text box with no string inside if search string is not provided by store", () => {
//   const testState = {
//     showBox: {
//       search: ""
//     }
//   };
//   const store = createMockStore(testState)
//   const component = shallowWithStore(<ConnectedShowBox />, store);
//   expect(component).to.be.a('object');


//   expect(component.dive().find("").prop("value")).to.equal("")


//   component.dive().find("").simulate("change", { target: { value: "Site" } });
//   expect(component.dive().find("d").prop("value")).to.equal("Site")
// });

// it("should render a text box with no string inside if search string is not provided by store", () => {
//   const testState = {
//     showBox: {
//       search: ""
//     }
//   };
//   const store = createMockStore(testState)
//   const component = shallowWithStore(<ConnectedShowBox />, store);

//   component.dive().find("form > div > input").simulate("change", { target: { value: "Site" } });
//   expect(component.dive().find("d").prop("value")).to.equal("Site")


//   component.dive().find("form").simulate("submit");
//   expect(store.isActionDispatched({
//     type: "showBox/SUBMIT",
//     searchString: "Site"
//   })).to.be.true;
// });

// //XXXXXXXXXXXXXXXXX
// import React from 'react';
// import { Provider } from 'react-redux';
// import { mount, shallow } from 'enzyme';
// import { expect } from 'chai';
// import LoginContainer from '../../src/login/login.container';
// import Login from '../../src/login/Login';
// import configureMockStore from 'redux-mock-store';
// import thunk from 'redux-thunk';
// import { stub } from 'sinon';

// const mockStore = configureMockStore([thunk]);

// describe('Container Login', () => {
//   let store;
//   beforeEach(() => {
//     store = mockStore({
//       auth: {
//         sport: 'BASKETBALL',
//       },
//     });
//   });
//   it('should render the container component', () => {
//     const wrapper = mount(
//       <Provider store={store}>
//         <LoginContainer />
//       </Provider>
//     );

//     expect(wrapper.find(LoginContainer).length).to.equal(1);
//     const container = wrapper.find(LoginContainer);
//     expect(container.find(Login).length).to.equal(1);
//     expect(container.find(Login).props().auth).to.eql({ sport: 'BASKETBALL' });
//   });

//   it('should perform login', () => {
//     const loginStub = stub().withArgs({
//       username: 'abcd',
//       password: '1234',
//     });
//     const wrapper = mount(<Login
//       loginUser={loginStub}
//     />);
//     wrapper.find('button').simulate('click');
//     expect(loginStub.callCount).to.equal(1);
//   });
// });

// //XXXXXXXXXXXXXXXXX
// import React from "react"
// import ReactDOM from "react-dom"
// import { connect } from 'react-redux'
// import { addInputs, subtractInputs } from '../actions/calculatorActions'
// const mapStateToProps = (state) => ({
//   output: state.output
// })
// export class Home extends React.Component {
//   render() {
//     let IntegerA, IntegerB, IntegerC, IntegerD;
//     return (
//       <div className="container">
//         ......
//       ....
//       ..
//    </div>
//     );
//   }
// }
// export default connect(mapStateToProps)(Home)

// ...
// import configureStore from 'redux-mock-store'

// describe('>>>H O M E --- REACT-REDUX (Mount + wrapping in <Provider>)', () => {
//   const initialState = { output: 10 }
//   const mockStore = configureStore()
//   let store, wrapper

//   beforeEach(() => {
//     store = mockStore(initialState)
//     wrapper = mount(<Provider store={store}><ConnectedHome /></Provider>)
//   })


//   it('+++ render the connected(SMART) component', () => {
//     expect(wrapper.find(ConnectedHome).length).toEqual(1)
//   });

//   it('+++ check Prop matches with initialState', () => {
//     expect(wrapper.find(Home).prop('output')).toEqual(initialState.output)
//   });

//   it('+++ check action on dispatching ', () => {
//     let action
//     store.dispatch(addInputs(500))
//     store.dispatch(subtractInputs(100))
//     action = store.getActions()
//     expect(action[0].type).toBe("ADD_INPUTS")
//     expect(action[1].type).toBe("SUBTRACT_INPUTS")
//   });

// });

// describe('>>>H O M E --- REACT-REDUX (Shallow + passing the {store} directly)', () => {
//   const initialState = { output: 100 }
//   const mockStore = configureStore()
//   let store, container

//   beforeEach(() => {
//     store = mockStore(initialState)
//     container = shallow(<ConnectedHome store={store} />)
//   })

//   it('+++ render the connected(SMART) component', () => {
//     expect(container.length).toEqual(1)
//   });

//   it('+++ check Prop matches with initialState', () => {
//     expect(container.prop('output')).toEqual(initialState.output)
//   });

// });
