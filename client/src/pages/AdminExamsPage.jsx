import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance.js'
import Toast from '../components/Toast.jsx'

function getExamStatus(exam, now) {
  const start = new Date(exam.startTime).getTime()
  const end = new Date(exam.endTime).getTime()
  if (now < start) return 'Upcoming'
  if (now < end) return 'Live'
  return 'Past'
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState([])
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'scheduled' | 'concluded'
  const [searchInput, setSearchInput] = useState('')
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  async function loadExams() {
    setLoading(true)
    try {
      const { data } = await axiosInstance.get('/exams')
      setExams(data.exams || [])
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load exams.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExams()
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  async function deleteExam(exam) {
    if (!window.confirm(`Delete exam "${exam.title}"? This cannot be undone.`)) return
    setDeletingId(exam._id)
    try {
      await axiosInstance.delete(`/exams/${exam._id}`)
      setToast(`Exam "${exam.title}" deleted.`)
      await loadExams()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete this exam.')
    } finally {
      setDeletingId(null)
    }
  }

  const counts = useMemo(() => {
    let scheduled = 0
    let concluded = 0
    exams.forEach((exam) => {
      const status = getExamStatus(exam, now)
      if (status === 'Upcoming' || status === 'Live') scheduled++
      else concluded++
    })
    return {
      all: exams.length,
      scheduled,
      concluded,
    }
  }, [exams, now])

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const status = getExamStatus(exam, now)
      if (activeFilter === 'scheduled' && status !== 'Upcoming' && status !== 'Live') return false
      if (activeFilter === 'concluded' && status !== 'Past') return false

      if (searchInput.trim()) {
        const q = searchInput.toLowerCase()
        const titleMatch = exam.title.toLowerCase().includes(q)
        const idMatch = exam._id.toLowerCase().includes(q)
        return titleMatch || idMatch
      }
      return true
    })
  }, [exams, activeFilter, searchInput, now])

  return (
    <main className="w-full bg-surface min-h-[calc(100vh-56px)] text-on-surface">
      <Toast message={toast} onClose={() => setToast('')} />

      {/* Cluster Health Top Notification Bar */}
      <div className="bg-surface-container-low px-4 md:px-margin-desktop py-space-sm flex items-center justify-between text-on-surface-variant font-body-sm text-xs border-b border-surface-container-highest">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs font-label-code-sm text-label-code-sm text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
            <span>SANDBOX CLUSTER US-EAST-01</span>
          </div>
          <span className="text-surface-container-highest">/</span>
          <span className="font-label-code-sm text-label-code-sm text-on-surface-variant hidden sm:inline">
            gVisor runtime active
          </span>
          <span className="text-surface-container-highest hidden sm:inline">/</span>
          <span className="font-label-code-sm text-label-code-sm text-on-surface">
            Judge0 worker synced
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-space-md font-label-code-sm text-label-code-sm">
          <span className="text-on-surface-variant">
            Isolation: <span className="text-primary font-medium">Deterministic</span>
          </span>
          <span className="text-surface-container-highest">|</span>
          <span className="text-on-surface-variant">
            Proctor Sync: <span className="text-secondary font-medium">Nominal</span>
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-margin-desktop pt-space-xl pb-space-lg flex flex-col gap-space-xl">
        {/* Breadcrumb & Control Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs font-label-code-sm text-label-code-sm text-secondary tracking-widest uppercase">
              <span className="material-symbols-outlined text-[14px]">terminal</span>
              <span>ADMINISTRATION / EXAM DISPATCHER</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
              Contest &amp; Exam Management
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Schedule timed competitive tracks, configure hidden test harnesses, and monitor candidate code virtualization heuristics in real-time.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <Link
              to="/admin/problems"
              className="flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-container-highest font-body-md text-body-md transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">code</span>
              <span>Manage Problems</span>
            </Link>
            <Link
              to="/admin/exams/new"
              className="flex items-center gap-space-xs px-space-lg py-2 rounded-lg bg-primary-container text-surface-container-lowest font-headline-sm text-headline-sm font-semibold hover:bg-secondary transition-all shadow-[0_0_16px_rgba(0,245,160,0.25)]"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>New Exam</span>
            </Link>
          </div>
        </div>

        {/* Bento Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Card 1 */}
          <div className="bg-surface-container-low border border-surface-container-highest p-space-md rounded-xl flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
              <span>Active &amp; Scheduled</span>
              <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface flex items-baseline gap-space-xs font-semibold">
                <span>{counts.scheduled}</span>
                <span className="font-label-code-md text-label-code-md text-secondary">Tracks</span>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container inline-block"></span>
                <span>{counts.all} total sprint records</span>
              </div>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div
                className="bg-primary-container h-full transition-all duration-500"
                style={{ width: `${(counts.scheduled / Math.max(counts.all, 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-low border border-surface-container-highest p-space-md rounded-xl flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
              <span>Candidate Dispatch</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary">groups</span>
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface flex items-baseline gap-space-xs font-semibold">
                <span>Open Entry</span>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Rated for all registered developers
              </div>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-secondary h-full w-full"></div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-low border border-surface-container-highest p-space-md rounded-xl flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
              <span>Compute Sandbox</span>
              <span className="material-symbols-outlined text-[16px] text-primary">memory</span>
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface flex items-baseline gap-space-xs font-semibold">
                <span>Judge0 Daemon</span>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1 font-label-code-sm text-label-code-sm flex items-center justify-between">
                <span>2 vCPU pinned</span>
                <span>256MB cap</span>
              </div>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-primary-container h-full w-full"></div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-surface-container-low border border-surface-container-highest p-space-md rounded-xl flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
              <span>Integrity Heuristic</span>
              <span className="material-symbols-outlined text-[16px] text-secondary">security</span>
            </div>
            <div className="my-space-sm">
              <div className="font-headline-lg text-headline-lg text-on-surface flex items-baseline gap-space-xs font-semibold">
                <span>AST Active</span>
                <span className="font-label-code-md text-label-code-md text-secondary">0 Flags</span>
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Real-time paste &amp; tab blur audit
              </div>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
              <div className="bg-primary-container h-full w-full"></div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-surface-container-low border border-surface-container-highest p-space-md rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md shadow-xs">
          {/* Tabs */}
          <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-surface-container-highest">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-space-md py-1.5 rounded-lg font-label-code-sm text-label-code-sm font-medium transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-surface-container text-primary-container shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('scheduled')}
              className={`px-space-md py-1.5 rounded-lg font-label-code-sm text-label-code-sm font-medium transition-colors cursor-pointer ${
                activeFilter === 'scheduled'
                  ? 'bg-surface-container text-primary-container shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Scheduled ({counts.scheduled})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('concluded')}
              className={`px-space-md py-1.5 rounded-lg font-label-code-sm text-label-code-sm font-medium transition-colors cursor-pointer ${
                activeFilter === 'concluded'
                  ? 'bg-surface-container text-primary-container shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Concluded ({counts.concluded})
            </button>
          </div>

          {/* Search */}
          <div className="flex flex-1 max-w-md items-center gap-space-sm">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                className="w-full bg-surface-container pl-10 pr-4 py-2 rounded-lg text-on-surface placeholder:text-on-surface-variant/60 font-body-sm text-body-sm outline-none border border-transparent focus:border-surface-container-highest focus:bg-surface-container-high transition-all"
                placeholder="Filter by title or ID..."
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="text-xs text-on-surface-variant hover:text-on-surface px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-space-md rounded-xl bg-error-container/20 border border-error-container text-error font-body-md text-body-md">
            {error}
          </div>
        )}

        {/* Exams Table Surface */}
        <section className="bg-surface-container-low border border-surface-container-highest rounded-xl overflow-hidden shadow-xl flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-12 px-space-lg py-space-sm bg-surface-container font-label-caps text-label-caps text-on-surface-variant tracking-wider uppercase items-center border-b border-surface-container-highest select-none">
            <div className="col-span-5 sm:col-span-4">Exam Specification</div>
            <div className="col-span-4 sm:col-span-3">Schedule Window</div>
            <div className="hidden sm:block sm:col-span-2">Duration &amp; Problems</div>
            <div className="col-span-3 sm:col-span-3 text-right">Actions</div>
          </div>

          {/* Body */}
          <div className="flex flex-col divide-y divide-surface-container-highest/40">
            {loading && (
              <div className="py-16 text-center text-on-surface-variant font-body-md flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-secondary animate-spin">
                  refresh
                </span>
                <span>Loading exam configurations...</span>
              </div>
            )}

            {!loading && filteredExams.length === 0 && !error && (
              <div className="py-16 text-center text-on-surface-variant font-body-md flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">
                  assignment_late
                </span>
                <span>No exams match the selected filter criteria.</span>
              </div>
            )}

            {!loading &&
              filteredExams.map((exam) => {
                const status = getExamStatus(exam, now)
                return (
                  <div
                    key={exam._id}
                    className="grid grid-cols-12 px-space-lg py-space-md hover:bg-surface-container transition-colors items-center group"
                  >
                    {/* Exam Title & ID */}
                    <div className="col-span-5 sm:col-span-4 flex flex-col pr-space-sm min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/exams/${exam._id}/edit`}
                          className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors truncate font-medium"
                        >
                          {exam.title}
                        </Link>
                        <span
                          className={`font-label-caps text-label-caps px-1.5 py-0.2 rounded uppercase font-semibold text-[10px] shrink-0 ${
                            status === 'Live'
                              ? 'bg-error-container/20 text-error border border-error/30'
                              : status === 'Upcoming'
                              ? 'bg-primary-container/10 text-primary-container border border-primary-container/20'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                      <span className="font-label-code-sm text-label-code-sm text-on-surface-variant/70 truncate">
                        ID: {exam._id}
                      </span>
                    </div>

                    {/* Schedule */}
                    <div className="col-span-4 sm:col-span-3 text-xs font-label-code-sm text-on-surface-variant">
                      <p className="text-on-surface font-medium">
                        {new Date(exam.startTime).toLocaleDateString()}
                      </p>
                      <p className="text-outline">
                        {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        –{' '}
                        {new Date(exam.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Duration & Problems */}
                    <div className="hidden sm:flex sm:col-span-2 flex-col font-label-code-sm text-label-code-sm text-on-surface-variant">
                      <span className="text-on-surface font-medium">{exam.duration} Minutes</span>
                      <span className="text-outline">{exam.problems?.length || 0} benchmarks</span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 sm:col-span-3 flex items-center justify-end gap-space-xs">
                      <Link
                        to={`/admin/exams/${exam._id}/results`}
                        className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface font-body-sm text-xs flex items-center gap-1 transition-colors"
                        title="View exam submissions & leaderboard"
                      >
                        <span className="material-symbols-outlined text-[14px]">leaderboard</span>
                        <span className="hidden md:inline">Results</span>
                      </Link>
                      <Link
                        to={`/admin/exams/${exam._id}/edit`}
                        className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface font-body-sm text-xs flex items-center gap-1 transition-colors"
                        title="Edit exam parameters"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        <span className="hidden md:inline">Edit</span>
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === exam._id}
                        onClick={() => deleteExam(exam)}
                        className="px-2.5 py-1 rounded bg-error-container/15 hover:bg-error-container/30 border border-error-container/40 text-error font-body-sm text-xs flex items-center gap-1 disabled:opacity-50 transition-colors cursor-pointer"
                        title="Delete exam"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        <span className="hidden md:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>
      </div>
    </main>
  )
}