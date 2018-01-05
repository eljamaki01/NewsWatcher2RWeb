// import React from 'react';
// import ReactDOM from 'react-dom';
// import { shallow } from 'enzyme';
// import { createStore } from 'redux'
// import { Provider } from 'react-redux'
// import reducer from './reducers'
// import LoginView from './views/loginview';

// const store = createStore(reducer);

// const Hello = props => {
//   return <p>Hello, {props.name}!</p>;
// };

// describe('<LoginView />', () => {
//   it('has a link to sign up', () => {
//     const wrapper = shallow(<LoginView />);
//     expect(wrapper.find('a').text()).toEqual('Sign Up');
//   });

//   it('Has an email entry field', () => {
//     wrapper = shallow(<Timeline />);
//     expect(wrapper.find('.formControlsEmail2').length).toEqual(1);
//   });

//   it('sets the props', () => {
//     const wrapper = mount(<Foo bar="baz" />);
//     expect(wrapper.props().bar).to.equal('baz');
//     wrapper.setProps({ bar: 'foo' });
//     expect(wrapper.props().bar).to.equal('foo');
//   });

//   it('changes the remember me check box', () => {
//     const onButtonClick = sinon.spy();
//     const wrapper = mount((
//       <Foo onButtonClick={onButtonClick} />
//     ));
//     to get the wrapped contained component
//     let hnv = wrapper.find(HomeNewsView);
//     grab topen from props after sign in
//     do I move the login and register fcns out to the app parent? Makes testing work?

//     expect(wrapper.state("remeberMe")).to.equal(false);
//     expect(wrapper.state().remeberMe).to.equal(false);
//     wrapper.find('Checkbox').simulate('click');
//     // wrapper.find('Checkbox').simulate('change');
//     expect(onButtonClick).to.have.property('callCount', 1);
//     expect(wrapper.state().remeberMe).to.equal(true);
//   });

//   it('changes the email value', () => {
//     const onButtonClick = sinon.spy();
//     const wrapper = mount((
//       <Foo onButtonClick={onButtonClick} />
//     ));
//     expect(wrapper.state().email).to.equal("");
//     wrapper.find('button').simulate('click');
//     expect(onButtonClick).to.have.property('callCount', 1);
//     expect(wrapper.state().email).to.equal("eb@eb.com");
//   });
// });
// //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
// ReactDOM.render(
//   <Provider store={store}>
//     <App />
//   </Provider>, document.getElementById('root')
// );

// // for spy to override the HTTP call hopefully!
// it('calls componentDidMount', () => {
//   sinon.spy(Foo.prototype, 'componentDidMount');
//   const wrapper = mount(<Foo />);
//   expect(Foo.prototype.componentDidMount).to.have.property('callCount', 1);
//   Foo.prototype.componentDidMount.restore();
// });

// //XXXXXXXXXXXXX
// render: jest.fn().mockReturnValue('component is rendered'),
//   render: jest.fn().mockImplementation(() => 'mock implementation'),

//     sinon.spy(Foo.prototype, 'componentDidMount');
// sinon.spy(Foo.prototype, 'componentDidMount').returns(42);
// sinon.stub(Foo.prototype, 'componentDidMount').returns(42);
// var callback = sinon.stub().returns(42);

// //XXXXXXXXXXXXXXXXX
// //Using a setup to DRY

// const setup = propOverrides => {
//   const props = Object.assign({
//     completedCount: 0,
//     activeCount: 0,
//     onClearCompleted: jest.fn(),
//   }, propOverrides)

//   const wrapper = shallow(<Footer {...props} />)

//   return {
//     props,
//     wrapper,
//     clear: wrapper.find('.clear-completed'),
//     count: wrapper.find('.todo-count'),
//   }
// }

// describe('count', () => {
//   test('when active count 0', () => {
//     const { count } = setup({ activeCount: 0 })
//     expect(count.text()).toEqual('No items left')
//   })

//   test('when active count above 0', () => {
//     const { count } = setup({ activeCount: 1 })
//     expect(count.text()).toEqual('1 item left')
//   })
// });

// //XXXXXXXXXXXXXXX
// it('should render 4 list items based on props.items', () => {
//   const component = mount(<List items={items} />)

//   expect(component.find('li')).toHaveLength(4)
// })

// //XXXXXXXXXXX
// expect(wrapper.props().email).to.be.defined;

// //XXXXXXXXXXX
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
//   setLocalStorage: function() {
//       global.localStorage = {
//           getItem: function (key) {
//               return this[key];
//           },
//           setItem: function (key, value) {
//               this[key] = value;
//           },
//           removeItem: function (key) {
//               delete this[key];
//           }
//       };

//       const jwt = require('jsonwebtoken');
//       const token = jwt.sign({ foo: 'bar', exp: Math.floor(Date.now() / 1000) + 3000 }, 'shhhhh');
//       localStorage.setItem('id_token', token);
//   }
// };

// beforeAll(() => {
//   const ls = require("../../utils/localStorage.js");
//   ls.setLocalStorage();
// });

// //XXXXXXXXXXXXXXXXXXXXXX
// //Redux testing
// should be able to call store,dispatch!!! Or maybe not as good!
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

// function questionsReducer (state = [], action) {
//   switch(action.type) {
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

// describe('Reducer::Question', function(){
//   it('returns an empty array as default state', function(){
//     // setup
//     let action = { type: 'unknown' };

//     // execute
//     let newState = questionReducer(undefined, { type: 'unknown' });

//     // verify
//     expect(newState).to.deep.equal([]);
//   });

//   describe('on LOADED_QUESTIONS', function(){
//     it('returns the <code>response</code> in given action', function(){
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
// describe( 'Stateful reducers', function () {
//   it( 'should correctly block requests', function () {
//       const server = new Server( 500 )
//       const initialState = {blocked: false}
//       const store = createStore( function ( state, action ) {
//           return {
//               blocked: server.blocked( state, action ),
//           }
//       }, initialState )
//       server.setStore( store )

//       const wrapper = mount( <ClientWrapper server={server} store={store}/> )

//       expect( wrapper.find( 'button' ).prop( 'disabled' ) ).to.be.false

//       wrapper.find( 'button' ).simulate( 'click' )

//       wrapper.update()

//       expect( wrapper.find( 'button' ).prop( 'disabled' ) ).to.be.true

//       // simulate the server timeout update
//       store.dispatch( {type: Server.REQUESTS_ENABLED} )

//       wrapper.update()

//       expect( wrapper.find( 'button' ).prop( 'disabled' ) ).to.be.false
//   } )
// } )

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
//     let subject; // mocked component
//     let resposeState; // to test response state

//     beforeEach(() => {
//         const store = createStore(reducer)

//         const returnState = (state) => {
//             resposeState = state;
//             return state;
//         }

//         subject = mount(
//             <Provider store={store} >
//                 <Postcode onSubmit={returnState} />
//             </Provider>
//         )
//     })

//     it('shows title', () => {
//         expect(subject.text()).to.have.string('Postcode');
//     });

//     it('has postcode field', () => {
//         expect(subject.find('input[name="postcode"]')).to.have.length.of(1)
//     });

//     it('goest to NEXT_STEP when submit', () => {
//         const form = subject.find('form')
//         form.simulate('submit')
//         expect(resposeState.step).to.equal('NEXT_STEP')
//     });
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
//     <MyContainer/>
//   </Provider>
// const myContainer = wrapper.dive();

// //XXXXXXXXXXXXX
// // app/src/components/Login.js
// import React from 'react'
// import { connect } from 'react-redux'
// import { loginUser } from '../actions/users'
// class Login extends React.Component {
// constructor() {
//   super()
//   this.state = {
//    username: '',
//    password: ''
//   }
//  }
// handleInputChange = (event) => {
//   this.setState({
//    [event.target.name]: event.target.value
//   })
//  }
// handleSubmit = (event) => {
//   event.preventDefault()
//   this.props.login(this.state)
//  }
// render() {
//   return (
//    <form id='loginForm' className='login' onSubmit={this.handleSubmit}>
//     <label>Username</label>
//     <input id='email' onChange={this.handleInputChange} name='email' type='text' />
//     <label>Password</label>
//     <input id='password' onChange={this.handleInputChange} name='password' type='password' />
//     <button>Submit</button>
//    </form>
//   )
//  }
// }
// function mapDispatchToProps(dispatch) {
//  return {
//   login: (userparams, history) => {
//    dispatch(loginUser(userparams, history))
//   }
//  }
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

//  wrapper = shallow(<Login store={store}/>)
//                         OR
// // not suggested
// wrapper = mount(<Provider store={store}<Login /></Provider>)
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

//   render () {
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
// import {Provider} from 'react-redux';
// import {mount, shallow} from 'enzyme';
// import {expect} from 'chai';
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
//   wrapper.find('button').simulate('click');
//   expect(loginStub.callCount).to.equal(1);
//   });
// });

// //XXXXXXXXXXXXXXXXX
// import React from "react"
// import ReactDOM from "react-dom"
// import {connect} from 'react-redux'
// import {addInputs, subtractInputs} from '../actions/calculatorActions'
// const mapStateToProps = (state) => ({
//   output:state.output
// })
// export class Home extends React.Component{
//  render(){
//   let IntegerA,IntegerB,IntegerC,IntegerD;
// return(
//    <div className="container">
//       ...... 
//       ....
//       ..
//    </div>
//   );
//  }
// }
// export default connect(mapStateToProps)(Home)

// ...ABC
// import configureStore from 'redux-mock-store'

// describe('>>>H O M E --- REACT-REDUX (Mount + wrapping in <Provider>)',()=>{
//   const initialState = {output:10}
//   const mockStore = configureStore()
//   let store,wrapper

//   beforeEach(()=>{
//       store = mockStore(initialState)
//       wrapper = mount( <Provider store={store}><ConnectedHome /></Provider> )
//   })


//   it('+++ render the connected(SMART) component', () => {
//      expect(wrapper.find(ConnectedHome).length).toEqual(1)
//   });

//   it('+++ check Prop matches with initialState', () => {
//      expect(wrapper.find(Home).prop('output')).toEqual(initialState.output)
//   });

//   it('+++ check action on dispatching ', () => {
//       let action
//       store.dispatch(addInputs(500))
//       store.dispatch(subtractInputs(100))
//       action = store.getActions()
//       expect(action[0].type).toBe("ADD_INPUTS")
//       expect(action[1].type).toBe("SUBTRACT_INPUTS")
//   });

// });

// describe('>>>H O M E --- REACT-REDUX (Shallow + passing the {store} directly)',()=>{
//   const initialState = {output:100}
//   const mockStore = configureStore()
//   let store,container

//   beforeEach(()=>{
//       store = mockStore(initialState)
//       container = shallow(<ConnectedHome store={store} /> )  
//   })

//   it('+++ render the connected(SMART) component', () => {
//      expect(container.length).toEqual(1)
//   });

//   it('+++ check Prop matches with initialState', () => {
//      expect(container.prop('output')).toEqual(initialState.output)
//   });

// });
