import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const SNIPPETS = {
  python: {
    file: 'solution.py',
    lang: 'PYTHON 3.12',
    runtime: '12ms • 14.2 MB',
    output: '>>> [Optimal state resolved: PASS 14/14 tests]',
    lines: [
      { num: 1, content: '# start with a clear algorithmic model', isComment: true },
      { num: 2, content: '', isBlank: true },
      {
        num: 3,
        tokens: [
          { text: 'def ', style: 'keyword' },
          { text: 'solve', style: 'func' },
          { text: '(values):', style: 'plain' },
        ],
      },
      {
        num: 4,
        indent: true,
        tokens: [{ text: 'answer = find_pattern(values)', style: 'plain' }],
      },
      {
        num: 5,
        indent: true,
        tokens: [
          { text: 'return ', style: 'keyword' },
          { text: 'answer', style: 'plain' },
        ],
      },
      { num: 6, content: '', isBlank: true },
      {
        num: 7,
        tokens: [
          { text: 'result = ', style: 'plain' },
          { text: 'solve', style: 'func' },
          { text: '(sample)', style: 'plain' },
        ],
      },
      {
        num: 8,
        tokens: [
          { text: 'print', style: 'keyword' },
          { text: '(result)', style: 'plain' },
        ],
      },
    ],
  },
  cpp: {
    file: 'solution.cpp',
    lang: 'C++ 23',
    runtime: '2ms • 3.8 MB',
    output: '>>> [Optimal memory aligned: PASS 14/14 tests in 2.14ms]',
    lines: [
      { num: 1, content: '// high-throughput zero-copy solution', isComment: true },
      { num: 2, content: '', isBlank: true },
      {
        num: 3,
        tokens: [
          { text: 'auto ', style: 'keyword' },
          { text: 'solve', style: 'func' },
          { text: '(std::span<const int> values) -> int64_t {', style: 'plain' },
        ],
      },
      {
        num: 4,
        indent: true,
        tokens: [
          { text: 'return ', style: 'keyword' },
          { text: 'std::reduce(std::execution::par_unseq, values.begin(), values.end());', style: 'plain' },
        ],
      },
      {
        num: 5,
        tokens: [{ text: '}', style: 'plain' }],
      },
      { num: 6, content: '', isBlank: true },
      {
        num: 7,
        tokens: [
          { text: 'int ', style: 'keyword' },
          { text: 'main', style: 'func' },
          { text: '() { std::cout << solve(stream) << "\\n"; }', style: 'plain' },
        ],
      },
    ],
  },
}

export default function HomePage() {
  const navigate = useNavigate()
  const [activeLang, setActiveLang] = useState('python')
  const [isRunning, setIsRunning] = useState(false)
  const [showOutput, setShowOutput] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const snippet = SNIPPETS[activeLang]

  // Keyboard shortcut: Cmd+E / Ctrl+E opens Exams
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        navigate('/exams')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  const handleRun = () => {
    if (showOutput) {
      setShowOutput(false)
      return
    }

    setIsRunning(true)
    setTimeout(() => {
      setIsRunning(false)
      setShowOutput(true)
      setHasRun(true)
    }, 380)
  }

  return (
    <main className="w-full bg-surface text-on-surface min-h-[calc(100vh-56px)] flex flex-col justify-between">
      <section className="w-full flex flex-col items-center">
        <div className="relative w-full overflow-hidden">
          {/* Ambient Glow Orbs */}
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[360px] bg-secondary-container/10 rounded-full blur-[140px] pointer-events-none -z-10"
            aria-hidden="true"
          />
          <div
            className="absolute -top-32 right-1/4 w-[380px] h-[240px] bg-primary-container/5 rounded-full blur-[120px] pointer-events-none -z-10"
            aria-hidden="true"
          />

          {/* Main Hero Container */}
          <div className="max-w-5xl mx-auto px-4 sm:px-margin-desktop py-space-xl flex flex-col items-center text-center">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-space-sm px-space-md py-1 bg-surface-container-low border border-surface-container-highest/80 rounded-full shadow-xs mb-space-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container shadow-[0_0_8px_#00f5a0] animate-pulse"></span>
              <span className="font-label-code-sm text-label-code-sm text-secondary tracking-widest uppercase">
                Practice / Analyze / Improve
              </span>
            </div>

            {/* Hero Title */}
            <h1 className="font-headline-xl text-headline-xl text-on-surface max-w-3xl tracking-tight">
              Practice with <span className="text-primary-container">intent.</span>
            </h1>

            {/* Description */}
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mt-space-md leading-relaxed">
              Find a challenge, shape an optimal solution, and benchmark your code against low-latency test harnesses.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-space-md mt-space-xl">
              <Link
                to="/problems"
                className="inline-flex items-center gap-space-sm px-space-xl py-2.5 bg-primary-container hover:bg-secondary text-surface-container-lowest font-headline-sm text-headline-sm font-semibold rounded-lg shadow-md hover:shadow-[0_0_24px_rgba(0,245,160,0.35)] transition-all cursor-pointer"
              >
                <span>Explore problems</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <Link
                to="/exams"
                className="inline-flex items-center gap-space-sm px-space-lg py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-headline-sm text-headline-sm rounded-lg border border-surface-container-highest/60 hover:border-surface-container-highest transition-all shadow-xs cursor-pointer"
              >
                <span>Browse exams</span>
                <kbd className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-code-sm text-label-code-sm border border-surface-container-highest/40">
                  ⌘E
                </kbd>
              </Link>
            </div>

            {/* Code Snippet Window */}
            <div className="w-full max-w-3xl mt-space-xl text-left">
              <div className="bg-surface-container-lowest border border-surface-container-highest rounded-xl shadow-2xl overflow-hidden">
                {/* Window Titlebar */}
                <div className="h-10 px-space-md bg-surface-container-low border-b border-surface-container-highest/80 flex items-center justify-between">
                  <div className="flex items-center gap-space-md">
                    {/* Window Controls */}
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                    </div>

                    {/* File & Language Switcher */}
                    <div className="flex items-center gap-space-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[15px] text-secondary">
                        terminal
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLang('python')
                            setShowOutput(false)
                          }}
                          className={`font-label-code-md text-label-code-md px-1.5 py-0.5 rounded transition-colors ${
                            activeLang === 'python'
                              ? 'text-on-surface bg-surface-container font-medium'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          solution.py
                        </button>
                        <span className="text-on-surface-variant/40">/</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLang('cpp')
                            setShowOutput(false)
                          }}
                          className={`font-label-code-md text-label-code-md px-1.5 py-0.5 rounded transition-colors ${
                            activeLang === 'cpp'
                              ? 'text-on-surface bg-surface-container font-medium'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          solution.cpp
                        </button>
                      </div>
                      <span className="font-label-code-sm text-label-code-sm text-on-surface-variant/60 ml-2 hidden sm:inline">
                        {snippet.lang}
                      </span>
                    </div>
                  </div>

                  {/* Run / Status trigger */}
                  <div className="flex items-center gap-space-sm">
                    <div className="hidden sm:flex items-center gap-space-xs text-on-surface-variant">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                      <span className="font-label-code-sm text-label-code-sm text-secondary">
                        Ready to run
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRun}
                      disabled={isRunning}
                      className="inline-flex items-center gap-1 px-space-sm py-1 bg-surface-container hover:bg-surface-container-highest text-primary-container font-label-code-sm text-label-code-sm rounded border border-surface-container-highest/60 hover:border-primary-container/40 transition-all cursor-pointer"
                    >
                      <span
                        className={`material-symbols-outlined text-[14px] ${
                          isRunning ? 'animate-spin' : ''
                        }`}
                      >
                        {isRunning ? 'refresh' : showOutput ? 'check' : 'play_arrow'}
                      </span>
                      <span>{isRunning ? 'Running...' : showOutput ? 'Output' : 'Run'}</span>
                    </button>
                  </div>
                </div>

                {/* Code Body */}
                <div className="p-space-lg font-label-code-lg text-label-code-lg text-on-surface leading-relaxed select-text overflow-x-auto bg-surface-container-lowest">
                  <div className="flex items-start gap-space-md">
                    {/* Line numbers */}
                    <div className="flex flex-col text-on-surface-variant/40 font-label-code-sm select-none text-right pr-space-xs min-w-[16px]">
                      {snippet.lines.map((l) => (
                        <span key={l.num}>{l.num}</span>
                      ))}
                    </div>

                    {/* Syntax Highlighted Lines */}
                    <div className="flex-1 font-label-code-md">
                      {snippet.lines.map((line) => {
                        if (line.isBlank) {
                          return <p key={line.num} className="h-5">&nbsp;</p>
                        }
                        if (line.isComment) {
                          return (
                            <p key={line.num} className="text-on-surface-variant/60 italic">
                              {line.content}
                            </p>
                          )
                        }
                        return (
                          <p key={line.num} className={line.indent ? 'pl-4' : ''}>
                            {line.tokens?.map((tok, idx) => {
                              let cls = 'text-on-surface'
                              if (tok.style === 'keyword') cls = 'text-secondary font-medium'
                              if (tok.style === 'func') cls = 'text-primary'
                              return (
                                <span key={idx} className={cls}>
                                  {tok.text}
                                </span>
                              )
                            })}
                          </p>
                        )
                      })}
                    </div>
                  </div>

                  {/* Execution Output Box */}
                  {showOutput && (
                    <div className="mt-space-md pt-space-md bg-surface-container-low p-space-md rounded-lg border border-surface-container-highest/80 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between text-on-surface-variant font-label-code-sm text-label-code-sm mb-1.5">
                        <span className="text-secondary font-semibold">EXECUTION OUTPUT</span>
                        <span className="text-on-surface-variant/70">{snippet.runtime}</span>
                      </div>
                      <pre className="font-label-code-sm text-label-code-sm text-primary font-mono m-0 whitespace-pre-wrap">
                        {snippet.output}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Status Bar */}
                <div className="h-8 px-space-md bg-surface-container-low border-t border-surface-container-highest/60 flex items-center justify-between text-on-surface-variant font-label-code-sm text-label-code-sm">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                    <span>Ready to run • {snippet.lang}</span>
                  </div>
                  <div className="flex items-center gap-space-md text-on-surface-variant/70">
                    <span>UTF-8</span>
                    <span>Spaces: 4</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Choose Your Next Move Section */}
            <div className="w-full max-w-3xl mt-space-xl">
              <div className="flex items-center gap-space-md mb-space-lg">
                <div className="h-px bg-surface-container-highest flex-1"></div>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                  Choose your next move
                </span>
                <div className="h-px bg-surface-container-highest flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg text-left">
                <Link
                  to="/problems"
                  className="group block p-space-lg bg-surface-container-low hover:bg-surface-container rounded-xl shadow-xs hover:shadow-md border border-surface-container-highest/60 hover:border-primary-container/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-code-sm text-label-code-sm text-secondary font-medium">
                      01 / CHALLENGE
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container group-hover:translate-x-1 transition-all text-[20px]">
                      arrow_forward
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                    Solve a problem
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Build fundamentals, one test at a time &rarr;
                  </p>
                </Link>

                <Link
                  to="/exams"
                  className="group block p-space-lg bg-surface-container-low hover:bg-surface-container rounded-xl shadow-xs hover:shadow-md border border-surface-container-highest/60 hover:border-primary-container/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-space-sm">
                    <span className="font-label-code-sm text-label-code-sm text-secondary font-medium">
                      02 / BENCHMARK
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container group-hover:translate-x-1 transition-all text-[20px]">
                      arrow_forward
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                    Enter an exam
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Take on a timed competitive challenge &rarr;
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Minimalist Footer */}
      <footer className="w-full bg-surface-container-lowest border-t border-surface-container-highest py-space-lg mt-space-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
              god-code kernel v4.12.0
            </span>
            <span className="text-on-surface-variant/40">•</span>
            <span className="font-label-code-sm text-label-code-sm text-secondary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
              All systems nominal
            </span>
          </div>
          <div className="flex items-center gap-space-lg">
            <Link
              to="/problems"
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Problems
            </Link>
            <Link
              to="/exams"
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Exams
            </Link>
            <a
              href="#docs"
              onClick={(e) => e.preventDefault()}
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Documentation
            </a>
            <a
              href="#security"
              onClick={(e) => e.preventDefault()}
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Security
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}