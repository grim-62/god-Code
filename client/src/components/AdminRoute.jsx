import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function AdminRoute() {
  const { user, initialized } = useSelector((state) => state.auth)

  if (!initialized) {
    return <main className="px-6 py-16 text-center text-sm text-slate-600">Loading account...</main>
  }

  if (!user) return <Navigate to="/login" replace />
  return user.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />
}