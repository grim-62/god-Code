import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance.js'

const initialState = {
  user: null,
  token: localStorage.getItem('god-code-token'),
  status: 'idle',
  error: null,
  initialized: false,
}

function getErrorMessage(error) {
  return error.response?.data?.message || 'Something went wrong. Please try again.'
}

function persistCredentials({ user, token }) {
  localStorage.setItem('god-code-token', token)
  return { user, token }
}

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return persistCredentials((await axiosInstance.post('/auth/login', credentials)).data)
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const register = createAsyncThunk('auth/register', async (details, { rejectWithValue }) => {
  try {
    return persistCredentials((await axiosInstance.post('/auth/register', details)).data)
  } catch (error) {
    return rejectWithValue(getErrorMessage(error))
  }
})

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  if (!localStorage.getItem('god-code-token')) {
    return rejectWithValue(null)
  }

  try {
    const { data } = await axiosInstance.get('/auth/me')
    return { user: data.user, token: localStorage.getItem('god-code-token') }
  } catch (error) {
    localStorage.removeItem('god-code-token')
    return rejectWithValue(getErrorMessage(error))
  }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('god-code-token')
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.token = action.payload.token
        state.status = 'authenticated'
        state.initialized = true
      })
      .addCase(login.rejected, (state, action) => {
        state.status = state.user ? 'authenticated' : 'unauthenticated'
        state.error = action.payload || 'Unable to sign in.'
        state.initialized = true
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.token = action.payload.token
        state.status = 'authenticated'
        state.initialized = true
      })
      .addCase(register.rejected, (state, action) => {
        state.status = state.user ? 'authenticated' : 'unauthenticated'
        state.error = action.payload || 'Unable to create your account.'
        state.initialized = true
      })
      .addCase(loadUser.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.token = action.payload.token
        state.status = 'authenticated'
        state.initialized = true
      })
      .addCase(loadUser.rejected, (state) => {
        state.user = null
        state.token = null
        state.status = 'unauthenticated'
        state.initialized = true
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.error = null
        state.status = 'unauthenticated'
        state.initialized = true
      })
  },
})

export const { clearAuthError } = authSlice.actions
export default authSlice.reducer