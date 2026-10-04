import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ProtectedRoute() {
  const location = useLocation()
  const { user, initialized } = useSelector((state) => state.auth)

  if (!initialized) {
    return <main className="px-6 py-16 text-center text-sm text-slate-600">Loading account...</main>
  }

  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}