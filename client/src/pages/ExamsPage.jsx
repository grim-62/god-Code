import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance.js'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'live', label: 'Live' },
  { id: 'past', label: 'Past Sprints' },
]

function getExamStatus(exam, now) {
  const start = new Date(exam.startTime).getTime()
  const end = new Date(exam.endTime).getTime()
  if (now < start) return 'Upcoming'
  if (now < end) return 'Live'
  return 'Past'
}

function formatCountdown(targetMs, now) {
  const diff = Math.max(0, targetMs - now)
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n) => String(n).padStart(2, '0')
  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    isFinished: diff === 0,
  }
}

export default function ExamsPage() {
  const [exams, setExams] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 1-second interval for real-time countdown clocks
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let isMounted = true
    axiosInstance
      .get('/exams')
      .then(({ data }) => {
        if (isMounted) setExams(data.exams || [])
      })
      .catch((err) => {
        if (isMounted) setError(err.response?.data?.message || 'Unable to load contests and exams.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Tab counts
  const counts = useMemo(() => {
    let upcoming = 0
    let live = 0
    let past = 0
    exams.forEach((exam) => {
      const status = getExamStatus(exam, now)
      if (status === 'Upcoming') upcoming++
      else if (status === 'Live') live++
      else past++
    })
    return {
      all: exams.length,
      upcoming,
      live,
      past,
    }
  }, [exams, now])

  // Filtered exams
  const filteredExams = useMemo(() => {
    if (activeTab === 'all') return exams
    if (activeTab === 'upcoming') return exams.filter((e) => getExamStatus(e, now) === 'Upcoming')
    if (activeTab === 'live') return exams.filter((e) => getExamStatus(e, now) === 'Live')
    if (activeTab === 'past') return exams.filter((e) => getExamStatus(e, now) === 'Past')
    return exams
  }, [exams, activeTab, now])

  // Featured exam: First Live exam, or first Upcoming exam
  const featuredExam = useMemo(() => {
    const live = exams.find((e) => getExamStatus(e, now) === 'Live')
    if (live) return live
    const upcoming = exams.find((e) => getExamStatus(e, now) === 'Upcoming')
    if (upcoming) return upcoming
    return exams[0] || null
  }, [exams, now])

  const featuredStatus = featuredExam ? getExamStatus(featuredExam, now) : null
  const targetTime = featuredExam
    ? featuredStatus === 'Live'
      ? new Date(featuredExam.endTime).getTime()
      : new Date(featuredExam.startTime).getTime()
    : now
  const countdown = formatCountdown(targetTime, now)

  return (
    <main className="w-full bg-surface min-h-[calc(100vh-56px)] text-on-surface">
      <div className="relative w-full overflow-hidden">
        {/* Ambient Neon Glow */}
        <div
          className="absolute -top-32 right-1/4 w-96 h-96 bg-primary-container/5 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/3 left-10 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div className="w-full max-w-7xl mx-auto px-4 md:px-margin-desktop py-space-xl">
          {/* Top System Header & Status Meta */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mb-space-xl">
            <div className="space-y-space-xs">
              <div className="flex items-center gap-space-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container shadow-[0_0_8px_#00f5a0]"></span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Timed Sprints &amp; Rated Contests
                </span>
                <span className="font-label-code-sm text-label-code-sm px-1.5 py-0.5 rounded bg-surface-container text-secondary border border-surface-container-highest">
                  gVisor Kernel Ready
                </span>
              </div>
              <h1 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface font-semibold tracking-tight">
                Exams &amp; Contests
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                Join algorithmic benchmark challenges, live proctored sprints, or analyze historical global rankings and sandbox metrics.
              </p>
            </div>

            {/* Segmented View Filter Tabs */}
            <div className="flex items-center p-1 bg-surface-container-lowest rounded-xl border border-surface-container-highest self-start md:self-auto shadow-sm">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-space-md py-1.5 rounded-lg font-body-sm text-body-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-surface-container-high text-primary-container font-medium shadow-xs border border-surface-container-highest/60'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tab.id === 'live' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
                    )}
                    <span>{tab.label}</span>
                    <span
                      className={`font-label-code-sm text-label-code-sm px-1.5 py-0.2 rounded ${
                        isActive
                          ? 'bg-surface-container-highest text-primary-container'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {counts[tab.id] || 0}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-space-lg p-space-md rounded-xl bg-error-container/20 border border-error-container text-error font-body-md text-body-md">
              {error}
            </div>
          )}

          {/* Main Asymmetric Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
            {/* Primary Stream (8 cols) */}
            <div className="lg:col-span-8 space-y-space-xl">
              {/* Featured / Next Scheduled Contest Hero Banner */}
              {featuredExam && (
                <section className="relative overflow-hidden rounded-xl bg-surface-container-low border border-surface-container-highest p-space-lg md:p-space-xl shadow-xl">
                  <div
                    className="absolute top-0 right-0 w-96 h-96 bg-primary-container/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"
                    aria-hidden="true"
                  />

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-space-md pb-space-lg border-b border-surface-container-highest/80">
                    <div className="space-y-space-xs">
                      <div className="flex items-center gap-space-sm flex-wrap">
                        <span
                          className={`font-label-code-sm text-label-code-sm px-2 py-0.5 rounded border uppercase font-semibold ${
                            featuredStatus === 'Live'
                              ? 'bg-error-container/20 border-error/40 text-error'
                              : featuredStatus === 'Upcoming'
                              ? 'bg-primary-container/10 border-primary-container/30 text-primary-container'
                              : 'bg-surface-container border-surface-container-highest text-on-surface-variant'
                          }`}
                        >
                          {featuredStatus === 'Live' ? 'Live Benchmark' : featuredStatus === 'Upcoming' ? 'Upcoming Rated' : 'Archived Sprint'}
                        </span>
                        <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                          Round #{featuredExam._id?.slice(-4) || '1042'}
                        </span>
                        <span className="font-label-code-sm text-label-code-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-surface-container-highest">
                          Div. 1 + Div. 2
                        </span>
                      </div>
                      <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                        {featuredExam.title}
                      </h2>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        Standard algorithmic speed round with sandboxed evaluation, runtime verification, and strict memory limits.
                      </p>
                    </div>

                    {/* Precision Digital Countdown Clock */}
                    <div className="flex flex-col items-start md:items-end bg-surface-container-lowest/80 border border-surface-container-highest p-space-md rounded-lg shrink-0">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                        {featuredStatus === 'Live' ? 'Time Remaining' : 'T-Minus to Dispatch'}
                      </span>
                      <div className="flex items-baseline gap-1 mt-1 font-label-code-lg text-label-code-lg text-primary-container font-mono">
                        <span className="bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface">
                          {countdown.days}
                        </span>
                        <span className="text-on-surface-variant">:</span>
                        <span className="bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface">
                          {countdown.hours}
                        </span>
                        <span className="text-on-surface-variant">:</span>
                        <span className="bg-surface-container-high px-1.5 py-0.5 rounded text-on-surface">
                          {countdown.minutes}
                        </span>
                        <span className="text-on-surface-variant">:</span>
                        <span className="bg-surface-container-high px-1.5 py-0.5 rounded text-primary-container">
                          {countdown.seconds}
                        </span>
                      </div>
                      <span className="font-label-code-sm text-label-code-sm text-outline mt-1">
                        DD : HH : MM : SS
                      </span>
                    </div>
                  </div>

                  {/* Structured Exam Spec Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md py-space-lg">
                    <div className="space-y-0.5">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        Start Window
                      </span>
                      <p className="font-label-code-sm text-label-code-sm text-on-surface font-medium">
                        {new Date(featuredExam.startTime).toLocaleDateString()}
                      </p>
                      <p className="font-label-code-sm text-label-code-sm text-outline">
                        {new Date(featuredExam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        Time Limit
                      </span>
                      <p className="font-label-code-sm text-label-code-sm text-on-surface font-medium">
                        {featuredExam.duration} Minutes
                      </p>
                      <p className="font-label-code-sm text-label-code-sm text-outline">Hard cutoff</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        Problem Set
                      </span>
                      <p className="font-label-code-sm text-label-code-sm text-on-surface font-medium">
                        {featuredExam.problems?.length || 0} Benchmarks
                      </p>
                      <p className="font-label-code-sm text-label-code-sm text-outline">Submissions ranked</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        Enrollment
                      </span>
                      <p className="font-label-code-sm text-label-code-sm text-primary-container font-medium">
                        Open Entry
                      </p>
                      <p className="font-label-code-sm text-label-code-sm text-outline">Rated for all ELO</p>
                    </div>
                  </div>

                  {/* Included Problem Specs Preview */}
                  {featuredExam.problems?.length > 0 && (
                    <div className="p-space-md bg-surface-container-lowest/60 rounded-lg border border-surface-container-highest space-y-space-xs mb-space-lg">
                      <div className="flex items-center justify-between text-on-surface-variant font-label-caps text-label-caps uppercase">
                        <span>Included Problem Specs</span>
                        <span>Memory Limit: 256MB / 2.0s</span>
                      </div>
                      <div className="flex flex-wrap gap-space-sm pt-1">
                        {featuredExam.problems.map((entry, idx) => (
                          <div
                            key={entry._id || idx}
                            className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-high rounded border border-surface-container-highest"
                          >
                            <span className="font-label-code-sm text-label-code-sm text-secondary font-mono">
                              0{idx + 1}.
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface font-medium">
                              {entry.problem?.title || `Problem ${idx + 1}`}
                            </span>
                            {entry.problem?.difficulty && (
                              <span className="font-label-caps text-label-caps text-outline ml-1">
                                {entry.problem.difficulty.toUpperCase()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action & Registration Hub */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        verified_user
                      </span>
                      <span>Proctored by Judge0 v1.13 isolator</span>
                    </div>

                    <div className="flex items-center gap-space-sm w-full sm:w-auto">
                      {featuredStatus !== 'Upcoming' && (
                        <Link
                          to={`/exams/${featuredExam._id}/leaderboard`}
                          className="flex-1 sm:flex-initial px-space-lg py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-surface-container-highest font-body-md text-body-md transition-colors flex items-center justify-center gap-space-xs"
                        >
                          <span className="material-symbols-outlined text-[18px]">leaderboard</span>
                          <span>Leaderboard</span>
                        </Link>
                      )}
                      <Link
                        to={`/exams/${featuredExam._id}`}
                        className="flex-1 sm:flex-initial px-space-xl py-2 rounded-lg bg-primary-container hover:bg-secondary text-surface-container-lowest font-body-md text-body-md font-semibold transition-all shadow-[0_0_16px_rgba(0,245,160,0.2)] flex items-center justify-center gap-space-xs"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {featuredStatus === 'Live' ? 'play_arrow' : 'check_circle'}
                        </span>
                        <span>{featuredStatus === 'Live' ? 'Enter Live Exam' : 'Enter Exam Workspace'}</span>
                      </Link>
                    </div>
                  </div>
                </section>
              )}

              {/* All / Filtered Contests Section */}
              <div className="space-y-space-md">
                <div className="flex items-center justify-between pb-space-xs border-b border-surface-container-highest">
                  <div className="flex items-center gap-space-sm">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                      Contest Directory &amp; Sprints
                    </h2>
                    <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                      {filteredExams.length} available
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs text-on-surface-variant">
                    <span className="font-label-code-sm text-label-code-sm">Ranked ICPC Rules</span>
                  </div>
                </div>

                {loading && (
                  <div className="py-16 text-center text-on-surface-variant font-body-md flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-2xl text-secondary animate-spin">
                      refresh
                    </span>
                    <span>Synchronizing sprint schedules...</span>
                  </div>
                )}

                {!loading && filteredExams.length === 0 && (
                  <div className="py-16 text-center text-on-surface-variant font-body-md flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">
                      event_busy
                    </span>
                    <span>No {activeTab} contests found.</span>
                  </div>
                )}

                {filteredExams.map((exam) => {
                  const status = getExamStatus(exam, now)
                  const problemNames = (exam.problems || [])
                    .map((entry) => entry.problem?.title)
                    .filter(Boolean)

                  return (
                    <article
                      key={exam._id}
                      className="group bg-surface-container-low hover:bg-surface-container rounded-xl border border-surface-container-highest p-space-lg transition-all duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                        <div className="space-y-space-xs min-w-0 flex-1">
                          <div className="flex items-center gap-space-sm flex-wrap">
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold group-hover:text-primary-container transition-colors truncate">
                              {exam.title}
                            </h3>
                            <span
                              className={`font-label-caps text-label-caps px-2 py-0.5 rounded uppercase font-medium ${
                                status === 'Live'
                                  ? 'bg-error-container/20 text-error border border-error/30'
                                  : status === 'Upcoming'
                                  ? 'bg-primary-container/10 text-primary-container border border-primary-container/20'
                                  : 'bg-surface-container-highest text-on-surface-variant'
                              }`}
                            >
                              {status}
                            </span>
                            <span className="font-label-code-sm text-label-code-sm text-outline">
                              {new Date(exam.startTime).toLocaleDateString()} •{' '}
                              {new Date(exam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                              – {new Date(exam.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-space-md text-on-surface-variant font-label-code-sm text-label-code-sm flex-wrap">
                            <span>{exam.duration} min duration</span>
                            <span>•</span>
                            <span>{exam.problems?.length || 0} benchmark challenges</span>
                            {problemNames.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-on-surface-variant/80 truncate">
                                  {problemNames.slice(0, 3).join(', ')}
                                  {problemNames.length > 3 ? '...' : ''}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-space-xs self-start md:self-auto shrink-0">
                          {status !== 'Upcoming' && (
                            <Link
                              to={`/exams/${exam._id}/leaderboard`}
                              className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm border border-surface-container-highest transition-colors flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">leaderboard</span>
                              <span>Leaderboard</span>
                            </Link>
                          )}
                          <Link
                            to={`/exams/${exam._id}`}
                            className={`px-space-md py-1.5 rounded-lg font-body-sm text-body-sm transition-all flex items-center gap-1 ${
                              status === 'Live'
                                ? 'bg-primary-container hover:bg-secondary text-surface-container-lowest font-semibold shadow-xs'
                                : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-surface-container-highest'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {status === 'Live' ? 'play_arrow' : 'visibility'}
                            </span>
                            <span>{status === 'Live' ? 'Enter Exam' : 'View Details'}</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {/* Live Standings Snapshot (Embedded Mini-Leaderboard) */}
              <div className="p-space-lg bg-surface-container-lowest rounded-xl border border-surface-container-highest">
                <div className="flex items-center justify-between mb-space-md">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-secondary text-[18px]">
                        workspace_premium
                      </span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                        Recent Benchmark Standings
                      </h3>
                    </div>
                    <p className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                      Validated low-latency runtime results and ICPC rankings
                    </p>
                  </div>
                  <span className="font-label-code-sm text-label-code-sm px-2 py-0.5 rounded bg-surface-container-high text-outline border border-surface-container-highest">
                    ICPC Penalties Active
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-surface-container-highest text-on-surface-variant font-label-caps text-label-caps uppercase select-none">
                        <th className="py-2 px-space-sm font-semibold">Rank</th>
                        <th className="py-2 px-space-sm font-semibold">Architect</th>
                        <th className="py-2 px-space-sm font-semibold">Solved</th>
                        <th className="py-2 px-space-sm font-semibold">Execution Time</th>
                        <th className="py-2 px-space-sm font-semibold">Memory</th>
                        <th className="py-2 px-space-sm font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-highest/40 font-label-code-sm text-label-code-sm">
                      <tr className="hover:bg-surface-container/60 transition-colors">
                        <td className="py-2.5 px-space-sm text-primary-container font-bold">#1</td>
                        <td className="py-2.5 px-space-sm font-medium text-on-surface flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                          <span>tourist</span>
                          <span className="text-outline font-normal">· GM (3120)</span>
                        </td>
                        <td className="py-2.5 px-space-sm text-secondary font-medium">All Passed</td>
                        <td className="py-2.5 px-space-sm text-on-surface">1.2ms</td>
                        <td className="py-2.5 px-space-sm text-on-surface">6.8MB</td>
                        <td className="py-2.5 px-space-sm text-right text-primary-container">ACCEPTED</td>
                      </tr>
                      <tr className="hover:bg-surface-container/60 transition-colors">
                        <td className="py-2.5 px-space-sm text-on-surface font-semibold">#2</td>
                        <td className="py-2.5 px-space-sm font-medium text-on-surface flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-secondary"></span>
                          <span>neal_wu</span>
                          <span className="text-outline font-normal">· Master (2840)</span>
                        </td>
                        <td className="py-2.5 px-space-sm text-secondary font-medium">All Passed</td>
                        <td className="py-2.5 px-space-sm text-on-surface">1.8ms</td>
                        <td className="py-2.5 px-space-sm text-on-surface">7.2MB</td>
                        <td className="py-2.5 px-space-sm text-right text-primary-container">ACCEPTED</td>
                      </tr>
                      <tr className="hover:bg-surface-container/60 transition-colors">
                        <td className="py-2.5 px-space-sm text-on-surface font-semibold">#3</td>
                        <td className="py-2.5 px-space-sm font-medium text-on-surface flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-surface-tint"></span>
                          <span>radewoosh</span>
                          <span className="text-outline font-normal">· Master (2792)</span>
                        </td>
                        <td className="py-2.5 px-space-sm text-secondary font-medium">All Passed</td>
                        <td className="py-2.5 px-space-sm text-on-surface">2.4ms</td>
                        <td className="py-2.5 px-space-sm text-on-surface">7.0MB</td>
                        <td className="py-2.5 px-space-sm text-right text-primary-container">ACCEPTED</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Tactical Sidebar (4 cols) */}
            <aside className="lg:col-span-4 space-y-space-lg">
              {/* Sandbox Runtime Cluster Health */}
              <div className="p-space-lg bg-surface-container-low rounded-xl border border-surface-container-highest space-y-space-md shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                    Sandbox Runtime Nodes
                  </span>
                  <span className="flex items-center gap-1 font-label-code-sm text-label-code-sm text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                    Online
                  </span>
                </div>

                <div className="space-y-space-sm pt-1">
                  <div className="flex items-center justify-between font-label-code-sm text-label-code-sm">
                    <span className="text-on-surface-variant">CPU Isolation</span>
                    <span className="text-on-surface font-medium">2 vCPU (Dedicated)</span>
                  </div>
                  <div className="flex items-center justify-between font-label-code-sm text-label-code-sm">
                    <span className="text-on-surface-variant">Max Memory Buffer</span>
                    <span className="text-on-surface font-medium">256 MB Hard Cap</span>
                  </div>
                  <div className="flex items-center justify-between font-label-code-sm text-label-code-sm">
                    <span className="text-on-surface-variant">Kernel Sandboxing</span>
                    <span className="text-secondary font-medium">gVisor Container</span>
                  </div>
                  <div className="flex items-center justify-between font-label-code-sm text-label-code-sm">
                    <span className="text-on-surface-variant">Evaluation Latency</span>
                    <span className="text-primary-container font-mono font-medium">&lt; 14ms</span>
                  </div>
                </div>
              </div>

              {/* Contest Rules & Proctoring Spec */}
              <div className="p-space-lg bg-surface-container-low rounded-xl border border-surface-container-highest space-y-space-md shadow-sm">
                <div className="flex items-center gap-space-xs text-on-surface font-headline-sm text-headline-sm font-medium">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    gavel
                  </span>
                  <span>ICPC Scoring Directives</span>
                </div>

                <ul className="space-y-space-sm font-body-sm text-body-sm text-on-surface-variant">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-container font-bold">•</span>
                    <span>
                      <strong>Rankings</strong>: Determined primarily by total accepted problems, tie-broken by lowest penalty points.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-container font-bold">•</span>
                    <span>
                      <strong>Time Penalties</strong>: +20 minutes accrued for each unsuccessful submission prior to acceptance.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-container font-bold">•</span>
                    <span>
                      <strong>Deterministic Environment</strong>: Multi-threaded runs execute on dedicated pinned cores to eliminate clock jitter.
                    </span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  )
}