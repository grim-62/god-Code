import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axiosInstance from '../api/axiosInstance.js'

const difficulties = ['Easy', 'Medium', 'Hard']

function heatColor(count) {
  if (count === 0) return 'bg-slate-100'
  if (count <= 2) return 'bg-emerald-200'
  if (count <= 5) return 'bg-emerald-400'
  if (count <= 9) return 'bg-emerald-600'
  return 'bg-emerald-800'
}

function ProfileSkeleton() {
  return (
    <main className="mx-auto max-w-6xl animate-pulse px-6 py-10">
      <div className="h-8 w-56 rounded bg-slate-200" />
      <div className="mt-7 h-24 rounded bg-slate-100" />
      <div className="mt-7 grid gap-8 lg:grid-cols-2">
        <div className="h-64 rounded bg-slate-100" />
        <div className="h-64 rounded bg-slate-100" />
      </div>
    </main>
  )
}

export default function ProfilePage() {
  const user = useSelector((state) => state.auth.user)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    axiosInstance.get('/users/me/stats')
      .then(({ data }) => {
        if (active) setStats(data)
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load your profile stats.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  if (loading) return <ProfileSkeleton />

  if (error) {
    return <main className="mx-auto max-w-6xl px-6 py-10"><p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p></main>
  }

  const solvedByDifficulty = stats?.solvedByDifficulty || { Easy: 0, Medium: 0, Hard: 0 }
  const availableByDifficulty = stats?.availableByDifficulty || { Easy: 0, Medium: 0, Hard: 0 }
  const dailyCounts = stats?.dailySubmissionCounts || []

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-6 py-10">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold text-emerald-700">Your activity</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{user?.name || 'Profile'}</h1>
        <p className="mt-2 text-sm text-slate-600">{user?.email}</p>
      </header>

      <section className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200 py-6 md:grid-cols-4" aria-label="Account statistics">
        <div className="px-4 first:pl-0"><p className="text-xs font-medium text-slate-500">Problems solved</p><p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{stats?.totalSolved || 0}</p></div>
        <div className="px-4"><p className="text-xs font-medium text-slate-500">Submissions</p><p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{stats?.totalSubmissions || 0}</p></div>
        <div className="px-4"><p className="text-xs font-medium text-slate-500">Acceptance rate</p><p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950">{stats?.acceptanceRate || 0}<span className="ml-0.5 text-base">%</span></p></div>
        <div className="px-4"><p className="text-xs font-medium text-slate-500">Member since</p><p className="mt-2 text-base font-semibold text-slate-950">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}</p></div>
      </section>

      <div className="grid gap-10 border-b border-slate-200 py-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section>
          <h2 className="text-base font-semibold text-slate-950">Solved by difficulty</h2>
          <div className="mt-5 space-y-5">
            {difficulties.map((difficulty) => {
              const solved = solvedByDifficulty[difficulty] || 0
              const available = availableByDifficulty[difficulty] || 0
              const percent = available ? Math.min(100, (solved / available) * 100) : 0
              const color = difficulty === 'Easy' ? 'bg-emerald-600' : difficulty === 'Medium' ? 'bg-amber-500' : 'bg-rose-600'

              return (
                <div key={difficulty}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{difficulty}</span>
                    <span className="tabular-nums text-slate-600">{solved} <span className="text-slate-400">/ {available}</span></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${difficulty} solved`} aria-valuemin="0" aria-valuemax={available} aria-valuenow={solved}>
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-950">Submission activity</h2>
            <p className="text-xs text-slate-500">Daily submissions · last 365 days</p>
          </div>
          <div className="mt-5 overflow-x-auto pb-2">
            <div className="grid h-29 w-max grid-flow-col grid-rows-7 gap-1" style={{ gridAutoColumns: '12px' }} aria-label="Daily submission heatmap">
              {dailyCounts.map(({ date, count }) => (
                <span className={`size-3 rounded-[3px] ${heatColor(count)}`} key={date} title={`${date}: ${count} ${count === 1 ? 'submission' : 'submissions'}`} aria-label={`${date}: ${count} submissions`} />
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] text-slate-500">
            <span>Less</span><span className="size-3 rounded-[3px] bg-slate-100" /><span className="size-3 rounded-[3px] bg-emerald-200" /><span className="size-3 rounded-[3px] bg-emerald-400" /><span className="size-3 rounded-[3px] bg-emerald-600" /><span className="size-3 rounded-[3px] bg-emerald-800" /><span>More</span>
          </div>
        </section>
      </div>

      <section className="py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">Recent submissions</h2>
          <span className="text-xs text-slate-500">Latest 10</span>
        </div>
        <div className="mt-4 overflow-x-auto border-y border-slate-200">
          <table className="w-full min-w-170 border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr><th className="px-4 py-3">Problem</th><th className="px-4 py-3">Verdict</th><th className="px-4 py-3">Language</th><th className="px-4 py-3 text-right">Runtime</th><th className="px-4 py-3 text-right">Time</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentSubmissions?.map((submission) => (
                <tr className="hover:bg-slate-50" key={submission._id}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {submission.problem?.slug
                      ? <Link className="hover:text-emerald-800" to={`/problems/${encodeURIComponent(submission.problem.slug)}`}>{submission.problem.title}</Link>
                      : 'Problem unavailable'}
                  </td>
                  <td className={`px-4 py-3 text-xs font-semibold ${submission.verdict === 'Accepted' ? 'text-emerald-700' : submission.verdict === 'Pending' ? 'text-amber-700' : 'text-rose-700'}`}>{submission.verdict}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{submission.language}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">{submission.runtimeMs} ms</td>
                  <td className="px-4 py-3 text-right text-slate-500">{new Date(submission.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!stats?.recentSubmissions?.length && <tr><td className="px-4 py-8 text-center text-sm text-slate-500" colSpan="5">No submissions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}