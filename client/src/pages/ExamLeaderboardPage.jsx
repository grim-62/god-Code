import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance.js'

export default function ExamLeaderboardPage() {
  const { id } = useParams()
  const [exam, setExam] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([axiosInstance.get(`/exams/${id}`), axiosInstance.get(`/exams/${id}/leaderboard`)])
      .then(([examResponse, leaderboardResponse]) => {
        if (!active) return
        setExam(examResponse.data.exam)
        setLeaderboard(leaderboardResponse.data.leaderboard || [])
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load the leaderboard.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-5xl px-6 py-10">
      <Link className="text-sm font-medium text-emerald-800 hover:underline" to="/exams">All exams</Link>
      <header className="mt-4 border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold text-emerald-700">Standings</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{exam?.title || 'Leaderboard'}</h1>
      </header>
      {error && <p className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      <div className="mt-6 overflow-x-auto border-y border-slate-200">
        <table className="w-full min-w-150 border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="w-20 px-4 py-3">Rank</th><th className="px-4 py-3">Participant</th><th className="px-4 py-3 text-right">Solved</th><th className="px-4 py-3 text-right">Score</th><th className="px-4 py-3 text-right">Solve time</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td className="px-4 py-10 text-center text-slate-500" colSpan="5">Loading standings...</td></tr>}
            {!loading && !error && leaderboard.map((entry) => (
              <tr className={entry.rank === 1 ? 'bg-emerald-50/60' : ''} key={entry.userId}>
                <td className="px-4 py-3 font-semibold tabular-nums text-slate-500">{entry.rank}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{entry.name}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{entry.solved}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-950">{entry.score}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{Math.floor(entry.tieBreakTimeMs / 60000)} min</td>
              </tr>
            ))}
            {!loading && !error && leaderboard.length === 0 && <tr><td className="px-4 py-10 text-center text-slate-500" colSpan="5">No participants have started this exam.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  )
}