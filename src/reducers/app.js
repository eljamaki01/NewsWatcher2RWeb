const initialState = {
  loggedIn: false,
  session: null,
  currentMsg: ""
}

const appLevel = (state = initialState, action) => {
  switch (action.type) {
    case 'MSG_DISPLAY':
      return {
        ...state,
        currentMsg: action.msg
      }
    case 'RECEIVE_TOKEN_SUCCESS':
      return {
        ...state,
        loggedIn: true,
        session: action.session,
        currentMsg: action.msg
      }
    case 'DELETE_TOKEN_SUCCESS':
      return {
        ...state,
        loggedIn: false,
        session: null,
        currentMsg: action.msg
      }
    default:
      return state
  }
}

export default appLevel
