import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
      <p className="font-semibold text-emerald-700">god-code</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">Page not found</h1>
      <Link className="mt-6 w-fit text-sm font-semibold text-emerald-800 underline" to="/">
        Return home
      </Link>
    </main>
  )
}