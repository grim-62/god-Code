import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../features/auth/authSlice.js'
import CommandPalette from './CommandPalette.jsx'

export default function Navbar() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const toggleRef = useRef(null)

  const navLinkClass = ({ isActive }) =>
    `px-space-md py-1 rounded-lg font-body-md text-body-md transition-colors ${
      isActive
        ? 'bg-surface-container-high text-on-surface font-medium shadow-xs'
        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
    }`

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg font-body-md text-body-md transition-colors ${
      isActive
        ? 'bg-surface-container-high text-primary-container font-medium'
        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
    }`

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Global keyboard shortcuts (Cmd+K / Ctrl+K for search)
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface-container-lowest/85 backdrop-blur-xl border-b border-surface-container-highest">
        <div className="h-14 max-w-7xl mx-auto px-4 md:px-margin-desktop flex items-center justify-between gap-space-lg">
          {/* Brand & Left Navigation */}
          <div className="flex items-center gap-space-lg">
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-space-sm group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-container-low border border-surface-container-highest flex items-center justify-center text-primary-container group-hover:border-primary-container/50 group-hover:shadow-[0_0_12px_rgba(0,245,160,0.2)] transition-all">
                <span className="font-label-code-md font-bold text-sm tracking-tighter">&lt;/&gt;</span>
              </div>
              <span className="font-label-code-md text-label-code-md uppercase tracking-wider text-on-surface font-semibold">
                god-code
              </span>
            </Link>

            <div className="h-4 w-px bg-surface-container-highest hidden sm:block"></div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-space-xs" aria-label="Main navigation">
              <NavLink className={navLinkClass} to="/problems">
                Problems
              </NavLink>
              <NavLink className={navLinkClass} to="/exams">
                Exams
              </NavLink>
              {user?.role === 'admin' && (
                <>
                  <NavLink className={navLinkClass} to="/admin/problems">
                    Admin
                  </NavLink>
                  <NavLink className={navLinkClass} to="/admin/exams">
                    Manage Exams
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-space-md">
            {/* Quick Search Trigger */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden lg:flex items-center gap-space-md bg-surface-container-low hover:bg-surface-container border border-surface-container-highest px-space-md py-1 rounded-lg text-on-surface-variant hover:text-on-surface transition-all cursor-pointer group"
              title="Search problems (⌘K)"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:text-primary-container transition-colors">
                search
              </span>
              <span className="font-body-sm text-body-sm">Quick search...</span>
              <kbd className="flex items-center gap-0.5 bg-surface-container-highest text-on-surface px-1.5 py-0.5 rounded font-label-code-sm text-label-code-sm">
                ⌘K
              </kbd>
            </button>

            {/* System Status Pill */}
            <div
              className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-low rounded border border-surface-container-highest select-none"
              title="All systems operational"
            >
              <span className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_#00f5a0] animate-pulse"></span>
              <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                99.9%
              </span>
            </div>

            <div className="h-4 w-px bg-surface-container-highest hidden sm:block"></div>

            {/* Account / Auth */}
            {user ? (
              <div className="flex items-center gap-space-sm">
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="flex items-center gap-space-sm pl-space-xs group cursor-pointer"
                  title="View profile & telemetry"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center group-hover:ring-2 group-hover:ring-primary-container/40 transition-all">
                    <span className="material-symbols-outlined text-on-primary text-[18px]">
                      person
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="font-label-code-sm text-label-code-sm text-on-surface font-medium leading-none group-hover:text-primary transition-colors">
                      {user.name || 'User'}
                    </span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-0.5">
                      {user.role === 'admin' ? 'root' : 'developer'}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => dispatch(logout())}
                  className="p-1 text-on-surface-variant hover:text-error transition-colors rounded hover:bg-surface-container cursor-pointer ml-1"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-space-sm">
                <NavLink
                  to="/login"
                  className="px-space-md py-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-body-md text-body-md transition-colors"
                >
                  Log in
                </NavLink>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-container hover:bg-secondary text-surface-container-lowest font-body-sm font-semibold rounded-lg shadow-sm hover:shadow-[0_0_16px_rgba(0,245,160,0.3)] transition-all cursor-pointer"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              ref={toggleRef}
              type="button"
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-low border border-surface-container-highest text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="material-symbols-outlined text-[20px]">
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-surface-container-highest bg-surface-container-lowest/95 backdrop-blur-xl px-4 py-3 space-y-2">
            <button
              type="button"
              onClick={() => {
                closeMenu()
                setPaletteOpen(true)
              }}
              className="w-full flex items-center justify-between px-3 py-2 bg-surface-container rounded-lg text-on-surface-variant font-body-sm text-left mb-2"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">search</span>
                <span>Quick search...</span>
              </span>
              <kbd className="bg-surface-container-highest text-on-surface px-1.5 py-0.5 rounded font-label-code-sm text-[10px]">
                ⌘K
              </kbd>
            </button>

            <nav className="flex flex-col space-y-1">
              <NavLink className={mobileLinkClass} to="/problems" onClick={closeMenu}>
                <span className="material-symbols-outlined text-[18px]">code</span>
                <span>Problems</span>
              </NavLink>
              <NavLink className={mobileLinkClass} to="/exams" onClick={closeMenu}>
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span>Exams</span>
              </NavLink>
              {user?.role === 'admin' && (
                <>
                  <NavLink className={mobileLinkClass} to="/admin/problems" onClick={closeMenu}>
                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                    <span>Admin Problems</span>
                  </NavLink>
                  <NavLink className={mobileLinkClass} to="/admin/exams" onClick={closeMenu}>
                    <span className="material-symbols-outlined text-[18px]">assignment</span>
                    <span>Manage Exams</span>
                  </NavLink>
                </>
              )}
              {user && (
                <NavLink className={mobileLinkClass} to="/profile" onClick={closeMenu}>
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span>My Profile</span>
                </NavLink>
              )}
            </nav>

            {!user && (
              <div className="pt-2 border-t border-surface-container-highest flex gap-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex-1 text-center py-2 rounded-lg bg-surface-container text-on-surface font-body-sm"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex-1 text-center py-2 rounded-lg bg-primary-container text-surface-container-lowest font-body-sm font-semibold"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Raycast-style Command Palette modal */}
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}