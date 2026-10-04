import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProblems } from '../features/problems/problemSlice.js'

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const user = useSelector((state) => state.auth.user)
  const { problems, listStatus } = useSelector((state) => state.problems)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      if (listStatus === 'idle') {
        dispatch(fetchProblems({}))
      }
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, listStatus, dispatch])

  const navigationItems = [
    { id: 'nav-problems', title: 'Problems Directory', category: 'Navigation', icon: 'code', path: '/problems', desc: 'Browse curated algorithmic challenges' },
    { id: 'nav-exams', title: 'Contests & Exams', category: 'Navigation', icon: 'timer', path: '/exams', desc: 'Benchmarked timed coding challenges' },
    ...(user ? [{ id: 'nav-profile', title: 'Developer Profile & Telemetry', category: 'Navigation', icon: 'person', path: '/profile', desc: 'View stats, submissions, and telemetry' }] : []),
    ...(user?.role === 'admin' ? [
      { id: 'nav-admin-problems', title: 'Admin Problem Management', category: 'Admin', icon: 'admin_panel_settings', path: '/admin/problems', desc: 'Manage problem sets and test cases' },
      { id: 'nav-admin-exams', title: 'Admin Exam Management', category: 'Admin', icon: 'assignment', path: '/admin/exams', desc: 'Create and configure timed contests' },
    ] : []),
  ]

  const problemItems = (problems || []).slice(0, 15).map((p) => ({
    id: `prob-${p._id || p.id || p.slug}`,
    title: p.title,
    category: 'Problems',
    icon: 'terminal',
    path: `/problems/${p.slug}`,
    desc: `${p.difficulty || 'Medium'} • ${p.tags?.slice(0, 3).join(', ') || 'Algorithm'}`,
    difficulty: p.difficulty,
  }))

  const allItems = [...navigationItems, ...problemItems]

  const filteredItems = query.trim()
    ? allItems.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.desc.toLowerCase().includes(query.toLowerCase())
      )
    : allItems

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (item) => {
    onClose()
    if (item.path) {
      navigate(item.path)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-surface-container-lowest/80 backdrop-blur-md transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface-container-low border border-surface-container-highest rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header with mint prompt */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-container-highest bg-surface-container">
          <span className="font-label-code-md text-primary-container font-bold text-lg select-none">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none font-body-md"
            placeholder="Type a command or search problems..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-on-surface-variant hover:text-on-surface text-xs px-1"
            >
              Clear
            </button>
          )}
          <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-label-code-sm text-[10px] select-none">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-surface-container-highest/20">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-on-surface-variant font-body-md text-xs">
              No matching problems or commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-surface-container-high text-on-surface ring-1 ring-primary-container/30'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        isSelected ? 'text-primary-container' : 'text-on-surface-variant'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-body-md text-sm font-medium text-on-surface truncate">
                          {item.title}
                        </span>
                        {item.difficulty && (
                          <span
                            className={`text-[10px] font-label-code-sm px-1.5 py-0.2 rounded ${
                              item.difficulty === 'Easy'
                                ? 'bg-primary-container/15 text-primary-container'
                                : item.difficulty === 'Medium'
                                ? 'bg-secondary-container/20 text-secondary'
                                : 'bg-error-container/20 text-error'
                            }`}
                          >
                            {item.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="font-body-sm text-xs text-on-surface-variant truncate">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider shrink-0">
                    {item.category}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-surface-container-highest bg-surface-container-lowest text-on-surface-variant font-label-code-sm text-[11px]">
          <div className="flex items-center gap-2">
            <span>Navigate <kbd className="px-1 py-0.2 bg-surface-container-highest rounded text-[10px]">↑</kbd> <kbd className="px-1 py-0.2 bg-surface-container-highest rounded text-[10px]">↓</kbd></span>
            <span>•</span>
            <span>Select <kbd className="px-1 py-0.2 bg-surface-container-highest rounded text-[10px]">↵</kbd></span>
          </div>
          <span className="text-secondary font-medium">god-code engine v4.12</span>
        </div>
      </div>
    </div>
  )
}
