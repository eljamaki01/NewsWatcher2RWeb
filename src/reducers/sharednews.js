import update from 'immutability-helper';

const initialState = {
  isLoading: true,
  news: null
}

const news = (state = initialState, action) => {
  switch (action.type) {
    case 'REQUEST_SHAREDNEWS':
      return {
        isLoading: true,
        news: []
      }
    case 'RECEIVE_SHAREDNEWS_SUCCESS':
      return {
        // ...state,
        isLoading: false,
        news: action.news,
      }
    case 'ADD_COMMENT_SUCCESS':
      return {
        ...state,
        news: update(state.news, {
          [action.storyIdx]: {
            comments: {
              $push: [{ displayName: action.displayName, comment: action.comment }]
            }
          }
        })
      }
    default:
      return state
  }
}

export default news
