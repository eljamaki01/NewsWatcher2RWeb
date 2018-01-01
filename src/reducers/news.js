const initialState = {
  isLoading: true,
  newsFilters: null
}

const news = (state = initialState, action) => {
  switch (action.type) {
    case 'REQUEST_NEWS':
      return {
        isLoading: true,
        newsFilters: []
      }
    case 'RECEIVE_NEWS_SUCCESS':
      return {
        isLoading: false,
        newsFilters: action.newsFilters,
      }
    default:
      return state
  }
}

export default news
