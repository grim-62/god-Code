import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance.js'
import { fetchProblemBySlug } from '../features/problems/problemSlice.js'

const markdownComponents = {
  h1: ({ children }) => <h1 className="mb-3 mt-6 text-xl font-semibold text-on-surface">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-semibold text-on-surface">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold text-on-surface">{children}</h3>,
  p: ({ children }) => <p className="my-3 leading-7 text-on-surface-variant font-body-md">{children}</p>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6 text-on-surface-variant">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6 text-on-surface-variant">{children}</ol>,
  code: ({ children }) => <code className="rounded bg-surface-container px-1.5 py-0.5 font-label-code-sm text-primary-container">{children}</code>,
  pre: ({ children }) => <pre className="my-4 overflow-x-auto rounded-md bg-surface-container-lowest border border-surface-container-highest p-4 text-sm text-on-surface font-label-code-md">{children}</pre>,
}

function readDraft(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeDraft(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return undefined
  }
  return undefined
}

function ProblemSkeleton() {
  return (
    <div className="flex h-full min-h-140 gap-1 bg-slate-950 p-1">
      <div className="flex-1 animate-pulse rounded bg-slate-900 p-6">
        <div className="h-5 w-1/3 rounded bg-slate-800" />
        <div className="mt-8 h-8 w-2/3 rounded bg-slate-800" />
        <div className="mt-4 h-4 w-full rounded bg-slate-800" />
        <div className="mt-2 h-4 w-5/6 rounded bg-slate-800" />
      </div>
      <div className="hidden flex-1 animate-pulse rounded bg-slate-900 p-6 md:block">
        <div className="h-8 w-full rounded bg-slate-800" />
        <div className="mt-5 h-3/4 rounded bg-slate-800" />
      </div>
    </div>
  )
}

export default function ProblemPage() {
  const { slug } = useParams()
  const dispatch = useDispatch()
  const { selectedProblem, detailStatus, detailError } = useSelector((state) => state.problems)
  const problem = selectedProblem?.slug === slug ? selectedProblem : null
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState('')
  const [readyDraftKey, setReadyDraftKey] = useState('')
  const [leftTab, setLeftTab] = useState('description')
  const [submissionHistory, setSubmissionHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [selectedHistory, setSelectedHistory] = useState(null)
  const [consoleTab, setConsoleTab] = useState('testcase')
  const [consoleOpen, setConsoleOpen] = useState(true)
  const [runResults, setRunResults] = useState([])
  const [runError, setRunError] = useState('')
  const [resultMessage, setResultMessage] = useState('Run your code to see the sample test results here.')
  const [runningAction, setRunningAction] = useState('')
  const [submission, setSubmission] = useState(null)
  const [submissionStarting, setSubmissionStarting] = useState(false)
  const [submissionError, setSubmissionError] = useState('')
  const [verticalPanels, setVerticalPanels] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const draftKey = `god-code:draft:${slug}:${language}`

  useEffect(() => {
    dispatch(fetchProblemBySlug(slug))
  }, [dispatch, slug])

  useEffect(() => {
    if (!problem) return
    const savedDraft = readDraft(draftKey)
    setCode(savedDraft ?? problem.starterCode?.[language] ?? '')
    setReadyDraftKey(draftKey)
    setRunResults([])
    setRunError('')
    setSubmission(null)
    setSubmissionError('')
    setResultMessage('Run your code to see the sample test results here.')
  }, [problem, draftKey, language])

  useEffect(() => {
    if (readyDraftKey === draftKey) writeDraft(draftKey, code)
  }, [code, draftKey, readyDraftKey])

  useEffect(() => {
    if (!submission?._id || submission.verdict !== 'Pending') return undefined

    let active = true
    let timer
    async function pollSubmission() {
      try {
        const { data } = await axiosInstance.get(`/submissions/${submission._id}`)
        if (!active) return
        setSubmission(data.submission)
        if (data.submission.verdict === 'Pending') {
          timer = window.setTimeout(pollSubmission, 1500)
        }
      } catch (error) {
        if (!active) return
        setSubmissionError(error.response?.data?.message || 'Unable to check the submission status.')
        timer = window.setTimeout(pollSubmission, 3000)
      }
    }

    timer = window.setTimeout(pollSubmission, 1000)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [submission?._id, submission?.verdict])

  useEffect(() => {
    if (leftTab !== 'submissions' || !problem?._id) return undefined

    let active = true
    setHistoryLoading(true)
    setHistoryError('')
    axiosInstance.get('/submissions', { params: { problemId: problem._id } })
      .then(({ data }) => {
        if (active) setSubmissionHistory(data.submissions || [])
      })
      .catch((error) => {
        if (active) setHistoryError(error.response?.data?.message || 'Unable to load submission history.')
      })
      .finally(() => {
        if (active) setHistoryLoading(false)
      })

    return () => { active = false }
  }, [leftTab, problem?._id, submission?._id, submission?.verdict])

  useEffect(() => {
    if (!selectedHistory) return undefined
    function closeOnEscape(event) {
      if (event.key === 'Escape') setSelectedHistory(null)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [selectedHistory])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 820px)')
    const updateLayout = () => setVerticalPanels(media.matches)
    updateLayout()
    media.addEventListener('change', updateLayout)
    return () => media.removeEventListener('change', updateLayout)
  }, [])

  useEffect(() => {
    const updateFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', updateFullscreen)
    return () => document.removeEventListener('fullscreenchange', updateFullscreen)
  }, [])

  function resetCode() {
    setCode(problem?.starterCode?.[language] ?? '')
  }

  async function toggleFullscreen() {
    const workspace = document.getElementById('problem-workspace')
    if (document.fullscreenElement) await document.exitFullscreen()
    else await workspace?.requestFullscreen()
  }

  async function runCode() {
    if (runningAction || submissionStarting || submission?.verdict === 'Pending') return
    setRunningAction('run')
    setConsoleOpen(true)
    setConsoleTab('result')
    setRunResults([])
    setRunError('')
    setSubmission(null)
    setSubmissionError('')
    setResultMessage('')

    try {
      const { data } = await axiosInstance.post('/run', {
        problemId: problem._id,
        language,
        code,
      })
      setRunResults(data.results || [])
      if (!data.results?.length) setResultMessage('No visible sample test cases are configured for this problem.')
    } catch (error) {
      setRunError(error.response?.data?.message || 'Run failed. Check your connection and try again.')
    } finally {
      setRunningAction('')
    }
  }

  async function submitCode() {
    if (runningAction || submissionStarting || submission?.verdict === 'Pending') return
    setSubmissionStarting(true)
    setConsoleOpen(true)
    setConsoleTab('result')
    setRunResults([])
    setRunError('')
    setSubmission(null)
    setSubmissionError('')
    setResultMessage('')

    try {
      const { data } = await axiosInstance.post('/submissions', {
        problemId: problem._id,
        language,
        code,
      })
      setSubmission(data.submission)
    } catch (error) {
      setSubmissionError(error.response?.data?.message || 'Unable to submit this solution.')
    } finally {
      setSubmissionStarting(false)
    }
  }

  if (detailStatus === 'loading' || !problem && detailStatus === 'idle') {
    return <main className="min-h-[calc(100vh-4rem)] bg-slate-950"><ProblemSkeleton /></main>
  }

  if (!problem && detailStatus === 'failed') {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Problem unavailable</h1>
          <p className="mt-2 text-sm text-slate-400">{detailError || 'This problem could not be loaded.'}</p>
          <button className="mt-5 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600" type="button" onClick={() => dispatch(fetchProblemBySlug(slug))}>Try again</button>
        </div>
      </main>
    )
  }

  if (!problem) return <main className="min-h-[calc(100vh-4rem)] bg-slate-950"><ProblemSkeleton /></main>

  const samples = problem.examples?.length
    ? problem.examples
    : (problem.samples || []).map((sample) => ({ input: sample.input, output: sample.expectedOutput, explanation: '' }))
  const runnableSamples = problem.samples || []
  const isSubmissionPending = submissionStarting || submission?.verdict === 'Pending'

  return (
    <main id="problem-workspace" className="h-[calc(100dvh-3.5rem)] min-h-140 bg-surface-container-lowest text-on-surface">
      <PanelGroup className="h-full min-h-140" direction={verticalPanels ? 'vertical' : 'horizontal'} autoSaveId={`problem-layout:${slug}`}>
        <Panel defaultSize={verticalPanels ? 48 : 45} minSize={verticalPanels ? 30 : 28} order={1}>
          <section className="flex h-full min-h-0 flex-col border-r border-surface-container-highest bg-surface-container-low">
            <header className="flex min-h-14 items-center justify-between gap-4 border-b border-surface-container-highest px-5 bg-surface-container-lowest/60">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-on-surface font-headline-sm">{problem.title}</p>
                <p className="mt-0.5 truncate text-xs text-on-surface-variant font-label-code-sm">slug: {problem.slug}</p>
              </div>
              <span
                className={`shrink-0 rounded px-2.5 py-0.5 text-xs font-semibold font-label-code-sm uppercase ${
                  problem.difficulty === 'Easy'
                    ? 'bg-primary-container/10 text-primary-container border border-primary-container/20'
                    : problem.difficulty === 'Medium'
                    ? 'bg-secondary-container/20 text-secondary border border-secondary-container/30'
                    : 'bg-error-container/20 text-error border border-error-container/30'
                }`}
              >
                {problem.difficulty}
              </span>
            </header>
            <div className="flex h-11 shrink-0 items-stretch gap-6 border-b border-surface-container-highest px-5 bg-surface-container-lowest/30" role="tablist" aria-label="Problem information">
              {['description', 'submissions'].map((tab) => (
                <button
                  className={`border-b-2 text-xs font-medium capitalize font-label-code-sm transition-colors cursor-pointer ${
                    leftTab === tab
                      ? 'border-primary-container text-primary-container font-semibold'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={leftTab === tab}
                  onClick={() => setLeftTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {leftTab === 'description' ? (
                <>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {(problem.tags || []).map((tag) => (
                      <span
                        className="rounded-full border border-surface-container-highest bg-surface-container px-2.5 py-0.5 text-xs text-on-surface-variant font-body-sm"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <article className="wrap-break-word text-sm">
                    <ReactMarkdown components={markdownComponents}>{problem.description || ''}</ReactMarkdown>
                  </article>
                  {problem.constraints && (
                    <section className="mt-7">
                      <h2 className="text-sm font-semibold text-on-surface font-headline-sm">Constraints</h2>
                      <pre className="mt-3 whitespace-pre-wrap rounded-md border border-surface-container-highest bg-surface-container-lowest p-4 font-mono text-xs leading-6 text-on-surface-variant">
                        {problem.constraints}
                      </pre>
                    </section>
                  )}
                  {samples.length > 0 && (
                    <section className="mt-7 space-y-4">
                      <h2 className="text-sm font-semibold text-on-surface font-headline-sm">Examples</h2>
                      {samples.map((example, index) => (
                        <div className="rounded-md border border-surface-container-highest bg-surface-container-lowest/80 p-4" key={`sample-${index}`}>
                          <p className="mb-3 text-xs font-semibold uppercase text-secondary font-label-code-sm">Example {index + 1}</p>
                          <div className="grid gap-3 text-xs sm:grid-cols-2">
                            <div>
                              <p className="mb-1 text-on-surface-variant font-label-caps uppercase">Input</p>
                              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-on-surface bg-surface-container p-2.5 rounded border border-surface-container-highest font-label-code-sm">{example.input}</pre>
                            </div>
                            <div>
                              <p className="mb-1 text-on-surface-variant font-label-caps uppercase">Output</p>
                              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-primary bg-surface-container p-2.5 rounded border border-surface-container-highest font-label-code-sm">{example.output ?? example.expectedOutput}</pre>
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
                </>
              ) : (
                <div className="-mx-2 overflow-x-auto">
                  {historyError && (
                    <p className="mx-2 mb-3 rounded border border-error-container bg-error-container/20 p-3 text-xs text-error font-body-sm" role="alert">
                      {historyError}
                    </p>
                  )}
                  <table className="w-full min-w-155 border-collapse text-left text-xs font-label-code-sm">
                    <thead className="text-[10px] uppercase text-on-surface-variant border-b border-surface-container-highest font-label-caps">
                      <tr>
                        <th className="px-2 py-2 font-semibold">Time</th>
                        <th className="px-2 py-2 font-semibold">Language</th>
                        <th className="px-2 py-2 font-semibold">Verdict</th>
                        <th className="px-2 py-2 text-right font-semibold">Runtime</th>
                        <th className="px-2 py-2 text-right font-semibold">Memory</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-highest/60">
                      {historyLoading && <tr><td className="px-2 py-8 text-center text-on-surface-variant" colSpan="5">Loading submissions...</td></tr>}
                      {!historyLoading && !historyError && !submissionHistory.length && <tr><td className="px-2 py-8 text-center text-on-surface-variant" colSpan="5">No submissions for this problem yet.</td></tr>}
                      {submissionHistory.map((item) => (
                        <tr
                          className="cursor-pointer hover:bg-surface-container focus:bg-surface-container focus:outline-none transition-colors"
                          key={item._id}
                          tabIndex={0}
                          role="button"
                          aria-label={`View ${item.language} submission with verdict ${item.verdict}`}
                          onClick={() => setSelectedHistory(item)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setSelectedHistory(item)
                            }
                          }}
                        >
                          <td className="whitespace-nowrap px-2 py-3 text-on-surface-variant">{new Date(item.createdAt).toLocaleString()}</td>
                          <td className="px-2 py-3 capitalize text-on-surface">{item.language}</td>
                          <td className={`px-2 py-3 font-semibold ${item.verdict === 'Accepted' ? 'text-primary-container' : item.verdict === 'Pending' ? 'text-secondary' : 'text-error'}`}>{item.verdict}</td>
                          <td className="whitespace-nowrap px-2 py-3 text-right text-on-surface-variant">{item.runtimeMs} ms</td>
                          <td className="whitespace-nowrap px-2 py-3 text-right text-on-surface-variant">{item.memoryKb} KB</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </Panel>

        <PanelResizeHandle className={verticalPanels ? 'h-1.5 cursor-row-resize bg-surface-container-lowest transition-colors hover:bg-primary-container' : 'w-1.5 cursor-col-resize bg-surface-container-lowest transition-colors hover:bg-primary-container'} aria-label="Resize problem panels" />

        <Panel defaultSize={verticalPanels ? 52 : 55} minSize={verticalPanels ? 34 : 32} order={2}>
          <section className="flex h-full min-h-0 flex-col bg-surface-container-lowest">
            <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-surface-container-highest px-4 py-2 bg-surface-container-low/50">
              <label className="flex items-center gap-2 text-xs text-on-surface-variant font-label-code-sm">
                Language
                <select
                  className="rounded border border-surface-container-highest bg-surface-container px-2.5 py-1 text-xs text-on-surface outline-none focus:border-primary-container font-label-code-sm cursor-pointer"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button
                  className="rounded border border-surface-container-highest bg-surface-container hover:bg-surface-container-high px-2.5 py-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer font-label-code-sm"
                  type="button"
                  title="Restore starter code for this language"
                  onClick={resetCode}
                >
                  Reset
                </button>
                <button
                  className="rounded border border-surface-container-highest bg-surface-container hover:bg-surface-container-high px-2.5 py-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer font-label-code-sm"
                  type="button"
                  title="Toggle fullscreen"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1">
              <Editor
                height="100%"
                language={language === 'javascript' ? 'javascript' : 'python'}
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || '')}
                loading={<div className="flex h-full items-center justify-center text-sm text-on-surface-variant font-body-sm">Loading editor...</div>}
                options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, tabSize: 2, automaticLayout: true, padding: { top: 16 } }}
              />
            </div>

            <section className={`shrink-0 border-t border-surface-container-highest bg-surface-container-low ${consoleOpen ? 'h-60' : 'h-11'}`} aria-label="Code console">
              <div className="flex h-11 items-center justify-between border-b border-surface-container-highest px-4 bg-surface-container-lowest/80">
                <button
                  className="flex items-center gap-2 text-xs font-medium text-on-surface font-label-code-sm cursor-pointer hover:text-primary-container transition-colors"
                  type="button"
                  aria-expanded={consoleOpen}
                  onClick={() => setConsoleOpen((open) => !open)}
                >
                  <span className="material-symbols-outlined text-[16px]">{consoleOpen ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}</span>
                  <span>Console &amp; Test Cases</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-surface-container-highest px-3 py-1 text-xs font-semibold disabled:opacity-50 transition-all font-label-code-sm cursor-pointer flex items-center gap-1"
                    type="button"
                    disabled={Boolean(runningAction) || isSubmissionPending}
                    onClick={runCode}
                  >
                    <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                    <span>{runningAction === 'run' ? 'Running...' : 'Run'}</span>
                  </button>
                  <button
                    className="rounded bg-primary-container hover:bg-secondary text-surface-container-lowest px-3.5 py-1 text-xs font-semibold disabled:opacity-50 shadow-xs transition-all font-label-code-sm cursor-pointer flex items-center gap-1"
                    type="button"
                    disabled={Boolean(runningAction) || isSubmissionPending}
                    onClick={submitCode}
                  >
                    <span className="material-symbols-outlined text-[14px]">send</span>
                    <span>{submissionStarting ? 'Submitting...' : submission?.verdict === 'Pending' ? 'Judging...' : 'Submit'}</span>
                  </button>
                </div>
              </div>
              {consoleOpen && (
                <div className="flex h-[calc(100%-2.75rem)] min-h-0 flex-col">
                  <div className="flex h-9 shrink-0 items-stretch gap-5 border-b border-surface-container-highest px-4 bg-surface-container-lowest/40" role="tablist" aria-label="Console views">
                    {['testcase', 'result'].map((tab) => (
                      <button
                        className={`border-b-2 text-xs capitalize font-label-code-sm transition-colors cursor-pointer ${
                          consoleTab === tab
                            ? 'border-primary-container text-primary-container font-semibold'
                            : 'border-transparent text-on-surface-variant hover:text-on-surface'
                        }`}
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={consoleTab === tab}
                        onClick={() => setConsoleTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4 bg-surface-container-lowest/90 font-label-code-sm">
                    {consoleTab === 'testcase' ? (
                      <div className="space-y-3">
                        {runnableSamples.map((sample, index) => (
                          <div className="rounded-md border border-surface-container-highest bg-surface-container p-3" key={`testcase-${index}`}>
                            <p className="mb-2 text-xs font-medium text-secondary font-label-code-sm">Case {index + 1}</p>
                            <pre className="whitespace-pre-wrap wrap-break-word font-mono text-xs leading-5 text-on-surface font-label-code-sm">{sample.input}</pre>
                          </div>
                        ))}
                        {!runnableSamples.length && <p className="text-xs text-on-surface-variant">No visible sample test cases are configured.</p>}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {runningAction && <p className="text-xs text-primary-container animate-pulse">Running sample tests...</p>}
                        {submissionStarting && <p className="text-xs text-secondary animate-pulse">Submitting solution...</p>}
                        {submissionError && <div className="rounded-md border border-error-container bg-error-container/20 p-3 text-xs leading-5 text-error" role="alert">{submissionError}</div>}
                        {submission && (
                          <article className="rounded-md border border-surface-container-highest bg-surface-container p-3">
                            <div className={`rounded-md border p-3 ${submission.verdict === 'Accepted' ? 'border-primary-container/30 bg-primary-container/10 text-primary-container' : submission.verdict === 'Pending' ? 'border-secondary-container/40 bg-secondary-container/20 text-secondary' : 'border-error-container bg-error-container/20 text-error'}`}>
                              <p className="text-sm font-bold font-label-code-md">{submission.verdict === 'Pending' ? 'Judging...' : submission.verdict}</p>
                              {submission.verdict !== 'Pending' && (
                                <p className="mt-1 text-xs font-label-code-sm">Passed {submission.passed} / {submission.total} test cases</p>
                              )}
                              {submission.verdict === 'Accepted' && (
                                <p className="mt-2 text-xs font-label-code-sm text-primary">Runtime {submission.runtimeMs} ms <span className="px-1">·</span> Memory {submission.memoryKb} KB</p>
                              )}
                              {submission.verdict === 'Pending' && submission.total > 0 && (
                                <p className="mt-1 text-xs font-label-code-sm">Passed {submission.passed} / {submission.total} so far</p>
                              )}
                            </div>
                            {submission.failedCase && (
                              <div className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
                                <div className="min-w-0"><p className="mb-1 text-on-surface-variant font-label-caps">Input</p><pre className="max-h-28 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-surface-container-lowest p-2 font-mono text-on-surface border border-surface-container-highest">{submission.failedCase.input}</pre></div>
                                <div className="min-w-0"><p className="mb-1 text-on-surface-variant font-label-caps">Expected</p><pre className="max-h-28 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-surface-container-lowest p-2 font-mono text-primary border border-surface-container-highest">{submission.failedCase.expected}</pre></div>
                                <div className="min-w-0"><p className="mb-1 text-on-surface-variant font-label-caps">Output</p><pre className="max-h-28 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-surface-container-lowest p-2 font-mono text-error border border-surface-container-highest">{submission.failedCase.actual || '(no output)'}</pre></div>
                                {submission.failedCase.error && <div className="rounded border border-error-container bg-error-container/20 p-2 text-xs text-error sm:col-span-3"><p className="font-semibold font-label-code-sm">Execution details</p><pre className="mt-1 whitespace-pre-wrap font-mono">{submission.failedCase.error}</pre></div>}
                              </div>
                            )}
                          </article>
                        )}
                        {runError && <div className="rounded-md border border-error-container bg-error-container/20 p-3 text-xs leading-5 text-error" role="alert"><p className="font-semibold">Execution error</p><pre className="mt-1 whitespace-pre-wrap font-mono">{runError}</pre></div>}
                        {runResults.map((caseResult, index) => (
                          <article className="rounded-md border border-surface-container-highest bg-surface-container p-3" key={`run-case-${index}`}>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`rounded px-2 py-0.5 text-[11px] font-bold font-label-code-sm uppercase ${caseResult.passed ? 'bg-primary-container/10 border border-primary-container/30 text-primary-container' : 'bg-error-container/20 border border-error-container text-error'}`}>{caseResult.passed ? 'Passed' : 'Failed'}</span>
                                <span className="text-xs font-medium text-on-surface font-label-code-sm">Case {index + 1}</span>
                              </div>
                              <span className="text-[11px] text-on-surface-variant font-label-code-sm">{caseResult.time ? `${caseResult.time}s` : 'Time unavailable'}{caseResult.memory ? ` · ${caseResult.memory} KB` : ''}</span>
                            </div>
                            {caseResult.error && <div className="mb-3 rounded border border-error-container bg-error-container/20 p-2 text-xs text-error"><p className="font-semibold font-label-code-sm">{caseResult.statusDescription || 'Execution error'}</p><pre className="mt-1 whitespace-pre-wrap font-mono">{caseResult.error}</pre></div>}
                            <div className="grid gap-3 text-xs sm:grid-cols-3">
                              <div className="min-w-0"><p className="mb-1 text-on-surface-variant font-label-caps">Input</p><pre className="max-h-28 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-surface-container-lowest p-2 font-mono text-on-surface border border-surface-container-highest font-label-code-sm">{caseResult.input}</pre></div>
                              <div className="min-w-0"><p className="mb-1 text-on-surface-variant font-label-caps">Expected</p><pre className="max-h-28 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-surface-container-lowest p-2 font-mono text-primary border border-surface-container-highest font-label-code-sm">{caseResult.expected}</pre></div>
                              <div className="min-w-0"><p className="mb-1 text-on-surface-variant font-label-caps">Output</p><pre className="max-h-28 overflow-auto whitespace-pre-wrap wrap-break-word rounded bg-surface-container-lowest p-2 font-mono text-on-surface border border-surface-container-highest font-label-code-sm">{caseResult.actual || (caseResult.error ? '(no output)' : '')}</pre></div>
                            </div>
                            {!caseResult.passed && !caseResult.error && <p className="mt-2 text-xs text-secondary font-label-code-sm">Output did not match the expected value.</p>}
                          </article>
                        ))}
                        {!runningAction && !submissionStarting && !submission && !submissionError && !runError && !runResults.length && <p className="text-xs text-on-surface-variant font-body-sm">{resultMessage}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </section>
        </Panel>
      </PanelGroup>
      {selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedHistory(null) }}>
          <section className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-surface-container-highest bg-surface-container-low shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="submission-code-title">
            <header className="flex items-center justify-between gap-4 border-b border-surface-container-highest px-5 py-4 bg-surface-container-lowest/70">
              <div>
                <h2 className="text-sm font-semibold text-on-surface font-headline-sm" id="submission-code-title">Submitted code</h2>
                <p className="mt-1 text-xs capitalize text-on-surface-variant font-label-code-sm">{selectedHistory.language} · <span className={selectedHistory.verdict === 'Accepted' ? 'text-primary-container' : 'text-error'}>{selectedHistory.verdict}</span> · {new Date(selectedHistory.createdAt).toLocaleString()}</p>
              </div>
              <button className="rounded border border-surface-container-highest bg-surface-container hover:bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors cursor-pointer font-label-code-sm" type="button" onClick={() => setSelectedHistory(null)}>Close</button>
            </header>
            <div className="min-h-0 flex-1 p-3 bg-surface-container-lowest">
              <Editor
                height="min(68vh, 680px)"
                language={selectedHistory.language === 'javascript' ? 'javascript' : 'python'}
                theme="vs-dark"
                value={selectedHistory.code || ''}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, wordWrap: 'on', automaticLayout: true, padding: { top: 12 } }}
              />
            </div>
          </section>
        </div>
      )}
    </main>
  )
}