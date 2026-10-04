import { useCallback, useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axiosInstance from '../api/axiosInstance.js'
import Toast from '../components/Toast.jsx'
import { fetchProblems } from '../features/problems/problemSlice.js'

export default function AdminPage() {
  const dispatch = useDispatch()
  const { problems, pagination, listStatus, error } = useSelector((state) => state.problems)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [deletingId, setDeletingId] = useState(null)
  const [toast, setToast] = useState(null)
  const dismissToast = useCallback(() => setToast(null), [])
  const pageSize = 25

  useEffect(() => {
    dispatch(
      fetchProblems({
        page,
        limit: pageSize,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
      }),
    )
  }, [dispatch, page, difficultyFilter])

  async function handleDelete(problem) {
    if (!window.confirm(`Delete "${problem.title}"? This cannot be undone.`)) return

    setDeletingId(problem._id)
    try {
      await axiosInstance.delete(`/problems/${problem._id}`)
      setToast({ type: 'success', message: `Problem "${problem.title}" deleted.` })
      if (problems.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await dispatch(
          fetchProblems({
            page,
            limit: pageSize,
            difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
          }),
        ).unwrap()
      }
    } catch (requestError) {
      setToast({
        type: 'error',
        message: requestError.response?.data?.message || 'Unable to delete this problem.',
      })
    } finally {
      setDeletingId(null)
    }
  }

  // Filter problems locally by search input
  const filteredProblems = useMemo(() => {
    if (!searchInput.trim()) return problems
    const q = searchInput.toLowerCase()
    return problems.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q)),
    )
  }, [problems, searchInput])

  const totalCount = pagination.total || problems.length
  const easyCount = useMemo(() => problems.filter((p) => p.difficulty === 'Easy').length, [problems])
  const medCount = useMemo(() => problems.filter((p) => p.difficulty === 'Medium').length, [problems])
  const hardCount = useMemo(() => problems.filter((p) => p.difficulty === 'Hard').length, [problems])

  return (
    <main className="w-full bg-surface min-h-[calc(100vh-56px)] text-on-surface">
      <Toast message={toast?.message} type={toast?.type} onClose={dismissToast} />

      <div className="max-w-7xl mx-auto w-full px-4 md:px-margin-desktop py-space-xl flex flex-col gap-space-lg">
        {/* Header & Action Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-xs font-label-caps text-label-caps uppercase tracking-wider text-secondary">
              <span>Administration</span>
              <span className="text-on-surface-variant font-label-code-sm">/</span>
              <span className="text-on-surface-variant">Problem Management</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              Problem Repository &amp; Test Suites
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Author, calibrate, and deploy algorithmic specifications and hidden test harnesses.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-space-sm pt-2 lg:pt-0">
            <Link
              to="/admin/exams"
              className="inline-flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface border border-surface-container-highest transition-colors font-body-md text-body-md"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">assignment</span>
              <span>Manage Exams</span>
            </Link>
            <Link
              to="/admin/problems/new"
              className="inline-flex items-center gap-1.5 px-space-lg py-2 rounded-lg bg-primary-container hover:bg-secondary text-surface-container-lowest font-medium transition-all shadow-[0_0_16px_rgba(0,245,160,0.25)] font-body-md text-body-md"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Problem</span>
            </Link>
          </div>
        </div>

        {/* Quick Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Metric 1 */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-md flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-caps text-label-caps uppercase">Catalog Volume</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">database</span>
            </div>
            <div className="mt-space-sm flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                  {totalCount}
                </span>
                <span className="font-label-code-sm text-label-code-sm text-secondary">Active</span>
              </div>
              <span className="font-label-code-sm text-label-code-sm text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5 rounded">
                page {page}
              </span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-md flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-caps text-label-caps uppercase">Difficulty Breakdown</span>
              <span className="material-symbols-outlined text-[18px] text-primary-fixed">tune</span>
            </div>
            <div className="mt-space-sm flex items-baseline justify-between">
              <div className="flex items-center gap-2 font-label-code-sm text-label-code-sm">
                <span className="text-primary-container">{easyCount}E</span>
                <span className="text-on-surface-variant/40">•</span>
                <span className="text-secondary">{medCount}M</span>
                <span className="text-on-surface-variant/40">•</span>
                <span className="text-error">{hardCount}H</span>
              </div>
              <span className="font-label-code-sm text-label-code-sm text-primary-container bg-primary-container/10 border border-primary-container/20 px-1.5 py-0.5 rounded font-semibold">
                Calibrated
              </span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-md flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-caps text-label-caps uppercase">Avg Runner Latency</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">speed</span>
            </div>
            <div className="mt-space-sm flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                  18.4ms
                </span>
                <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">p95</span>
              </div>
              <span className="font-label-code-sm text-label-code-sm text-secondary bg-surface-container-highest px-1.5 py-0.5 rounded">
                gVisor isolator
              </span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-md flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-label-caps text-label-caps uppercase">Sandbox Fault Rate</span>
              <span className="material-symbols-outlined text-[18px] text-secondary">shield_lock</span>
            </div>
            <div className="mt-space-sm flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                  0.00%
                </span>
                <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">Taint</span>
              </div>
              <span className="font-label-code-sm text-label-code-sm text-primary-container bg-primary-container/10 border border-primary-container/20 px-1.5 py-0.5 rounded">
                All secure
              </span>
            </div>
          </div>
        </div>

        {/* Advanced Filter & Search Toolbar */}
        <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-md flex flex-col gap-space-md shadow-xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
                search
              </span>
              <input
                className="w-full pl-9 pr-4 py-2 bg-surface-container text-on-surface placeholder:text-on-surface-variant/60 rounded-lg text-body-md font-body-md border border-transparent focus:border-surface-container-highest focus:outline-none focus:bg-surface-container-high transition-all"
                placeholder="Filter by title, slug, or tag..."
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Filter Selects */}
            <div className="flex flex-wrap items-center gap-space-xs">
              <div className="relative">
                <select
                  className="appearance-none bg-surface-container text-on-surface font-body-md text-body-md pl-3 pr-8 py-2 rounded-lg cursor-pointer border border-surface-container-highest hover:bg-surface-container-high transition-colors focus:outline-none"
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                  <option value="all">Difficulty: All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">
                  expand_more
                </span>
              </div>

              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="px-space-md py-2 text-on-surface-variant hover:text-on-surface font-body-md text-body-md transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-space-md rounded-xl bg-error-container/20 border border-error-container text-error font-body-md text-body-md">
            {error}
          </div>
        )}

        {/* Problems Table Surface */}
        <section className="bg-surface-container-low border border-surface-container-highest rounded-xl overflow-hidden shadow-xl flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-12 px-space-lg py-space-sm bg-surface-container font-label-caps text-label-caps text-on-surface-variant tracking-wider uppercase items-center border-b border-surface-container-highest select-none">
            <div className="col-span-5 sm:col-span-5">Problem Specification</div>
            <div className="col-span-3 sm:col-span-2">Difficulty</div>
            <div className="hidden sm:block sm:col-span-3">System Tags</div>
            <div className="col-span-4 sm:col-span-2 text-right">Actions</div>
          </div>

          {/* Body */}
          <div className="flex flex-col divide-y divide-surface-container-highest/40">
            {listStatus === 'loading' && problems.length === 0 && (
              <div className="py-16 text-center text-on-surface-variant font-body-md flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-secondary animate-spin">
                  refresh
                </span>
                <span>Synchronizing catalog...</span>
              </div>
            )}

            {listStatus !== 'loading' && filteredProblems.length === 0 && !error && (
              <div className="py-16 text-center text-on-surface-variant font-body-md flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">
                  folder_off
                </span>
                <span>No problems match the current filter.</span>
              </div>
            )}

            {filteredProblems.map((problem) => (
              <div
                key={problem._id}
                className="grid grid-cols-12 px-space-lg py-space-md hover:bg-surface-container transition-colors items-center group"
              >
                {/* Title & Slug */}
                <div className="col-span-5 sm:col-span-5 flex flex-col pr-space-sm min-w-0">
                  <Link
                    to={`/problems/${encodeURIComponent(problem.slug)}`}
                    className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors truncate font-medium"
                  >
                    {problem.title}
                  </Link>
                  <span className="font-label-code-sm text-label-code-sm text-on-surface-variant/70 truncate">
                    slug: {problem.slug}
                  </span>
                </div>

                {/* Difficulty */}
                <div className="col-span-3 sm:col-span-2 flex items-center">
                  <span
                    className={`px-space-sm py-0.5 rounded font-label-code-sm text-label-code-sm uppercase font-semibold ${
                      problem.difficulty === 'Easy'
                        ? 'bg-primary-container/10 text-primary-container border border-primary-container/20'
                        : problem.difficulty === 'Medium'
                        ? 'bg-secondary-container/20 text-secondary border border-secondary-container/30'
                        : 'bg-error-container/20 text-error border border-error-container/30'
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                </div>

                {/* Tags */}
                <div className="hidden sm:flex sm:col-span-3 items-center gap-1.5 flex-wrap">
                  {(problem.tags || []).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-space-xs py-0.5 rounded-full bg-surface-container border border-surface-container-highest text-on-surface-variant font-body-sm text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                  {(problem.tags || []).length > 3 && (
                    <span className="text-[10px] text-on-surface-variant/60">
                      +{problem.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-space-xs">
                  <Link
                    to={`/admin/problems/${problem._id}/edit`}
                    className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface font-body-sm text-xs flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    <span>Edit</span>
                  </Link>
                  <button
                    type="button"
                    disabled={deletingId === problem._id}
                    onClick={() => handleDelete(problem)}
                    className="px-2.5 py-1 rounded bg-error-container/15 hover:bg-error-container/30 border border-error-container/40 text-error font-body-sm text-xs flex items-center gap-1 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    <span>{deletingId === problem._id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Toolbar */}
          <div className="flex items-center justify-between px-space-lg py-space-md bg-surface-container border-t border-surface-container-highest text-on-surface-variant font-body-sm text-body-sm">
            <span className="font-label-code-sm text-label-code-sm">
              Page <strong className="text-on-surface">{page}</strong> of{' '}
              <strong className="text-on-surface">{Math.max(pagination.totalPages || 1, 1)}</strong>{' '}
              ({totalCount} problems)
            </span>

            <div className="flex items-center gap-space-xs">
              <button
                type="button"
                disabled={page <= 1 || listStatus === 'loading'}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-surface-container-highest disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 font-body-sm text-body-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={pagination.totalPages === 0 || page >= pagination.totalPages || listStatus === 'loading'}
                onClick={() => setPage((p) => p + 1)}
                className="px-space-md py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-surface-container-highest disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 font-body-sm text-body-sm cursor-pointer"
              >
                <span>Next</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}