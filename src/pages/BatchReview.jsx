import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseGitHubURL } from '../utils/parseGitHubURL.js'
import { analyzeBatch } from '../services/batchReview.js'
import ReviewReport from '../components/ReviewReport.jsx'
import AIProviderSelect from '../components/AIProviderSelect.jsx'

const MAX_PRS = 5

function scoreColor(score) {
  if (score >= 90) return 'text-green-400'
  if (score >= 70) return 'text-yellow-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-red-400'
}

const STATUS_ICON = {
  pending: '⏳',
  analyzing: '🔄',
  success: '✅',
  error: '❌',
}

export default function BatchReview() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [provider, setProvider] = useState('openai')
  const [isRunning, setIsRunning] = useState(false)
  const [statuses, setStatuses] = useState([])   // per-PR status objects
  const [results, setResults] = useState([])      // final results after all done
  const [done, setDone] = useState(false)

  // Parse lines and validate each URL
  const lines = useMemo(() => {
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .slice(0, MAX_PRS)
  }, [text])

  const parsedLines = useMemo(() => {
    return lines.map((url) => {
      try {
        parseGitHubURL(url)
        return { url, valid: true }
      } catch {
        return { url, valid: false }
      }
    })
  }, [lines])

  const validUrls = parsedLines.filter((l) => l.valid).map((l) => l.url)
  const hasValid = validUrls.length > 0

  // Summary stats from completed results
  const summary = useMemo(() => {
    if (!done || results.length === 0) return null
    const successful = results.filter((r) => r.status === 'success')
    if (successful.length === 0) return null
    const scores = successful.map((r) => r.data.score).filter(Boolean)
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const approved = successful.filter((r) => r.data.verdict === 'APPROVE').length
    const changes = successful.filter((r) => r.data.verdict === 'REQUEST_CHANGES').length
    const discussion = successful.filter((r) => r.data.verdict === 'NEEDS_DISCUSSION').length
    return { total: results.length, successful: successful.length, avg, approved, changes, discussion }
  }, [done, results])

  function handleTextChange(e) {
    setText(e.target.value)
    setDone(false)
    setResults([])
    setStatuses([])
  }

  async function handleAnalyzeAll() {
    if (!hasValid || isRunning) return

    setIsRunning(true)
    setDone(false)
    setResults([])

    // Initialize all statuses as pending
    setStatuses(validUrls.map((url) => ({ url, status: 'pending', data: null, error: null })))

    const finalResults = await analyzeBatch(validUrls, provider, (index, status, data, error) => {
      setStatuses((prev) => {
        const updated = [...prev]
        updated[index] = { ...updated[index], status, data: data || null, error: error || null }
        return updated
      })
    })

    setResults(finalResults)
    setDone(true)
    setIsRunning(false)
  }

  const analyzedCount = statuses.filter((s) => s.status === 'success' || s.status === 'error').length
  const progressPct = statuses.length > 0 ? Math.round((analyzedCount / statuses.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <span className="font-bold text-white text-lg tracking-tight">AI PR Reviewer</span>
          </div>
          <nav className="flex gap-1">
            <a href="/" className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition">
              Review
            </a>
            <a href="/dashboard" className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition">
              History
            </a>
            <span className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white">
              Batch Review
            </span>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Input section */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-200">Batch Review — Analyze Multiple PRs</h2>
            <span
              className={`text-sm font-medium px-2 py-0.5 rounded-full border ${
                lines.length >= MAX_PRS
                  ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700'
                  : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}
            >
              {lines.length}/{MAX_PRS} PRs
            </span>
          </div>

          <AIProviderSelect selectedProvider={provider} onProviderChange={setProvider} />

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">
              Paste one GitHub PR URL per line (max {MAX_PRS})
            </label>
            <textarea
              value={text}
              onChange={handleTextChange}
              disabled={isRunning}
              rows={6}
              placeholder={`https://github.com/owner/repo/pull/1\nhttps://github.com/owner/repo/pull/2\nhttps://github.com/owner/repo/pull/3`}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 resize-none font-mono disabled:opacity-50"
            />
          </div>

          {/* Per-line validation */}
          {parsedLines.length > 0 && (
            <div className="space-y-1">
              {parsedLines.map((line, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs ${line.valid ? 'text-green-400' : 'text-red-400'}`}>
                  <span>{line.valid ? '✓' : '✗'}</span>
                  <span className="font-mono truncate max-w-xl">{line.url}</span>
                  {!line.valid && <span className="text-red-500">— invalid GitHub PR URL</span>}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAnalyzeAll}
            disabled={!hasValid || isRunning}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRunning ? `Analyzing ${analyzedCount}/${statuses.length}...` : `Analyze All (${validUrls.length} PR${validUrls.length !== 1 ? 's' : ''})`}
          </button>
        </section>

        {/* Progress section */}
        {isRunning && statuses.length > 0 && (
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-400 font-medium">Analyzing {analyzedCount}/{statuses.length}…</span>
              <span className="text-gray-500">{progressPct}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="space-y-2 pt-1">
              {statuses.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-base w-6 text-center">
                    {s.status === 'analyzing'
                      ? <span className="inline-block animate-spin">🔄</span>
                      : STATUS_ICON[s.status]}
                  </span>
                  <span className="font-mono text-xs text-gray-400 truncate max-w-md">{s.url}</span>
                  {s.status === 'error' && (
                    <span className="text-xs text-red-400 truncate">{s.error}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Summary + results */}
        {done && (
          <>
            {summary && (
              <section className="bg-gray-900 border border-indigo-800/40 rounded-xl p-5">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="font-semibold text-white text-base">
                    {summary.successful}/{summary.total} PRs analyzed
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className={`font-bold text-lg ${scoreColor(summary.avg)}`}>
                    Avg Score: {summary.avg}
                  </span>
                  <span className="text-gray-400">•</span>
                  {summary.approved > 0 && (
                    <span className="text-green-400">✅ {summary.approved} Approved</span>
                  )}
                  {summary.changes > 0 && (
                    <span className="text-red-400">❌ {summary.changes} Needs Changes</span>
                  )}
                  {summary.discussion > 0 && (
                    <span className="text-yellow-400">💬 {summary.discussion} Needs Discussion</span>
                  )}
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 underline transition"
                  >
                    View in Dashboard →
                  </button>
                </div>
              </section>
            )}

            {/* Per-PR status after done */}
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i}>
                  {r.status === 'error' && (
                    <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4 flex items-start gap-3">
                      <span className="text-xl">❌</span>
                      <div>
                        <p className="text-sm font-mono text-gray-400">{r.url}</p>
                        <p className="text-sm text-red-400 mt-0.5">{r.error}</p>
                      </div>
                    </div>
                  )}
                  {r.status === 'success' && r.data && (
                    <ReviewReport prData={null} review={r.data} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
