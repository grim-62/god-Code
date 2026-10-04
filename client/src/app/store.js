import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice.js'
import problemReducer from '../features/problems/problemSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    problems: problemReducer,
  },
})