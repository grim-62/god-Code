import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = window.setTimeout(onClose, 3500)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  const style = type === 'error'
    ? 'border-red-200 bg-red-50 text-red-800'
    : 'border-emerald-200 bg-emerald-50 text-emerald-900'

  return (
    <div className={`fixed right-5 top-20 z-50 flex max-w-sm items-start gap-4 rounded-md border px-4 py-3 text-sm shadow-lg ${style}`} role={type === 'error' ? 'alert' : 'status'} aria-live="polite">
      <span className="flex-1">{message}</span>
      <button className="font-semibold opacity-70 hover:opacity-100" type="button" aria-label="Dismiss notification" onClick={onClose}>×</button>
    </div>
  )
}