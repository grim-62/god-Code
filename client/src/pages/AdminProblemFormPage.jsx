import { useCallback, useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance.js'
import Toast from '../components/Toast.jsx'

const emptyForm = {
  title: '',
  difficulty: 'Easy',
  tags: [],
  description: '',
  constraints: '',
  examples: [],
  starterCode: { python: '', javascript: '' },
  driverCode: { python: '', javascript: '' },
  testCases: [],
  timeLimit: 1000,
  memoryLimit: 256,
}

const PRESET_TAGS = [
  'Array',
  'String',
  'Hash Table',
  'Dynamic Programming',
  'Math',
  'Two Pointers',
  'Binary Search',
  'Trees',
  'Graph',
  'Stack',
  'Greedy',
  'Recursion',
]

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="mb-3 mt-5 text-xl font-semibold text-on-surface tracking-tight border-b border-surface-container-highest pb-2">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-lg font-semibold text-secondary tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-base font-semibold text-on-surface">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-2.5 leading-relaxed text-on-surface-variant font-body-md text-body-md">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 text-on-surface-variant font-body-md text-body-md">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 text-on-surface-variant font-body-md text-body-md">
      {children}
    </ol>
  ),
  code: ({ children }) => (
    <code className="rounded bg-surface-container px-1.5 py-0.5 font-label-code-sm text-label-code-sm text-primary-container border border-surface-container-highest">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-surface-container-lowest border border-surface-container-highest p-3.5 text-xs font-mono text-on-surface">
      {children}
    </pre>
  ),
  strong: ({ children }) => <strong className="font-semibold text-on-surface">{children}</strong>,
}

function normalizeProblem(problem) {
  return {
    ...emptyForm,
    ...problem,
    tags: problem.tags || [],
    examples: problem.examples || [],
    starterCode: { ...emptyForm.starterCode, ...problem.starterCode },
    driverCode: { ...emptyForm.driverCode, ...problem.driverCode },
    testCases: problem.testCases || [],
  }
}

export default function AdminProblemFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [codePanel, setCodePanel] = useState('starterCode')
  const [language, setLanguage] = useState('python')
  const dismissToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!id) {
      setForm(emptyForm)
      setLoadError('')
      setLoading(false)
      return undefined
    }

    let active = true
    setLoading(true)
    setLoadError('')
    axiosInstance
      .get(`/problems/admin/${id}`)
      .then(({ data }) => {
        if (active) setForm(normalizeProblem(data.problem))
      })
      .catch((requestError) => {
        if (active)
          setLoadError(
            requestError.response?.data?.message || 'Unable to load this problem specification.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function addTags(value) {
    const additions = value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    if (!additions.length) return

    setForm((current) => ({
      ...current,
      tags: [
        ...current.tags,
        ...additions.filter(
          (tag) => !current.tags.some((existing) => existing.toLowerCase() === tag.toLowerCase()),
        ),
      ],
    }))
    setTagInput('')
  }

  function togglePresetTag(tag) {
    if (form.tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      setForm((current) => ({
        ...current,
        tags: current.tags.filter((t) => t.toLowerCase() !== tag.toLowerCase()),
      }))
    } else {
      setForm((current) => ({
        ...current,
        tags: [...current.tags, tag],
      }))
    }
  }

  function updateRow(field, index, key, value) {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    }))
  }

  function validateForm() {
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Enter a problem title.'
    if (!['Easy', 'Medium', 'Hard'].includes(form.difficulty))
      nextErrors.difficulty = 'Choose a difficulty.'
    if (!form.description.trim()) nextErrors.description = 'Enter a problem description.'
    if (!Number.isInteger(Number(form.timeLimit)) || Number(form.timeLimit) < 1)
      nextErrors.timeLimit = 'Use a positive integer.'
    if (!Number.isInteger(Number(form.memoryLimit)) || Number(form.memoryLimit) < 1)
      nextErrors.memoryLimit = 'Use a positive integer.'
    if (form.examples.some((example) => !example.input?.trim() || !example.output?.trim()))
      nextErrors.examples = 'Each example requires both an input and an output.'
    if (
      form.testCases.some(
        (testCase) => !testCase.input?.trim() || !testCase.expectedOutput?.trim(),
      )
    )
      nextErrors.testCases = 'Each test case requires both an input and an expected output.'
    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateForm()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setToast({ type: 'error', message: 'Please correct the highlighted fields before saving.' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        timeLimit: Number(form.timeLimit),
        memoryLimit: Number(form.memoryLimit),
      }
      if (id) await axiosInstance.put(`/problems/${id}`, payload)
      else await axiosInstance.post('/problems', payload)
      setToast({
        type: 'success',
        message: id ? 'Problem specification updated.' : 'Problem created and published to repository.',
      })
      window.setTimeout(() => navigate('/admin/problems'), 700)
    } catch (requestError) {
      setToast({
        type: 'error',
        message: requestError.response?.data?.message || 'Unable to save this problem specification.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="w-full bg-surface min-h-[calc(100vh-56px)] flex items-center justify-center p-space-xl">
        <div className="flex flex-col items-center gap-space-md text-on-surface-variant font-label-code-sm">
          <div className="w-8 h-8 rounded-full border-2 border-primary-container border-t-transparent animate-spin"></div>
          <span>Loading specification payload...</span>
        </div>
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="w-full bg-surface min-h-[calc(100vh-56px)] text-on-surface">
        <div className="max-w-3xl mx-auto px-4 md:px-margin-desktop py-space-xl">
          <div className="p-space-lg rounded-xl bg-error-container/20 border border-error-container text-error flex flex-col gap-space-sm">
            <div className="flex items-center gap-2 font-headline-sm">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>Failed to load specification</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface">{loadError}</p>
            <Link
              to="/admin/problems"
              className="mt-2 inline-flex items-center gap-1.5 text-secondary hover:underline font-label-code-sm"
            >
              ← Return to Problem Repository
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const hiddenCount = form.testCases.filter((tc) => tc.isHidden).length

  return (
    <main className="w-full bg-surface min-h-[calc(100vh-56px)] text-on-surface pb-space-xl">
      <Toast message={toast?.message} type={toast?.type} onClose={dismissToast} />

      {/* Cluster Status Top Strip */}
      <div className="bg-surface-container-low px-4 md:px-margin-desktop py-space-sm flex items-center justify-between text-on-surface-variant font-body-sm text-xs border-b border-surface-container-highest">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs font-label-code-sm text-label-code-sm text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
            <span>SPECIFICATION FORGE</span>
          </div>
          <span className="text-surface-container-highest">/</span>
          <span className="font-label-code-sm text-label-code-sm text-on-surface-variant hidden sm:inline">
            {id ? `Editing ID: ${id}` : 'Drafting New Problem'}
          </span>
        </div>
        <div className="flex items-center gap-space-md font-label-code-sm text-label-code-sm">
          <span className="text-on-surface-variant">
            Isolation: <span className="text-primary-container font-medium">gVisor runsc</span>
          </span>
          <span className="text-surface-container-highest hidden sm:inline">|</span>
          <span className="text-on-surface-variant hidden sm:inline">
            Vectors:{' '}
            <span className="text-secondary font-medium">
              {form.testCases.length} ({hiddenCount} blind)
            </span>
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-margin-desktop py-space-lg flex flex-col gap-space-lg">
        {/* Navigation Breadcrumb & Action Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md border-b border-surface-container-highest pb-space-lg">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-xs font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              <Link to="/admin/problems" className="hover:text-on-surface transition-colors">
                Administration
              </Link>
              <span className="text-on-surface-variant font-label-code-sm">/</span>
              <Link to="/admin/problems" className="hover:text-on-surface transition-colors">
                Problem Management
              </Link>
              <span className="text-on-surface-variant font-label-code-sm">/</span>
              <span className="text-on-surface-variant">{id ? 'Edit Spec' : 'New Spec'}</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              {id ? 'Edit Algorithmic Specification' : 'Author Problem Specification'}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Configure parameters, problem statement markdown, test vectors, and multi-language
              execution harnesses.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-space-sm">
            <Link
              to="/admin/problems"
              className="inline-flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-container-highest transition-colors font-body-md text-body-md"
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">arrow_back</span>
              <span>Cancel</span>
            </Link>
            <button
              type="submit"
              form="problem-form"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-space-lg py-2 rounded-lg bg-primary-container hover:bg-secondary text-surface-container-lowest font-medium transition-all shadow-[0_0_16px_rgba(0,245,160,0.25)] font-body-md text-body-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                {saving ? 'hourglass_top' : 'save'}
              </span>
              <span>{saving ? 'Deploying...' : id ? 'Save Specification' : 'Deploy Problem'}</span>
            </button>
          </div>
        </div>

        {/* The Main Form */}
        <form id="problem-form" className="flex flex-col gap-space-lg" onSubmit={handleSubmit}>
          {/* Section 1: Basic Information */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-lg flex flex-col gap-space-md shadow-xs">
            <div className="flex items-center justify-between border-b border-surface-container-highest pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Metadata &amp; Classification
                </h2>
              </div>
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Core Spec
              </span>
            </div>

            <div className="grid gap-space-md md:grid-cols-3">
              {/* Title */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="font-label-code-sm text-label-code-sm text-on-surface flex items-center justify-between">
                  <span>Problem Title</span>
                  <span className="text-on-surface-variant font-normal">e.g. Invert Binary Tree</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter concise descriptive title..."
                  className={`w-full px-3 py-2.5 bg-surface-container text-on-surface rounded-lg font-body-md text-body-md border transition-all outline-none ${
                    errors.title
                      ? 'border-error focus:border-error'
                      : 'border-surface-container-highest focus:border-primary-container focus:bg-surface-container-high'
                  }`}
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                />
                {errors.title && (
                  <span className="font-label-code-sm text-label-code-sm text-error mt-0.5">
                    {errors.title}
                  </span>
                )}
              </div>

              {/* Difficulty */}
              <div className="flex flex-col gap-1">
                <label className="font-label-code-sm text-label-code-sm text-on-surface">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-surface-container rounded-lg border border-surface-container-highest">
                  {[
                    { label: 'Easy', color: 'text-primary-container', activeBg: 'bg-primary-container/20 border-primary-container/40' },
                    { label: 'Medium', color: 'text-secondary', activeBg: 'bg-secondary/20 border-secondary/40' },
                    { label: 'Hard', color: 'text-error', activeBg: 'bg-error-container/40 border-error' },
                  ].map((level) => {
                    const isSelected = form.difficulty === level.label
                    return (
                      <button
                        key={level.label}
                        type="button"
                        onClick={() => setField('difficulty', level.label)}
                        className={`py-1.5 text-center font-label-code-sm text-label-code-sm rounded transition-all border ${
                          isSelected
                            ? `${level.activeBg} ${level.color} font-semibold shadow-xs`
                            : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        {level.label}
                      </button>
                    )
                  })}
                </div>
                {errors.difficulty && (
                  <span className="font-label-code-sm text-label-code-sm text-error mt-0.5">
                    {errors.difficulty}
                  </span>
                )}
              </div>

              {/* Tags Management */}
              <div className="flex flex-col gap-2 md:col-span-3">
                <label className="font-label-code-sm text-label-code-sm text-on-surface flex items-center justify-between">
                  <span>Topic &amp; Algorithm Tags</span>
                  <span className="text-on-surface-variant font-normal">
                    Press Enter or comma to create custom tag
                  </span>
                </label>

                {/* Selected Tags list & input */}
                <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-lg border border-surface-container-highest bg-surface-container px-3 py-2 focus-within:border-primary-container focus-within:bg-surface-container-high transition-all">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded bg-surface-container-high border border-surface-container-highest px-2 py-0.5 font-label-code-sm text-label-code-sm text-secondary"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        aria-label={`Remove tag ${tag}`}
                        onClick={() => setField('tags', form.tags.filter((t) => t !== tag))}
                        className="text-on-surface-variant hover:text-error transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        addTags(tagInput)
                      }
                    }}
                    placeholder={form.tags.length ? 'Add another...' : 'Type tag name and hit enter...'}
                    className="min-w-32 flex-1 bg-transparent border-none text-on-surface placeholder:text-on-surface-variant/40 font-body-md text-body-md outline-none"
                  />
                </div>

                {/* Preset quick tag chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="font-label-code-sm text-label-code-sm text-on-surface-variant mr-1">
                    Quick suggestions:
                  </span>
                  {PRESET_TAGS.map((tag) => {
                    const isSelected = form.tags.some(
                      (t) => t.toLowerCase() === tag.toLowerCase(),
                    )
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => togglePresetTag(tag)}
                        className={`px-2 py-0.5 rounded text-xs transition-colors border ${
                          isSelected
                            ? 'bg-primary-container/10 border-primary-container/30 text-primary-container'
                            : 'bg-surface-container-low border-surface-container-highest text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Execution Limits */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-lg flex flex-col gap-space-md shadow-xs">
            <div className="flex items-center justify-between border-b border-surface-container-highest pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">timer</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Sandbox Quotas &amp; Isolation
                </h2>
              </div>
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Virtualization
              </span>
            </div>

            <div className="grid gap-space-md sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label className="font-label-code-sm text-label-code-sm text-on-surface flex items-center justify-between">
                  <span>Execution Time Limit (ms)</span>
                  <span className="text-on-surface-variant font-normal">Default: 1000ms</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    className="w-full px-3 py-2 bg-surface-container text-on-surface font-label-code-sm rounded-lg border border-surface-container-highest focus:border-primary-container focus:outline-none focus:bg-surface-container-high transition-all"
                    value={form.timeLimit}
                    onChange={(e) => setField('timeLimit', e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-label-code-sm text-on-surface-variant">
                    ms
                  </span>
                </div>
                {errors.timeLimit && (
                  <span className="font-label-code-sm text-label-code-sm text-error mt-0.5">
                    {errors.timeLimit}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-code-sm text-label-code-sm text-on-surface flex items-center justify-between">
                  <span>Memory Limit (MB)</span>
                  <span className="text-on-surface-variant font-normal">Default: 256MB</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="16"
                    step="16"
                    className="w-full px-3 py-2 bg-surface-container text-on-surface font-label-code-sm rounded-lg border border-surface-container-highest focus:border-primary-container focus:outline-none focus:bg-surface-container-high transition-all"
                    value={form.memoryLimit}
                    onChange={(e) => setField('memoryLimit', e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-label-code-sm text-on-surface-variant">
                    MB
                  </span>
                </div>
                {errors.memoryLimit && (
                  <span className="font-label-code-sm text-label-code-sm text-error mt-0.5">
                    {errors.memoryLimit}
                  </span>
                )}
              </div>

              <div className="flex flex-col justify-end">
                <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-highest flex items-center gap-space-sm text-xs font-label-code-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary-container text-[18px]">
                    shield
                  </span>
                  <span>gVisor Linux Namespace isolation strictly enforced per invocation.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Problem Description & Constraints */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-lg flex flex-col gap-space-md shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-space-md border-b border-surface-container-highest pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  description
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Statement &amp; Mathematical Constraints
                </h2>
              </div>

              {/* Markdown Write / Preview Toggle */}
              <div className="inline-flex rounded-lg bg-surface-container p-1 border border-surface-container-highest font-label-code-sm text-label-code-sm">
                <button
                  type="button"
                  onClick={() => setPreview(false)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all ${
                    !preview
                      ? 'bg-surface-container-high text-on-surface font-medium shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">edit_note</span>
                  <span>Editor (Markdown)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(true)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all ${
                    preview
                      ? 'bg-surface-container-high text-on-surface font-medium shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">visibility</span>
                  <span>Live Preview</span>
                </button>
              </div>
            </div>

            {/* Description Body */}
            <div className="flex flex-col gap-1">
              <label className="font-label-code-sm text-label-code-sm text-on-surface">
                Specification Statement (Markdown)
              </label>

              {preview ? (
                <div className="min-h-72 w-full rounded-lg border border-surface-container-highest bg-surface-container p-space-lg overflow-y-auto">
                  {form.description ? (
                    <ReactMarkdown components={markdownComponents}>{form.description}</ReactMarkdown>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant/40 font-label-code-sm text-center">
                      <span className="material-symbols-outlined text-[32px] mb-1">markdown</span>
                      <span>No description written yet. Switch to Editor to compose.</span>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  rows={10}
                  className={`w-full rounded-lg bg-surface-container p-3 font-mono text-xs leading-relaxed text-on-surface border transition-all outline-none focus:bg-surface-container-high ${
                    errors.description
                      ? 'border-error focus:border-error'
                      : 'border-surface-container-highest focus:border-primary-container'
                  }`}
                  placeholder="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target..."
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                />
              )}
              {errors.description && (
                <span className="font-label-code-sm text-label-code-sm text-error mt-0.5">
                  {errors.description}
                </span>
              )}
            </div>

            {/* Constraints */}
            <div className="flex flex-col gap-1">
              <label className="font-label-code-sm text-label-code-sm text-on-surface flex items-center justify-between">
                <span>Algorithmic &amp; Input Constraints</span>
                <span className="text-on-surface-variant font-normal">
                  e.g. 2 ≤ nums.length ≤ 10^4
                </span>
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg bg-surface-container p-3 font-mono text-xs leading-relaxed text-on-surface border border-surface-container-highest focus:border-primary-container focus:bg-surface-container-high outline-none transition-all"
                placeholder="2 <= nums.length <= 10^4&#10;-10^9 <= nums[i] <= 10^9&#10;Only one valid answer exists."
                value={form.constraints}
                onChange={(e) => setField('constraints', e.target.value)}
              />
            </div>
          </div>

          {/* Section 4: Public Examples */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-lg flex flex-col gap-space-md shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-space-md border-b border-surface-container-highest pb-space-sm">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    quiz
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Public Examples &amp; Walkthroughs
                  </h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Visible to candidates on problem detail page to clarify input/output format.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setField('examples', [
                    ...form.examples,
                    { input: '', output: '', explanation: '' },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-container-highest font-label-code-sm text-label-code-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-primary-container">
                  add
                </span>
                <span>Add Example</span>
              </button>
            </div>

            {errors.examples && (
              <p className="font-label-code-sm text-label-code-sm text-error">{errors.examples}</p>
            )}

            <div className="flex flex-col gap-space-md">
              {form.examples.map((example, index) => (
                <div
                  key={`example-${index}`}
                  className="rounded-xl border border-surface-container-highest bg-surface-container/60 p-space-md flex flex-col gap-space-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-code-sm text-label-code-sm text-secondary font-medium">
                      EXAMPLE {String(index + 1).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setField(
                          'examples',
                          form.examples.filter((_, rowIndex) => rowIndex !== index),
                        )
                      }
                      className="text-on-surface-variant hover:text-error text-xs font-label-code-sm transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid gap-space-sm md:grid-cols-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-label-code-sm text-on-surface-variant">
                        Input
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded bg-surface-container-lowest p-2 font-mono text-xs text-on-surface border border-surface-container-highest focus:border-primary-container outline-none"
                        value={example.input}
                        onChange={(e) => updateRow('examples', index, 'input', e.target.value)}
                        placeholder="nums = [2,7,11,15], target = 9"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-label-code-sm text-on-surface-variant">
                        Output
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded bg-surface-container-lowest p-2 font-mono text-xs text-on-surface border border-surface-container-highest focus:border-primary-container outline-none"
                        value={example.output}
                        onChange={(e) => updateRow('examples', index, 'output', e.target.value)}
                        placeholder="[0,1]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-label-code-sm text-on-surface-variant">
                        Explanation (optional)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded bg-surface-container-lowest p-2 font-body-sm text-xs text-on-surface border border-surface-container-highest focus:border-primary-container outline-none"
                        value={example.explanation}
                        onChange={(e) =>
                          updateRow('examples', index, 'explanation', e.target.value)
                        }
                        placeholder="Because nums[0] + nums[1] == 9, we return [0, 1]."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {form.examples.length === 0 && (
                <div className="p-space-lg text-center border border-dashed border-surface-container-highest rounded-xl text-on-surface-variant font-label-code-sm text-xs">
                  No public examples defined yet. Click "Add Example" above.
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Starter & Driver Code Harness */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-lg flex flex-col gap-space-md shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-space-md border-b border-surface-container-highest pb-space-sm">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    terminal
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Code Stubs &amp; Sandbox Driver Harness
                  </h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Starter code is displayed to the candidate; driver code wraps their submission in
                  Judge0 sandboxes.
                </p>
              </div>

              {/* Code Panel & Language Selector */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Starter vs Driver Toggle */}
                <div className="inline-flex rounded-lg bg-surface-container p-1 border border-surface-container-highest font-label-code-sm text-label-code-sm">
                  {['starterCode', 'driverCode'].map((field) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => setCodePanel(field)}
                      className={`px-3 py-1 rounded transition-all ${
                        codePanel === field
                          ? 'bg-surface-container-high text-on-surface font-medium shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {field === 'starterCode' ? 'Starter Code (Candidate)' : 'Driver Code (Harness)'}
                    </button>
                  ))}
                </div>

                {/* Language Toggle */}
                <div className="inline-flex rounded-lg bg-surface-container p-1 border border-surface-container-highest font-label-code-sm text-label-code-sm">
                  {['python', 'javascript'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1 rounded capitalize transition-all ${
                        language === lang
                          ? 'bg-primary-container/20 text-primary-container font-semibold border border-primary-container/30'
                          : 'border border-transparent text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Driver code reminder */}
            {codePanel === 'driverCode' && (
              <div className="p-3 rounded-lg bg-surface-container border border-surface-container-highest flex items-center gap-space-sm text-xs font-label-code-sm text-secondary">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>
                  The driver harness MUST contain the string{' '}
                  <code className="text-primary-container bg-surface-container-lowest px-1.5 py-0.5 rounded border border-surface-container-highest">
                    {'{{USER_CODE}}'}
                  </code>
                  , which is automatically substituted with the candidate's solution during
                  evaluation.
                </span>
              </div>
            )}

            {/* Monaco Editor Container */}
            <div className="overflow-hidden rounded-xl border border-surface-container-highest bg-[#121318] shadow-inner">
              <div className="bg-surface-container-lowest px-4 py-2 border-b border-surface-container-highest flex items-center justify-between font-label-code-sm text-xs text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                  <span className="ml-2 font-medium text-on-surface">
                    {codePanel === 'starterCode' ? 'candidate_stub' : 'sandbox_driver'}.
                    {language === 'javascript' ? 'js' : 'py'}
                  </span>
                </div>
                <span>Monaco JetBrains Mono</span>
              </div>

              <Editor
                height="320px"
                language={language === 'javascript' ? 'javascript' : 'python'}
                theme="vs-dark"
                value={form[codePanel][language]}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    [codePanel]: { ...current[codePanel], [language]: value || '' },
                  }))
                }
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, monospace',
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  lineNumbersMinChars: 3,
                }}
              />
            </div>
          </div>

          {/* Section 6: Validation Test Vectors */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-lg flex flex-col gap-space-md shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-space-md border-b border-surface-container-highest pb-space-sm">
              <div>
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    verified_user
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Validation Test Vectors ({form.testCases.length})
                  </h2>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Hidden vectors remain confidential and are strictly executed inside the sandbox
                  during submission grading.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setField('testCases', [
                    ...form.testCases,
                    { input: '', expectedOutput: '', isHidden: true },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-container-highest font-label-code-sm text-label-code-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-primary-container">
                  add
                </span>
                <span>Add Test Vector</span>
              </button>
            </div>

            {errors.testCases && (
              <p className="font-label-code-sm text-label-code-sm text-error">{errors.testCases}</p>
            )}

            <div className="flex flex-col gap-space-md">
              {form.testCases.map((testCase, index) => (
                <div
                  key={`test-${index}`}
                  className="rounded-xl border border-surface-container-highest bg-surface-container/60 p-space-md flex flex-col gap-space-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-label-code-sm text-label-code-sm text-secondary font-medium">
                        VECTOR {String(index + 1).padStart(2, '0')}
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer ml-2">
                        <input
                          type="checkbox"
                          checked={testCase.isHidden}
                          onChange={(e) => updateRow('testCases', index, 'isHidden', e.target.checked)}
                          className="accent-[#00f5a0] w-3.5 h-3.5 rounded"
                        />
                        <span
                          className={`font-label-code-sm text-xs px-2 py-0.5 rounded border ${
                            testCase.isHidden
                              ? 'bg-primary-container/10 border-primary-container/30 text-primary-container'
                              : 'bg-surface-container-highest border-surface-container-highest text-on-surface-variant'
                          }`}
                        >
                          {testCase.isHidden ? '🔒 Hidden (Blind)' : '👁 Public Vector'}
                        </span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setField(
                          'testCases',
                          form.testCases.filter((_, rowIndex) => rowIndex !== index),
                        )
                      }
                      className="text-on-surface-variant hover:text-error text-xs font-label-code-sm transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid gap-space-sm md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-label-code-sm text-on-surface-variant">
                        Standard Input (stdin or parameters)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded bg-surface-container-lowest p-2 font-mono text-xs text-on-surface border border-surface-container-highest focus:border-primary-container outline-none"
                        value={testCase.input}
                        onChange={(e) => updateRow('testCases', index, 'input', e.target.value)}
                        placeholder="[2,7,11,15]&#10;9"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-label-code-sm text-on-surface-variant">
                        Expected Standard Output
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded bg-surface-container-lowest p-2 font-mono text-xs text-on-surface border border-surface-container-highest focus:border-primary-container outline-none"
                        value={testCase.expectedOutput}
                        onChange={(e) =>
                          updateRow('testCases', index, 'expectedOutput', e.target.value)
                        }
                        placeholder="[0,1]"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {form.testCases.length === 0 && (
                <div className="p-space-lg text-center border border-dashed border-surface-container-highest rounded-xl text-on-surface-variant font-label-code-sm text-xs">
                  No test vectors defined. Click "Add Test Vector" above.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-space-md border-t border-surface-container-highest pt-space-lg">
            <Link
              to="/admin/problems"
              className="inline-flex items-center gap-1 text-on-surface-variant hover:text-on-surface font-body-md text-body-md transition-colors"
            >
              ← Discard changes and return to catalog
            </Link>

            <div className="flex items-center gap-space-sm">
              <Link
                to="/admin/problems"
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
                  {saving ? 'hourglass_top' : 'check_circle'}
                </span>
                <span>{saving ? 'Deploying...' : id ? 'Update Specification' : 'Deploy Problem'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}