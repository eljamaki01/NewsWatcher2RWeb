import { combineReducers } from 'redux'
import app from './app'
import homenews from './homenews'
import news from './news'
import sharednews from './sharednews'
import profile from './profile'

const rootReducer = combineReducers({
  app,
  homenews,
  news,
  sharednews,
  profile
})

export default rootReducer