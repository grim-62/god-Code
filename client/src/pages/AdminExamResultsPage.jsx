import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance.js'

export default function AdminExamResultsPage() {
  const { id } = useParams()
  const [results, setResults] = useState([])
  const [expandedUser, setExpandedUser] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    axiosInstance.get(`/exams/${id}/results`)
      .then(({ data }) => { if (active) setResults(data.results || []) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Unable to load exam results.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-6 py-10">
      <Link className="text-sm font-medium text-emerald-800 hover:underline" to="/admin/exams">Admin exams</Link>
      <header className="mt-4 border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold text-emerald-700">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Exam results</h1>
      </header>
      {error && <p className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      <div className="admin-table-scroll mt-6 overflow-x-auto border-y border-slate-200" role="region" aria-label="Exam results table" tabIndex={0}>
        <table className="w-full min-w-200 border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-4 py-3">Participant</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Solved</th><th className="px-4 py-3">Started</th><th className="px-4 py-3">Violations</th><th className="px-4 py-3">Log</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td className="px-4 py-10 text-center text-slate-500" colSpan="6">Loading results...</td></tr>}
            {!loading && results.map((result) => (
              <>
                <tr key={result.user._id}>
                  <td className="px-4 py-3"><p className="font-medium text-slate-900">{result.user.name}</p><p className="text-xs text-slate-500">{result.user.email}</p></td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{result.score}</td>
                  <td className="px-4 py-3 tabular-nums">{result.solved}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{new Date(result.startedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 tabular-nums">{result.violationCount}</td>
                  <td className="px-4 py-3"><button className="text-sm font-semibold text-emerald-800 hover:underline" type="button" onClick={() => setExpandedUser((current) => current === result.user._id ? '' : result.user._id)}>{expandedUser === result.user._id ? 'Hide log' : 'View log'}</button></td>
                </tr>
                {expandedUser === result.user._id && <tr key={`${result.user._id}-log`}><td className="bg-slate-50 px-4 py-4" colSpan="6"><ul className="space-y-2 text-xs text-slate-600">{result.violations.map((violation, index) => <li className="flex flex-wrap justify-between gap-3" key={`${violation.occurredAt}-${index}`}><span>{violation.type}</span><time>{new Date(violation.occurredAt).toLocaleString()}</time></li>)}{!result.violations.length && <li>No violations recorded.</li>}</ul></td></tr>}
              </>
            ))}
            {!loading && !error && results.length === 0 && <tr><td className="px-4 py-10 text-center text-slate-500" colSpan="6">No participants yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  )
}