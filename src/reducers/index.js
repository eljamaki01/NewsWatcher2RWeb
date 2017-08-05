import { combineReducers } from 'redux'
import app from './app'
import news from './news'
import sharednews from './sharednews'
import profile from './profile'

const rootReducer = combineReducers({
  app,
  news,
  sharednews,
  profile
})

export default rootReducer