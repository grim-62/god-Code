import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { clearAuthError, login } from '../features/auth/authSlice.js'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, status, error } = useSelector((state) => state.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const isLoading = status === 'loading'

  if (user) return <Navigate to="/account" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    dispatch(clearAuthError())
    try {
      await dispatch(login({ email, password })).unwrap()
      navigate('/account', { replace: true })
    } catch {
      // The rejected thunk exposes its message through the auth state.
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-5xl items-center px-6 py-12">
      <section className="mx-auto w-full max-w-md">
        <p className="text-sm font-semibold text-emerald-700">god-code account</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in with your email and password.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          <button className="w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          New to god-code? <Link className="font-semibold text-emerald-800 underline" to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  )
}