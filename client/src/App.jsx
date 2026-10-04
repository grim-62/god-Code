import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { loadUser } from './features/auth/authSlice.js'
import AppRoutes from './routes/AppRoutes.jsx'

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(loadUser())
  }, [dispatch])

  return <AppRoutes />
}