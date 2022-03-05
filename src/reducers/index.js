import { combineReducers } from 'redux'
import app from './app'
import homenews from './homenews'

const rootReducer = combineReducers({
  app,
  homenews
})

export default rootReducer