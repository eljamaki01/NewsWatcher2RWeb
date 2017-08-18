const initialState = {
  isLoading: true,
  news: null
}

const news = (state = initialState, action) => {
  switch (action.type) {
    case 'REQUEST_HOMENEWS':
      return {
        isLoading: true,
        news: []
      }
    case 'RECEIVE_HOMENEWS_SUCCESS':
      return {
        isLoading: false,
        news: action.news,
      }
    default:
      return state
  }
}

export default news
