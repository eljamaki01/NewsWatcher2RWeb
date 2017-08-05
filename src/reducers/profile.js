import update from 'immutability-helper';

const initialState = {
  isLoading: true,
  user: null
}

const news = (state = initialState, action) => {
  switch (action.type) {
    case 'RECEIVE_PROFILE_SUCCESS':
      return {
        // ...state,
        isLoading: false,
        user: action.user,
      }
    case 'ADD_FILTER':
      return {
        ...state,
        user: update(state.user, {
          newsFilters: {
            $push: [{
              name: 'New Filter',
              keyWords: ["Keyword"],
              keywordsStr: "Keyword",
              enableAlert: false,
              alertFrequency: 0,
              enableAutoDelete: false,
              deleteTime: 0,
              timeOfLastScan: 0
            }]
          }
        })
      }
    case 'DELETE_FILTER':
      return {
        ...state,
        user: update(state.user, {
          newsFilters: {
            $splice: [[action.selectedIdx, 1]]
          }
        })
      }
    case 'ALTER_FILTER_NAME':
      return {
        ...state,
        user: update(state.user, {
          newsFilters: {
            [action.filterIdx]: { name: { $set: action.value } }
          }
        })
      }
    case 'ALTER_FILTER_KEYWORDS':
      return {
        ...state,
        user: update(state.user, {
          newsFilters: {
            [action.filterIdx]: { keywordsStr: { $set: action.value }, keyWords: { $set: action.value.split(',') } }
          }
        })
      }
    default:
      return state
  }
}

export default news
