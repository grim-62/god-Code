import { useEffect, useRef, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { fetchProblems } from '../features/problems/problemSlice.js'

export default function ProblemsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const searchInputRef = useRef(null)

  const { problems, tags, pagination, listStatus, error } = useSelector((state) => state.problems)
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({ search: '', difficulty: '', tag: '' })
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'solved' | 'todo'
  const [page, setPage] = useState(1)

  useEffect(() => {
    dispatch(
      fetchProblems({
        page,
        limit: pagination.limit || 20,
        search: filters.search,
        difficulty: filters.difficulty,
        tag: filters.tag,
      }),
    )
  }, [dispatch, filters, page, pagination.limit])

  // Global key listener for '/' to focus search input
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
    setPage(1)
  }

  function submitSearch(e) {
    e.preventDefault()
    setFilters((current) => ({ ...current, search: searchInput.trim() }))
    setPage(1)
  }

  // Calculate telemetry and counts
  const totalProblems = pagination.total || problems.length
  const solvedCount = useMemo(() => problems.filter((p) => p.solved).length, [problems])
  const masteryPct = totalProblems > 0 ? ((solvedCount / totalProblems) * 100).toFixed(1) : 0

  const easyTotal = useMemo(() => problems.filter((p) => p.difficulty === 'Easy').length, [problems])
  const easySolved = useMemo(() => problems.filter((p) => p.difficulty === 'Easy' && p.solved).length, [problems])

  const medTotal = useMemo(() => problems.filter((p) => p.difficulty === 'Medium').length, [problems])
  const medSolved = useMemo(() => problems.filter((p) => p.difficulty === 'Medium' && p.solved).length, [problems])

  const hardTotal = useMemo(() => problems.filter((p) => p.difficulty === 'Hard').length, [problems])
  const hardSolved = useMemo(() => problems.filter((p) => p.difficulty === 'Hard' && p.solved).length, [problems])

  // Filter problems by status client-side if selected
  const displayedProblems = useMemo(() => {
    if (statusFilter === 'solved') return problems.filter((p) => p.solved)
    if (statusFilter === 'todo') return problems.filter((p) => !p.solved)
    return problems
  }, [problems, statusFilter])

  // Pick random problem
  const handleRandomPick = () => {
    if (!problems.length) return
    const pool = problems.filter((p) => !p.solved).length > 0 ? problems.filter((p) => !p.solved) : problems
    const randomItem = pool[Math.floor(Math.random() * pool.length)]
    if (randomItem?.slug) {
      navigate(`/problems/${encodeURIComponent(randomItem.slug)}`)
    }
  }

  // Simulated acceptance rate based on problem id
  const getAcceptanceRate = (problem) => {
    if (problem.difficulty === 'Easy') return '84.2%'
    if (problem.difficulty === 'Medium') return '52.8%'
    return '31.4%'
  }

  const getAcceptanceNum = (problem) => {
    if (problem.difficulty === 'Easy') return 84.2
    if (problem.difficulty === 'Medium') return 52.8
    return 31.4
  }

  return (
    <main className="w-full bg-surface min-h-[calc(100vh-56px)] text-on-surface">
      <div className="relative w-full overflow-hidden">
        {/* Ambient Neon Blobs */}
        <div
          className="absolute -top-32 left-1/4 w-96 h-96 bg-primary-container/5 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 right-10 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 md:px-margin-desktop py-space-xl flex flex-col gap-space-lg">
          {/* Top Meta Bar & Metrics */}
          <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-sm">
                <span className="font-label-code-sm text-label-code-sm text-primary-container tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container shadow-[0_0_6px_#00f5a0]"></span>
                  DIRECTORY / PROBLEMS
                </span>
                <span className="text-on-surface-variant/40">/</span>
                <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                  ENGINE_V4.2
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-space-md mt-1">
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                  Problem Library
                </h1>
                <div className="px-space-sm py-0.5 rounded-full bg-surface-container-high border border-surface-container-highest flex items-center gap-space-xs">
                  <span className="font-label-code-sm text-label-code-sm text-primary-container font-semibold">
                    {totalProblems} Total
                  </span>
                  <span className="text-on-surface-variant/40">•</span>
                  <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                    {solvedCount} Solved
                  </span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                Curated algorithmic specifications, low-level data structure challenges, and concurrency primitives engineered for rigorous technical benchmarks.
              </p>
            </div>

            {/* Solved Metric Display Card */}
            <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-md min-w-[280px] sm:min-w-[340px] shadow-sm flex flex-col gap-space-xs">
              <div className="flex items-center justify-between font-label-code-sm text-label-code-sm">
                <span className="text-on-surface-variant">Mastery Progress</span>
                <span className="text-primary-container font-medium">
                  {solvedCount} / {totalProblems}{' '}
                  <span className="text-on-surface-variant font-normal">({masteryPct}%)</span>
                </span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden flex">
                <div
                  className="bg-primary-container h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(Number(masteryPct), 2)}%` }}
                />
              </div>
              <div className="flex items-center justify-between font-label-code-sm text-label-code-sm text-on-surface-variant pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span> Easy: {easySolved}/{easyTotal || 0}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-container"></span> Med: {medSolved}/{medTotal || 0}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-container-highest"></span> Hard: {hardSolved}/{hardTotal || 0}
                </span>
              </div>
            </div>
          </section>

          {/* Search & Command Filter Toolbar */}
          <section className="bg-surface-container-low border border-surface-container-highest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
              {/* Search Form */}
              <form onSubmit={submitSearch} className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-space-md flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary-container transition-colors">
                  <span className="material-symbols-outlined text-[18px]">search</span>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  id="problemSearchInput"
                  className="w-full pl-9 pr-14 py-2 bg-surface-container text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md rounded-lg border border-transparent focus:border-surface-container-highest focus:outline-none focus:bg-surface-container-high transition-all"
                  placeholder="Search problems by title, tag, or slug..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-space-md flex items-center pointer-events-none">
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-code-sm text-label-code-sm tracking-widest">
                    /
                  </kbd>
                </div>
              </form>

              {/* Quick Filters Group */}
              <div className="flex flex-wrap items-center gap-space-xs sm:gap-space-sm">
                {/* Difficulty Selector */}
                <div className="relative">
                  <select
                    className="appearance-none bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface font-body-md text-body-md py-2 pl-space-md pr-8 rounded-lg cursor-pointer focus:outline-none transition-colors"
                    value={filters.difficulty}
                    onChange={(e) => updateFilter('difficulty', e.target.value)}
                  >
                    <option value="">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2.5 pointer-events-none text-on-surface-variant text-[18px]">
                    expand_more
                  </span>
                </div>

                {/* Status Selector */}
                <div className="relative">
                  <select
                    className="appearance-none bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface font-body-md text-body-md py-2 pl-space-md pr-8 rounded-lg cursor-pointer focus:outline-none transition-colors"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Status: All</option>
                    <option value="solved">Solved</option>
                    <option value="todo">Todo</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2.5 pointer-events-none text-on-surface-variant text-[18px]">
                    expand_more
                  </span>
                </div>

                {/* Random Pick Button */}
                <button
                  type="button"
                  onClick={handleRandomPick}
                  className="flex items-center gap-space-xs px-space-md py-2 bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface hover:text-primary-container font-body-md text-body-md rounded-lg transition-all active:scale-95 cursor-pointer"
                  title="Pick a random problem"
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary">shuffle</span>
                  <span>Random</span>
                </button>

                {/* Clear Filter button */}
                {(filters.search || filters.difficulty || filters.tag || statusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('')
                      setFilters({ search: '', difficulty: '', tag: '' })
                      setStatusFilter('all')
                      setPage(1)
                    }}
                    className="px-space-md py-2 text-on-surface-variant hover:text-primary font-body-md text-body-md transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Tag Quick Filter Pills */}
            <div className="flex items-center gap-space-xs overflow-x-auto pb-0.5 text-on-surface-variant scrollbar-none">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant/60 tracking-wider mr-1 shrink-0">
                TOPICS:
              </span>
              <button
                type="button"
                onClick={() => updateFilter('tag', '')}
                className={`px-space-sm py-1 rounded-full font-label-code-sm text-label-code-sm whitespace-nowrap transition-all cursor-pointer ${
                  !filters.tag
                    ? 'bg-primary-container text-on-primary font-medium shadow-xs'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All
              </button>
              {tags.map((tag) => {
                const isActive = filters.tag.toLowerCase() === tag.toLowerCase()
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => updateFilter('tag', isActive ? '' : tag)}
                    className={`px-space-sm py-1 rounded-full font-label-code-sm text-label-code-sm whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary-container text-on-primary font-medium shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Error notice */}
          {error && (
            <div className="p-space-md rounded-xl bg-error-container/20 border border-error-container text-error font-body-md text-body-md">
              {error}
            </div>
          )}

          {/* Problems Main Data Surface */}
          <section className="bg-surface-container-low border border-surface-container-highest rounded-xl overflow-hidden shadow-xl flex flex-col">
            {/* Table Column Headers */}
            <div className="grid grid-cols-12 px-space-lg py-space-sm bg-surface-container font-label-caps text-label-caps text-on-surface-variant tracking-wider uppercase items-center border-b border-surface-container-highest/60 select-none">
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-5 sm:col-span-4 lg:col-span-4">Title &amp; Slug</div>
              <div className="col-span-3 sm:col-span-2 text-left">Difficulty</div>
              <div className="hidden sm:block sm:col-span-2 text-right">Acceptance</div>
              <div className="hidden lg:block lg:col-span-2 pl-space-md">Topics</div>
              <div className="col-span-3 sm:col-span-3 lg:col-span-1 text-right">Action</div>
            </div>

            {/* Table Rows Body */}
            <div className="flex flex-col divide-y divide-surface-container-highest/40">
              {listStatus === 'loading' && problems.length === 0 && (
                <div className="py-16 text-center text-on-surface-variant font-body-md flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-secondary animate-spin">
                    refresh
                  </span>
                  <span>Loading problem specifications...</span>
                </div>
              )}

              {listStatus !== 'loading' && displayedProblems.length === 0 && !error && (
                <div className="py-16 text-center text-on-surface-variant font-body-md flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">
                    search_off
                  </span>
                  <span>No problem specifications match current filters.</span>
                </div>
              )}

              {displayedProblems.map((problem, index) => {
                const isEven = index % 2 === 0
                const acceptance = getAcceptanceRate(problem)
                const acceptanceNum = getAcceptanceNum(problem)

                return (
                  <div
                    key={problem._id || problem.slug}
                    className={`grid grid-cols-12 px-space-lg py-space-md transition-colors items-center group ${
                      isEven ? 'bg-surface-container-low' : 'bg-surface-container-lowest/40'
                    } hover:bg-surface-container`}
                  >
                    {/* Status Column */}
                    <div className="col-span-1 flex justify-center" title={problem.solved ? 'Solved' : 'Todo'}>
                      {problem.solved ? (
                        <span className="w-6 h-6 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant/40">
                          <span className="material-symbols-outlined text-[14px]">remove</span>
                        </span>
                      )}
                    </div>

                    {/* Title & Slug */}
                    <div className="col-span-5 sm:col-span-4 lg:col-span-4 flex flex-col pr-space-sm min-w-0">
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

                    {/* Acceptance */}
                    <div className="hidden sm:flex sm:col-span-2 justify-end items-center gap-space-xs font-label-code-sm text-label-code-sm text-on-surface">
                      <span>{acceptance}</span>
                      <div className="w-12 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="bg-primary-container h-full rounded-full"
                          style={{ width: `${acceptanceNum}%` }}
                        />
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="hidden lg:flex lg:col-span-2 items-center gap-space-xs pl-space-md flex-wrap">
                      {(problem.tags || []).slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="px-space-xs py-0.5 rounded-full bg-surface-container-high border border-surface-container-highest text-on-surface-variant font-body-sm text-[11px]"
                        >
                          {t}
                        </span>
                      ))}
                      {(problem.tags || []).length > 2 && (
                        <span className="text-[10px] text-on-surface-variant/60">
                          +{problem.tags.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="col-span-3 sm:col-span-3 lg:col-span-1 flex justify-end">
                      <Link
                        to={`/problems/${encodeURIComponent(problem.slug)}`}
                        className="px-space-sm py-1 rounded bg-surface-container hover:bg-primary-container hover:text-on-primary text-on-surface font-label-code-sm text-label-code-sm transition-all flex items-center gap-1 border border-surface-container-highest hover:border-primary-container"
                      >
                        <span>Solve</span>
                        <span className="material-symbols-outlined text-[14px]">terminal</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination Toolbar */}
            <div className="flex items-center justify-between px-space-lg py-space-md bg-surface-container border-t border-surface-container-highest text-on-surface-variant font-body-sm text-body-sm">
              <span className="font-label-code-sm text-label-code-sm">
                Page <strong className="text-on-surface">{page}</strong> of{' '}
                <strong className="text-on-surface">{Math.max(pagination.totalPages || 1, 1)}</strong>{' '}
                ({totalProblems} specifications)
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
      </div>
    </main>
  )
}