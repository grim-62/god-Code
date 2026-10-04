import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import { Link, useParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance.js'

const violationWarningThreshold = 3

// Shared button styles (same look as the problem page toolbar buttons)
const secondaryButton =
  'rounded border border-surface-container-highest bg-surface-container hover:bg-surface-container-high px-3 py-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer font-label-code-sm disabled:opacity-50 disabled:cursor-not-allowed'

function readDraft(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function saveDraft(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return undefined
  }
  return undefined
}

function formatCountdown(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':')
}

function difficultyClasses(difficulty) {
  if (difficulty === 'Easy') return 'bg-primary-container/10 text-primary-container border border-primary-container/20'
  if (difficulty === 'Medium') return 'bg-secondary-container/20 text-secondary border border-secondary-container/30'
  return 'bg-error-container/20 text-error border border-error-container/30'
}

export default function ExamPage() {
  const { id } = useParams()
  const [exam, setExam] = useState(null)
  const [participant, setParticipant] = useState(null)
  const [serverOffset, setServerOffset] = useState(0)
  const [clock, setClock] = useState(Date.now())
  const [selectedProblemId, setSelectedProblemId] = useState('')
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [readyDraftKey, setReadyDraftKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [autoSubmitting, setAutoSubmitting] = useState(false)
  const [locked, setLocked] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [fullscreenWarning, setFullscreenWarning] = useState(false)
  const [violationCount, setViolationCount] = useState(0)
  const [violationWarning, setViolationWarning] = useState(false)
  const [error, setError] = useState('')
  const [submission, setSubmission] = useState(null)
  const [runResult, setRunResult] = useState(null)
  const [actionError, setActionError] = useState('')
  const [resultTab, setResultTab] = useState('description')
  const autoSubmitStarted = useRef(false)
  const lastViolationByType = useRef(new Map())
  const reportViolationRef = useRef(null)
  const submitForProblemRef = useRef(null)

  useEffect(() => {
    let active = true
    axiosInstance.get(`/exams/${id}`)
      .then(({ data }) => {
        if (!active) return
        setExam(data.exam)
        setParticipant(data.participant)
        setViolationCount(data.participant?.violationCount || 0)
        setServerOffset(new Date(data.serverTime).getTime() - Date.now())
        setSelectedProblemId(data.exam.problems[0]?.problem?._id || '')
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load this exam.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [])

  const problemEntry = exam?.problems.find((entry) => entry.problem?._id === selectedProblemId)
  const problem = problemEntry?.problem
  const draftKey = `god-code:exam:${id}:${selectedProblemId}:${language}`
  const remainingMs = participant ? new Date(participant.endsAt).getTime() - (clock + serverOffset) : null
  const timeExpired = participant && remainingMs <= 0
  const serverNow = clock + serverOffset
  const examHasStarted = exam && serverNow >= new Date(exam.startTime).getTime()
  const examHasEnded = exam && serverNow >= new Date(exam.endTime).getTime()

  useEffect(() => {
    if (!problem) return
    const savedCode = readDraft(draftKey)
    setCode(savedCode ?? problem.starterCode?.[language] ?? '')
    setReadyDraftKey(draftKey)
    setSubmission(null)
    setRunResult(null)
    setActionError('')
    setResultTab('description')
  }, [problem, draftKey, language])

  useEffect(() => {
    if (readyDraftKey === draftKey) saveDraft(draftKey, code)
  }, [readyDraftKey, draftKey, code])

  useEffect(() => {
    if (!submission?._id || submission.verdict !== 'Pending') return undefined
    let active = true
    let timer
    async function pollSubmission() {
      try {
        const { data } = await axiosInstance.get(`/submissions/${submission._id}`)
        if (!active) return
        setSubmission(data.submission)
        if (data.submission.verdict === 'Pending') timer = window.setTimeout(pollSubmission, 1500)
      } catch (pollError) {
        if (!active) return
        setActionError(pollError.response?.data?.message || 'Unable to check judging status.')
        timer = window.setTimeout(pollSubmission, 3000)
      }
    }
    timer = window.setTimeout(pollSubmission, 1000)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [submission?._id, submission?.verdict])

  async function logViolation(type) {
    if (!participant || timeExpired) return
    const now = Date.now()
    const previous = lastViolationByType.current.get(type) || 0
    if (now - previous < 1200) return
    lastViolationByType.current.set(type, now)

    try {
      const { data } = await axiosInstance.post(`/exams/${id}/violations`, { type })
      setViolationCount(data.violationCount)
      if (data.violationCount >= violationWarningThreshold) setViolationWarning(true)
    } catch {
      return
    }
  }
  reportViolationRef.current = logViolation

  useEffect(() => {
    if (!participant || timeExpired) return undefined
    const handleVisibility = () => { if (document.hidden) reportViolationRef.current?.('tab-hidden') }
    const handleBlur = () => reportViolationRef.current?.('window-blur')
    const handleFullscreen = () => {
      const isFullscreen = Boolean(document.fullscreenElement)
      setFullscreen(isFullscreen)
      if (!isFullscreen) reportViolationRef.current?.('fullscreen-exit')
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreen)
    setFullscreen(Boolean(document.fullscreenElement))
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreen)
    }
  }, [id, participant?.startedAt, participant?.endsAt, timeExpired])

  async function beginExam() {
    if (starting || !examHasStarted || examHasEnded) return
    setStarting(true)
    setError('')
    const fullscreenRequest = document.documentElement.requestFullscreen
      ? document.documentElement.requestFullscreen().then(() => true).catch(() => false)
      : Promise.resolve(false)
    try {
      const [{ data }, enteredFullscreen] = await Promise.all([
        axiosInstance.post(`/exams/${id}/start`),
        fullscreenRequest,
      ])
      setParticipant({ ...data, violationCount: 0 })
      setServerOffset(new Date(data.serverTime).getTime() - Date.now())
      setFullscreen(enteredFullscreen)
      setFullscreenWarning(!enteredFullscreen)
      autoSubmitStarted.current = false
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to start this exam.')
    } finally {
      setStarting(false)
    }
  }

  async function runCurrentProblem() {
    if (!problem || !participant || timeExpired || submitting) return
    setActionError('')
    setRunResult(null)
    setResultTab('result')
    try {
      const { data } = await axiosInstance.post('/run', { problemId: selectedProblemId, language, code })
      setRunResult(data.results || [])
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to run this code.')
    }
  }

  async function submitCurrentProblem(isAutomatic = false) {
    if (!problem || !participant || submitting || (!isAutomatic && timeExpired)) return
    setSubmitting(true)
    setActionError('')
    setRunResult(null)
    setResultTab('result')
    if (isAutomatic) setAutoSubmitting(true)
    try {
      const { data } = await axiosInstance.post('/submissions', {
        problemId: selectedProblemId,
        language,
        code,
        examId: id,
      })
      setSubmission(data.submission)
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'Unable to submit this exam solution.')
    } finally {
      setSubmitting(false)
      if (isAutomatic) setAutoSubmitting(false)
    }
  }
  submitForProblemRef.current = submitCurrentProblem

  useEffect(() => {
    if (!participant || remainingMs === null || remainingMs <= 0 || remainingMs > 3000 || autoSubmitStarted.current) return
    if (submission?.verdict === 'Pending' || submitting) return
    autoSubmitStarted.current = true
    submitForProblemRef.current?.(true)
  }, [participant?.endsAt, remainingMs, submission?.verdict, submitting, selectedProblemId, code, language])

  useEffect(() => {
    if (timeExpired) setLocked(true)
  }, [timeExpired])

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] animate-pulse bg-surface-container-lowest p-6">
        <div className="h-12 rounded bg-surface-container-low" />
        <div className="mt-5 h-[70vh] rounded bg-surface-container-low" />
      </main>
    )
  }

  if (error && !exam) {
    return (
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-4xl bg-surface-container-lowest px-6 py-16">
        <p className="rounded-md border border-error-container bg-error-container/20 p-4 text-sm text-error font-body-sm" role="alert">{error}</p>
        <Link className="mt-4 inline-block text-sm font-semibold text-primary-container hover:underline font-label-code-sm" to="/exams">Back to exams</Link>
      </main>
    )
  }

  if (!exam) return null

  const examProblems = exam.problems || []
  const displayProblem = problem || examProblems[0]?.problem
  const timeLeft = participant ? formatCountdown(remainingMs) : null

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-surface-container-lowest text-on-surface">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-container-highest bg-surface-container-low/60 px-5 py-3">
        <div className="min-w-0">
          <Link className="text-xs font-medium text-primary-container hover:underline font-label-code-sm" to="/exams">Exams</Link>
          <h1 className="mt-1 truncate text-base font-semibold text-on-surface font-headline-sm">{exam.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {participant && (
            <div
              className={`rounded border px-3 py-1.5 font-mono text-lg font-bold tabular-nums ${
                timeExpired
                  ? 'border-error-container bg-error-container/20 text-error'
                  : remainingMs < 60_000
                  ? 'border-secondary-container/30 bg-secondary-container/20 text-secondary'
                  : 'border-surface-container-highest bg-surface-container text-on-surface'
              }`}
              aria-live="polite"
            >
              {timeLeft}
            </div>
          )}
          {participant && <span className="text-xs text-on-surface-variant font-label-code-sm">Violations: {violationCount}</span>}
          {participant && !fullscreen && !timeExpired && (
            <button
              className={secondaryButton}
              type="button"
              onClick={() => document.documentElement.requestFullscreen?.().catch(() => setFullscreenWarning(true))}
            >
              Enter fullscreen
            </button>
          )}
          {!participant && (
            <button
              className="flex cursor-pointer items-center gap-1 rounded bg-primary-container px-4 py-1.5 text-xs font-semibold text-surface-container-lowest shadow-xs transition-all hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 font-label-code-sm"
              type="button"
              disabled={!examHasStarted || examHasEnded || starting}
              onClick={beginExam}
            >
              {starting ? 'Starting...' : examHasEnded ? 'Exam ended' : examHasStarted ? 'Start exam' : `Starts ${new Date(exam.startTime).toLocaleString()}`}
            </button>
          )}
        </div>
      </header>

      {(error || fullscreenWarning || violationWarning || autoSubmitting || locked) && (
        <div className="space-y-2 border-b border-surface-container-highest bg-surface-container-low px-5 py-3">
          {error && <p className="rounded border border-error-container bg-error-container/20 p-2.5 text-xs text-error font-body-sm" role="alert">{error}</p>}
          {fullscreenWarning && <p className="rounded border border-secondary-container/30 bg-secondary-container/20 p-2.5 text-xs text-secondary font-body-sm">Fullscreen was not enabled. Use the fullscreen control to reduce interruptions.</p>}
          {violationWarning && <p className="rounded border border-secondary-container/30 bg-secondary-container/20 p-2.5 text-xs text-secondary font-body-sm" role="alert">You have {violationCount} focus violations. Further activity is recorded for the exam administrator.</p>}
          {autoSubmitting && <p className="rounded border border-secondary-container/30 bg-secondary-container/20 p-2.5 text-xs text-secondary font-body-sm">Time is nearly up. Submitting the current solution automatically.</p>}
          {locked && <p className="rounded border border-error-container bg-error-container/20 p-2.5 text-xs font-semibold text-error font-body-sm">Your exam time has ended. The editor is locked.</p>}
        </div>
      )}

      <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="border-b border-surface-container-highest bg-surface-container-low lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-4 py-4">
            <h2 className="text-sm font-semibold text-on-surface font-headline-sm">Problems</h2>
            <span className="text-xs text-on-surface-variant font-label-code-sm">{examProblems.length}</span>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:flex-col" aria-label="Exam problem navigator">
            {examProblems.map((entry, index) => (
              <button
                className={`min-w-36 cursor-pointer rounded-md border px-3 py-3 text-left transition-colors lg:min-w-0 ${
                  selectedProblemId === entry.problem._id
                    ? 'border-primary-container/40 bg-primary-container/10'
                    : 'border-surface-container-highest bg-surface-container hover:bg-surface-container-high'
                }`}
                key={entry.problem._id}
                type="button"
                onClick={() => setSelectedProblemId(entry.problem._id)}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-xs text-on-surface-variant font-label-code-sm">Problem {index + 1}</span>
                  <span className="text-[11px] text-secondary font-label-code-sm">{entry.marks} pts</span>
                </span>
                <span className="mt-1 block truncate text-sm font-medium text-on-surface">{entry.problem.title}</span>
              </button>
            ))}
          </nav>
          <Link className="m-4 inline-block text-xs font-medium text-on-surface-variant transition-colors hover:text-primary-container font-label-code-sm" to={`/exams/${id}/leaderboard`}>View leaderboard</Link>
        </aside>

        <section className="flex min-w-0 flex-col">
          {displayProblem ? (
            <>
              <div className="grid min-h-67.5 lg:grid-cols-2">
                <article className="max-h-[42vh] overflow-y-auto border-b border-surface-container-highest bg-surface-container-low px-5 py-4 lg:max-h-none lg:border-b-0 lg:border-r">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-on-surface font-headline-sm">{displayProblem.title}</h2>
                    <span className={`rounded px-2.5 py-0.5 text-xs font-semibold uppercase font-label-code-sm ${difficultyClasses(displayProblem.difficulty)}`}>{displayProblem.difficulty}</span>
                    <span className="text-xs text-secondary font-label-code-sm">{problemEntry?.marks} points</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(displayProblem.tags || []).map((tag) => (
                      <span className="rounded-full border border-surface-container-highest bg-surface-container px-2.5 py-0.5 text-xs text-on-surface-variant font-body-sm" key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-on-surface-variant font-body-md">{displayProblem.description}</div>
                  {displayProblem.constraints && (
                    <section className="mt-6">
                      <h3 className="text-sm font-semibold text-on-surface font-headline-sm">Constraints</h3>
                      <pre className="mt-3 whitespace-pre-wrap rounded-md border border-surface-container-highest bg-surface-container-lowest p-4 font-mono text-xs leading-6 text-on-surface-variant">{displayProblem.constraints}</pre>
                    </section>
                  )}
                  {(displayProblem.examples || []).length > 0 && (
                    <section className="mt-6 space-y-4">
                      <h3 className="text-sm font-semibold text-on-surface font-headline-sm">Examples</h3>
                      {(displayProblem.examples || []).map((example, index) => (
                        <div className="rounded-md border border-surface-container-highest bg-surface-container-lowest/80 p-4" key={`example-${index}`}>
                          <p className="mb-3 text-xs font-semibold uppercase text-secondary font-label-code-sm">Example {index + 1}</p>
                          <div className="grid gap-3 text-xs sm:grid-cols-2">
                            <div>
                              <p className="mb-1 uppercase text-on-surface-variant font-label-caps">Input</p>
                              <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-surface-container-highest bg-surface-container p-2.5 font-mono text-on-surface font-label-code-sm">{example.input}</pre>
                            </div>
                            <div>
                              <p className="mb-1 uppercase text-on-surface-variant font-label-caps">Output</p>
                              <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-surface-container-highest bg-surface-container p-2.5 font-mono text-primary font-label-code-sm">{example.output}</pre>
                            </div>
                          </div>
                          {example.explanation && (
                            <p className="mt-3 text-xs leading-5 text-on-surface-variant">
                              <span className="font-semibold text-on-surface">Explanation: </span>
                              {example.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </section>
                  )}
                </article>

                <div className="flex min-h-80 flex-col bg-surface-container-lowest">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-highest bg-surface-container-low/50 px-4 py-2.5">
                    <label className="flex items-center gap-2 text-xs text-on-surface-variant font-label-code-sm">
                      Language
                      <select
                        className="cursor-pointer rounded border border-surface-container-highest bg-surface-container px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary-container disabled:cursor-not-allowed disabled:opacity-50 font-label-code-sm"
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                        disabled={locked}
                      >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                      </select>
                    </label>
                    <div className="flex gap-2">
                      <button className={secondaryButton} type="button" disabled={locked} onClick={() => setCode(problem?.starterCode?.[language] || '')}>Reset</button>
                      <button className={secondaryButton} type="button" onClick={() => document.documentElement.requestFullscreen?.().catch(() => setFullscreenWarning(true))}>{fullscreen ? 'Fullscreen on' : 'Fullscreen'}</button>
                    </div>
                  </div>
                  <div className="min-h-70 flex-1">
                    <Editor
                      height="100%"
                      language={language === 'javascript' ? 'javascript' : 'python'}
                      theme="vs-dark"
                      value={code}
                      onChange={(value) => setCode(value || '')}
                      loading={<div className="flex h-full items-center justify-center text-sm text-on-surface-variant font-body-sm">Loading editor...</div>}
                      options={{ readOnly: !participant || locked, minimap: { enabled: false }, fontSize: 13, automaticLayout: true, scrollBeyondLastLine: false, padding: { top: 16 } }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container-highest bg-surface-container-low px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        className="flex cursor-pointer items-center gap-1 rounded border border-surface-container-highest bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface transition-all hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50 font-label-code-sm"
                        type="button"
                        disabled={!participant || locked || submitting}
                        onClick={runCurrentProblem}
                      >
                        <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                        <span>Run</span>
                      </button>
                      <button
                        className="flex cursor-pointer items-center gap-1 rounded bg-primary-container px-3.5 py-1 text-xs font-semibold text-surface-container-lowest shadow-xs transition-all hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 font-label-code-sm"
                        type="button"
                        disabled={!participant || locked || submitting}
                        onClick={() => submitCurrentProblem(false)}
                      >
                        <span className="material-symbols-outlined text-[14px]">send</span>
                        <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                      </button>
                    </div>
                    <span className="text-[11px] text-on-surface-variant font-label-code-sm">{participant ? 'Personal exam timer is active' : 'Start the exam to unlock the editor'}</span>
                  </div>
                </div>
              </div>

              <section className="border-t border-surface-container-highest bg-surface-container-low">
                <div className="flex h-9 items-stretch gap-5 border-b border-surface-container-highest bg-surface-container-lowest/40 px-4" role="tablist" aria-label="Exam console views">
                  {[
                    { key: 'description', label: 'Exam status' },
                    { key: 'result', label: 'Result' },
                  ].map((tab) => (
                    <button
                      className={`cursor-pointer border-b-2 text-xs transition-colors font-label-code-sm ${
                        resultTab === tab.key
                          ? 'border-primary-container font-semibold text-primary-container'
                          : 'border-transparent text-on-surface-variant hover:text-on-surface'
                      }`}
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={resultTab === tab.key}
                      onClick={() => setResultTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="max-h-48 overflow-y-auto bg-surface-container-lowest/90 p-4 text-xs text-on-surface-variant font-label-code-sm">
                  {resultTab === 'description' && <p>{participant ? 'Your time is measured by the server. Accepted solutions count toward your exam score.' : 'The editor unlocks when the scheduled exam window opens.'}</p>}
                  {resultTab === 'result' && (
                    <div className="space-y-3">
                      {actionError && <p className="rounded-md border border-error-container bg-error-container/20 p-3 text-error" role="alert">{actionError}</p>}
                      {submission && (
                        <p
                          className={`rounded-md border p-3 text-sm font-bold ${
                            submission.verdict === 'Accepted'
                              ? 'border-primary-container/30 bg-primary-container/10 text-primary-container'
                              : submission.verdict === 'Pending'
                              ? 'border-secondary-container/40 bg-secondary-container/20 text-secondary'
                              : 'border-error-container bg-error-container/20 text-error'
                          }`}
                        >
                          {submission.verdict === 'Pending' ? 'Judging...' : `${submission.verdict} · passed ${submission.passed}/${submission.total}`}
                        </p>
                      )}
                      {submission?.failedCase && (
                        <pre className="whitespace-pre-wrap rounded border border-surface-container-highest bg-surface-container p-3 font-mono text-error">Input: {submission.failedCase.input}{'\n'}Expected: {submission.failedCase.expected}{'\n'}Output: {submission.failedCase.actual}</pre>
                      )}
                      {runResult && (
                        <div className="space-y-2">
                          {runResult.map((result, index) => (
                            <div className="flex items-center gap-2 rounded-md border border-surface-container-highest bg-surface-container px-3 py-2" key={`run-${index}`}>
                              <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${result.passed ? 'border border-primary-container/30 bg-primary-container/10 text-primary-container' : 'border border-error-container bg-error-container/20 text-error'}`}>{result.passed ? 'Passed' : 'Failed'}</span>
                              <span className="text-on-surface">Sample {index + 1}</span>
                              {!result.passed && result.error && <span className="truncate text-error">{result.error}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      {!submission && !runResult && !actionError && <p className="text-on-surface-variant">No result yet.</p>}
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : <p className="p-8 text-sm text-on-surface-variant font-body-sm">No problems have been added to this exam.</p>}
        </section>
      </div>
    </main>
  )
}