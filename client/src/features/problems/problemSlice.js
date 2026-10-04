import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance.js'

function getErrorMessage(error) {
  return error.response?.data?.message || 'Unable to load problems. Please try again.'
}

export const fetchProblems = createAsyncThunk(
  'problems/fetchProblems',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '' && value != null),
      )
      const { data } = await axiosInstance.get('/problems', { params })
      return data
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  },
)

export const fetchProblemBySlug = createAsyncThunk(
  'problems/fetchProblemBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/problems/${encodeURIComponent(slug)}`)
      return data.problem
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  },
)

const initialState = {
  problems: [],
  tags: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  selectedProblem: null,
  listStatus: 'idle',
  detailStatus: 'idle',
  error: null,
  detailError: null,
}

const problemSlice = createSlice({
  name: 'problems',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchProblems.pending, (state) => {
        state.listStatus = 'loading'
        state.error = null
      })
      .addCase(fetchProblems.fulfilled, (state, action) => {
        state.problems = action.payload.problems
        state.tags = action.payload.tags
        state.pagination = action.payload.pagination
        state.listStatus = 'succeeded'
      })
      .addCase(fetchProblems.rejected, (state, action) => {
        state.listStatus = 'failed'
        state.error = action.payload || 'Unable to load problems.'
      })
      .addCase(fetchProblemBySlug.pending, (state) => {
        state.detailStatus = 'loading'
        state.detailError = null
        state.selectedProblem = null
      })
      .addCase(fetchProblemBySlug.fulfilled, (state, action) => {
        state.selectedProblem = action.payload
        state.detailStatus = 'succeeded'
      })
      .addCase(fetchProblemBySlug.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.detailError = action.payload || 'Unable to load this problem.'
      })
  },
})

export default problemSlice.reducer