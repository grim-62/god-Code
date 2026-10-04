import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance.js'
import Toast from '../components/Toast.jsx'

function toLocalDateTime(value) {
  const date = new Date(value)
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function initialForm() {
  const start = new Date(Date.now() + 60 * 60_000)
  const end = new Date(start.getTime() + 120 * 60_000)
  return {
    title: '',
    startTime: toLocalDateTime(start),
    endTime: toLocalDateTime(end),
    duration: 60,
    problems: [],
  }
}

export default function AdminExamFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [problems, setProblems] = useState([])
  const [problemToAdd, setProblemToAdd] = useState('')
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      axiosInstance.get('/problems', { params: { page: 1, limit: 100 } }),
      id ? axiosInstance.get(`/exams/${id}`) : Promise.resolve(null),
    ])
      .then(([problemResponse, examResponse]) => {
        if (!active) return
        setProblems(problemResponse.data.problems || [])
        if (examResponse) {
          const exam = examResponse.data.exam
          setForm({
            title: exam.title,
            startTime: toLocalDateTime(exam.startTime),
            endTime: toLocalDateTime(exam.endTime),
            duration: exam.duration,
            problems: exam.problems.map((entry) => ({
              problem: entry.problem._id,
              marks: entry.marks,
              title: entry.problem.title,
            })),
          })
        }
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.response?.data?.message || 'Unable to load exam configuration payload.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  function addProblem() {
    const problem = problems.find((item) => item._id === problemToAdd)
    if (!problem || form.problems.some((entry) => entry.problem === problem._id)) return
    setForm((current) => ({
      ...current,
      problems: [
        ...current.problems,
        { problem: problem._id, marks: 100, title: problem.title },
      ],
    }))
    setProblemToAdd('')
  }

  function updateProblem(problemId, marks) {
    setForm((current) => ({
      ...current,
      problems: current.problems.map((entry) =>
        entry.problem === problemId ? { ...entry, marks: Number(marks) } : entry,
      ),
    }))
  }

  function removeProblem(problemId) {
    setForm((current) => ({
      ...current,
      problems: current.problems.filter((entry) => entry.problem !== problemId),
    }))
  }

  async function submit(event) {
    event.preventDefault()
    if (!form.title.trim()) return setError('Enter a descriptive exam title.')
    if (!form.problems.length) return setError('Add at least one problem to this exam track.')
    if (new Date(form.endTime) <= new Date(form.startTime))
      return setError('End time window must be strictly after the start time.')
    if (!Number.isInteger(Number(form.duration)) || Number(form.duration) < 1)
      return setError('Duration must be a positive integer in minutes.')

    setSaving(true)
    setError('')
    const payload = {
      ...form,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
      duration: Number(form.duration),
      problems: form.problems.map(({ problem, marks }) => ({ problem, marks: Number(marks) })),
    }
    try {
      if (id) await axiosInstance.put(`/exams/${id}`, payload)
      else await axiosInstance.post('/exams', payload)
      setToast(
        id ? 'Exam specification updated.' : 'Exam track provisioned and dispatched successfully.',
      )
      window.setTimeout(() => navigate('/admin/exams'), 600)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to dispatch the examination.')
    } finally {
      setSaving(false)
    }
  }

  const totalMarks = useMemo(() => {
    return form.problems.reduce((sum, p) => sum + (Number(p.marks) || 0), 0)
  }, [form.problems])

  if (loading) {
    return (
      <main className="w-full bg-surface min-h-[calc(100vh-56px)] flex items-center justify-center p-space-xl">
        <div className="flex flex-col items-center gap-space-md text-on-surface-variant font-label-code-sm">
          <div className="w-8 h-8 rounded-full border-2 border-primary-container border-t-transparent animate-spin"></div>
          <span>Loading exam dispatcher configuration...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="w-full bg-surface min-h-[calc(100vh-56px)] text-on-surface pb-space-xl">
      <Toast message={toast} onClose={() => setToast('')} />

      {/* Cluster Status Top Strip */}
      <div className="bg-surface-container-low px-4 md:px-margin-desktop py-space-sm flex items-center justify-between text-on-surface-variant font-body-sm text-xs border-b border-surface-container-highest">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs font-label-code-sm text-label-code-sm text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
            <span>EXAM DISPATCHER HARNESS</span>
          </div>
          <span className="text-surface-container-highest">/</span>
          <span className="font-label-code-sm text-label-code-sm text-on-surface-variant hidden sm:inline">
            {id ? `Editing Exam: ${id}` : 'Scheduling Competitive Track'}
          </span>
        </div>
        <div className="flex items-center gap-space-md font-label-code-sm text-label-code-sm">
          <span className="text-on-surface-variant">
            Judge0 Virtualization: <span className="text-primary font-medium">100% Blind</span>
          </span>
          <span className="text-surface-container-highest hidden sm:inline">|</span>
          <span className="text-on-surface-variant hidden sm:inline">
            Bundled Problems:{' '}
            <span className="text-secondary font-medium">{form.problems.length}</span>
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 md:px-margin-desktop py-space-lg flex flex-col gap-space-lg">
        {/* Navigation Breadcrumb & Action Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md border-b border-surface-container-highest pb-space-lg">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-xs font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              <Link to="/admin/exams" className="hover:text-on-surface transition-colors">
                Administration
              </Link>
              <span className="text-on-surface-variant font-label-code-sm">/</span>
              <Link to="/admin/exams" className="hover:text-on-surface transition-colors">
                Exam Dispatcher
              </Link>
              <span className="text-on-surface-variant font-label-code-sm">/</span>
              <span className="text-on-surface-variant">{id ? 'Edit Track' : 'New Dispatch'}</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              {id ? 'Edit Competitive Examination' : 'Dispatch New Examination Pod'}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Configure timing windows, candidate runtime quotas, and select problem specifications
              for automated evaluation.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-space-sm">
            <Link
              to="/admin/exams"
              className="inline-flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-container-highest transition-colors font-body-md text-body-md"
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">arrow_back</span>
              <span>Cancel</span>
            </Link>
            <button
              type="submit"
              form="exam-form"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-space-lg py-2 rounded-lg bg-primary-container hover:bg-secondary text-surface-container-lowest font-medium transition-all shadow-[0_0_16px_rgba(0,245,160,0.25)] font-body-md text-body-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                {saving ? 'hourglass_top' : 'bolt'}
              </span>
              <span>{saving ? 'Dispatching...' : id ? 'Update Exam' : 'Dispatch Exam'}</span>
            </button>
          </div>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="p-space-md rounded-xl bg-error-container/20 border border-error-container text-error flex items-center gap-2 font-body-md text-body-md">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Telemetry Summary Bento Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-md flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-caps text-label-caps uppercase">Track Duration</span>
              <span className="material-symbols-outlined text-[18px] text-primary-container">timer</span>
            </div>
            <div className="mt-space-sm flex items-baseline gap-2">
              <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                {form.duration || 0}
              </span>
              <span className="font-label-code-sm text-label-code-sm text-secondary">Minutes</span>
            </div>
          </div>

          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-md flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-caps text-label-caps uppercase">Bundled Problems</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">quiz</span>
            </div>
            <div className="mt-space-sm flex items-baseline gap-2">
              <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                {form.problems.length}
              </span>
              <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                Challenges Selected
              </span>
            </div>
          </div>

          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-md flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-caps text-label-caps uppercase">Maximum Score</span>
              <span className="material-symbols-outlined text-[18px] text-primary-fixed">military_tech</span>
            </div>
            <div className="mt-space-sm flex items-baseline gap-2">
              <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                {totalMarks}
              </span>
              <span className="font-label-code-sm text-label-code-sm text-primary-container">
                Total Points
              </span>
            </div>
          </div>
        </div>

        {/* The Form */}
        <form id="exam-form" className="flex flex-col gap-space-lg" onSubmit={submit}>
          {/* Card 1: Core Schedule & Temporal Window */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-lg flex flex-col gap-space-md shadow-xs">
            <div className="flex items-center justify-between border-b border-surface-container-highest pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">calendar_clock</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Schedule &amp; Examination Window
                </h2>
              </div>
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Temporal Config
              </span>
            </div>

            <div className="grid gap-space-md sm:grid-cols-2">
              {/* Exam Title */}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="font-label-code-sm text-label-code-sm text-on-surface flex items-center justify-between">
                  <span>Examination Title</span>
                  <span className="text-on-surface-variant font-normal">
                    e.g. Master Algorithms Invitational 2026
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spring 2026 Competitive Code Invitational"
                  className="w-full px-3 py-2.5 bg-surface-container text-on-surface rounded-lg font-body-md text-body-md border border-surface-container-highest focus:border-primary-container focus:bg-surface-container-high transition-all outline-none"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Start Window */}
              <div className="flex flex-col gap-1">
                <label className="font-label-code-sm text-label-code-sm text-on-surface">
                  Start Window (Candidate Access Begins)
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 bg-surface-container text-on-surface font-label-code-sm rounded-lg border border-surface-container-highest focus:border-primary-container focus:outline-none focus:bg-surface-container-high transition-all"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>

              {/* End Window */}
              <div className="flex flex-col gap-1">
                <label className="font-label-code-sm text-label-code-sm text-on-surface">
                  End Window (Harness Submissions Close)
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 bg-surface-container text-on-surface font-label-code-sm rounded-lg border border-surface-container-highest focus:border-primary-container focus:outline-none focus:bg-surface-container-high transition-all"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="font-label-code-sm text-label-code-sm text-on-surface flex items-center justify-between">
                  <span>Candidate Session Duration (Minutes)</span>
                  <span className="text-on-surface-variant font-normal">
                    Timer starts when candidate initializes the exam workspace
                  </span>
                </label>
                <div className="relative max-w-sm">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 bg-surface-container text-on-surface font-label-code-sm rounded-lg border border-surface-container-highest focus:border-primary-container focus:outline-none focus:bg-surface-container-high transition-all"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-label-code-sm text-on-surface-variant">
                    Minutes
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Security & Integrity Safeguards */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-lg flex flex-col gap-space-md shadow-xs">
            <div className="flex items-center justify-between border-b border-surface-container-highest pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">security</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Proctoring &amp; Virtualization Safeguards
                </h2>
              </div>
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Enforcement
              </span>
            </div>

            <div className="grid gap-space-sm sm:grid-cols-2">
              <div className="flex items-start gap-space-sm p-3 rounded-lg bg-surface-container border border-surface-container-highest">
                <input
                  type="checkbox"
                  id="lock-screen"
                  defaultChecked
                  className="accent-[#00f5a0] w-4 h-4 rounded mt-0.5"
                />
                <label htmlFor="lock-screen" className="flex flex-col cursor-pointer">
                  <span className="font-body-md text-body-md font-medium text-on-surface">
                    Strict Fullscreen &amp; Tab Blur Auditing
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Flags and timestamps candidate focus loss to proctor log.
                  </span>
                </label>
              </div>

              <div className="flex items-start gap-space-sm p-3 rounded-lg bg-surface-container border border-surface-container-highest">
                <input
                  type="checkbox"
                  id="blind-mask"
                  defaultChecked
                  className="accent-[#00f5a0] w-4 h-4 rounded mt-0.5"
                />
                <label htmlFor="blind-mask" className="flex flex-col cursor-pointer">
                  <span className="font-body-md text-body-md font-medium text-on-surface">
                    100% Blind Test Harness
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    All test case vectors remain strictly obscured during live test window.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: Bundled Problems & Score Weights */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-lg flex flex-col gap-space-md shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-space-md border-b border-surface-container-highest pb-space-sm">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px]">assignment</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Problem Catalog Bundle ({form.problems.length})
                  </h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Select algorithmic specs to include in this exam track and assign scoring points.
                </p>
              </div>

              {/* Problem Chooser & Add */}
              <div className="flex items-center gap-space-xs w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <select
                    className="w-full appearance-none bg-surface-container text-on-surface font-body-md text-body-md pl-3 pr-8 py-2 rounded-lg border border-surface-container-highest focus:border-primary-container outline-none cursor-pointer"
                    value={problemToAdd}
                    onChange={(e) => setProblemToAdd(e.target.value)}
                  >
                    <option value="">Select problem to bundle...</option>
                    {problems.map((problem) => (
                      <option
                        key={problem._id}
                        value={problem._id}
                        disabled={form.problems.some((entry) => entry.problem === problem._id)}
                      >
                        [{problem.difficulty}] {problem.title}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">
                    expand_more
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addProblem}
                  disabled={!problemToAdd}
                  className="inline-flex items-center gap-1 px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-container-highest font-label-code-sm text-label-code-sm transition-colors disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary-container">
                    add
                  </span>
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Selected Problems List */}
            <div className="flex flex-col gap-space-sm">
              {form.problems.map((entry, index) => {
                const problemMeta = problems.find((p) => p._id === entry.problem)
                const difficulty = problemMeta?.difficulty || 'Medium'

                return (
                  <div
                    key={entry.problem}
                    className="flex flex-wrap items-center justify-between gap-space-md p-space-md rounded-xl bg-surface-container/60 border border-surface-container-highest hover:bg-surface-container transition-all"
                  >
                    <div className="flex items-center gap-space-md">
                      <span className="w-7 h-7 rounded-lg bg-surface-container-high border border-surface-container-highest flex items-center justify-center font-label-code-sm text-xs font-semibold text-secondary">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-body-md text-body-md font-medium text-on-surface">
                          {entry.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`font-label-code-sm text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                              difficulty === 'Easy'
                                ? 'bg-primary-container/20 text-primary-container'
                                : difficulty === 'Hard'
                                  ? 'bg-error-container/40 text-error'
                                  : 'bg-secondary/20 text-secondary'
                            }`}
                          >
                            {difficulty}
                          </span>
                          <span className="font-label-code-sm text-[11px] text-on-surface-variant">
                            ID: {entry.problem.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-md">
                      <div className="flex items-center gap-2">
                        <label className="font-label-code-sm text-xs text-on-surface-variant">
                          Score Weight:
                        </label>
                        <div className="relative w-28">
                          <input
                            type="number"
                            min="1"
                            step="10"
                            className="w-full px-2.5 py-1.5 bg-surface-container-lowest text-on-surface font-label-code-sm text-xs rounded border border-surface-container-highest focus:border-primary-container outline-none"
                            value={entry.marks}
                            onChange={(e) => updateProblem(entry.problem, e.target.value)}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-label-code-sm text-on-surface-variant">
                            PTS
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeProblem(entry.problem)}
                        className="text-on-surface-variant hover:text-error text-xs font-label-code-sm transition-colors flex items-center gap-1"
                        title="Remove problem from exam"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                )
              })}

              {form.problems.length === 0 && (
                <div className="p-space-xl text-center border border-dashed border-surface-container-highest rounded-xl text-on-surface-variant font-label-code-sm text-xs flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40">
                    assignment_late
                  </span>
                  <span>No problems bundled into this examination track yet.</span>
                  <span className="text-[11px] text-on-surface-variant/60">
                    Use the dropdown above to add problems.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-space-md border-t border-surface-container-highest pt-space-lg">
            <Link
              to="/admin/exams"
              className="inline-flex items-center gap-1 text-on-surface-variant hover:text-on-surface font-body-md text-body-md transition-colors"
            >
              ← Discard changes and return to exams
            </Link>

            <div className="flex items-center gap-space-sm">
              <Link
                to="/admin/exams"
                className="px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-container-highest font-body-md text-body-md transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-space-xl py-2 rounded-lg bg-primary-container hover:bg-secondary text-surface-container-lowest font-medium transition-all shadow-[0_0_16px_rgba(0,245,160,0.25)] font-body-md text-body-md disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {saving ? 'hourglass_top' : 'bolt'}
                </span>
                <span>{saving ? 'Dispatching...' : id ? 'Save Specification' : 'Dispatch Exam'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}