import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReviewReport from '../components/ReviewReport.jsx'
import AIProviderSelect from '../components/AIProviderSelect.jsx'
import { fetchPRData } from '../services/github.js'
import { reviewPR as reviewWithGemini } from '../services/gemini.js'
import { reviewPR as reviewWithOpenAI } from '../services/openai.js'
import { saveComparison } from '../services/supabase.js'

const CATEGORIES = [
  { key: 'bugs', label: 'Bugs' },
  { key: 'security_issues', label: 'Security' },
  { key: 'performance_issues', label: 'Performance' },
  { key: 'clarity_issues', label: 'Clarity' },
  { key: 'positives', label: 'Positives' },
]

function countIssues(arr) {
  if (!Array.isArray(arr)) return 0
  return arr.length
}

function ScoreArrow({ oldScore, newScore }) {
  const delta = newScore - oldScore
  const improved = delta >= 0
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4">
      <span className={`text-3xl font-bold ${improved ? 'text-green-400' : 'text-red-400'}`}>
        {improved ? '↑' : '↓'}
      </span>
      <span className={`text-lg font-bold ${improved ? 'text-green-400' : 'text-red-400'}`}>
        {improved ? '+' : ''}{delta} pts
      </span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${improved ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
        {improved ? 'Improvement' : 'Regression'}: {improved ? '+' : ''}{delta}%
      </span>
    </div>
  )
}

function DiffTable({ oldReview, newReview }) {
  const rows = CATEGORIES.map(({ key, label }) => {
    const oldCount = countIssues(oldReview[key])
    const newCount = countIssues(newReview[key])
    const isPositive = key === 'positives'
    const change = isPositive ? newCount - oldCount : oldCount - newCount
    const improved = change > 0
    const neutral = change === 0
    return { label, oldCount, newCount, change: newCount - oldCount, improved: isPositive ? improved : !improved, neutral }
  })

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Diff Summary</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
              <th className="pb-3 text-left font-medium">Category</th>
              <th className="pb-3 text-center font-medium text-red-400">Old PR</th>
              <th className="pb-3 text-center font-medium text-green-400">New PR</th>
              <th className="pb-3 text-center font-medium">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {/* Score row */}
            <tr>
              <td className="py-3 text-gray-300 font-semibold">Overall Score</td>
              <td className="py-3 text-center font-bold text-red-400">{oldReview.score}</td>
              <td className="py-3 text-center font-bold text-green-400">{newReview.score}</td>
              <td className="py-3 text-center">
                {(() => {
                  const d = newReview.score - oldReview.score
                  const cls = d > 0 ? 'text-green-400' : d < 0 ? 'text-red-400' : 'text-gray-500'
                  return <span className={`font-semibold ${cls}`}>{d > 0 ? '+' : ''}{d} {d > 0 ? '✅' : d < 0 ? '❌' : '—'}</span>
                })()}
              </td>
            </tr>
            {rows.map(({ label, oldCount, newCount, change, improved, neutral }) => (
              <tr key={label}>
                <td className="py-3 text-gray-300">{label}</td>
                <td className="py-3 text-center text-gray-400">{oldCount}</td>
                <td className="py-3 text-center text-gray-400">{newCount}</td>
                <td className="py-3 text-center">
                  {neutral ? (
                    <span className="text-gray-500">—</span>
                  ) : (
                    <span className={`font-semibold ${improved ? 'text-green-400' : 'text-red-400'}`}>
                      {change > 0 ? '+' : ''}{change} {improved ? '✅' : '❌'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function ComparePage() {
  const navigate = useNavigate()
  const [oldUrl, setOldUrl] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [provider, setProvider] = useState('openai')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleCompare() {
    if (!oldUrl.trim() || !newUrl.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setSaved(false)

    const runReview = async (url) => {
      const prData = await fetchPRData(url)
      const review = provider === 'openai'
        ? await reviewWithOpenAI(prData)
        : await reviewWithGemini(prData)
      return { prData, review }
    }

    const [oldRes, newRes] = await Promise.allSettled([
      runReview(oldUrl.trim()),
      runReview(newUrl.trim()),
    ])

    setLoading(false)

    if (oldRes.status === 'rejected') {
      setError(`Old PR error: ${oldRes.reason?.message || 'Unknown error'}`)
      return
    }
    if (newRes.status === 'rejected') {
      setError(`New PR error: ${newRes.reason?.message || 'Unknown error'}`)
      return
    }

    setResult({
      old: oldRes.value,
      new: newRes.value,
    })
  }

  async function handleSave() {
    if (!result) return
    setSaving(true)
    try {
      await saveComparison({
        old_pr_url: oldUrl.trim(),
        new_pr_url: newUrl.trim(),
        old_review: result.old.review,
        new_review: result.new.review,
        old_pr_data: result.old.prData,
        new_pr_data: result.new.prData,
        ai_provider: provider,
      })
      setSaved(true)
    } catch (err) {
      setError(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const oldScore = result?.old.review.score ?? 0
  const newScore = result?.new.review.score ?? 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <span className="font-bold text-white text-lg tracking-tight">AI PR Reviewer</span>
          </div>
          <nav className="flex gap-1">
            <a href="/" className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition">Review</a>
            <a href="/dashboard" className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition">History</a>
            <a href="/batch" className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition">Batch Review</a>
            <span className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white">Compare</span>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1">← Back</button>

        {/* Input section */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white">Compare Two PRs</h1>
            <AIProviderSelect selectedProvider={provider} onProviderChange={setProvider} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Old PR */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-red-400">Old PR URL</label>
              <input
                type="url"
                value={oldUrl}
                onChange={(e) => setOldUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/pull/1"
                className="w-full bg-gray-800 border-2 border-red-800 focus:border-red-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition"
              />
            </div>
            {/* New PR */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-400">New PR URL</label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/pull/2"
                className="w-full bg-gray-800 border-2 border-green-800 focus:border-green-500 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          <button
            onClick={handleCompare}
            disabled={loading || !oldUrl.trim() || !newUrl.trim()}
            className="w-full py-2.5 rounded-lg font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Analyzing both PRs…
              </>
            ) : (
              '⚡ Compare PRs'
            )}
          </button>
        </section>

        {/* Results */}
        {result && (
          <>
            {/* Score Comparison Banner */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">Score Comparison</h2>
              <div className="flex items-center justify-center gap-0">
                {/* Old score */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Old PR</span>
                  <span className="text-6xl font-black text-red-400">{oldScore}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[180px]">{result.old.prData.pr_title || oldUrl}</span>
                </div>

                <ScoreArrow oldScore={oldScore} newScore={newScore} />

                {/* New score */}
                <div className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">New PR</span>
                  <span className="text-6xl font-black text-green-400">{newScore}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[180px]">{result.new.prData.pr_title || newUrl}</span>
                </div>
              </div>
            </section>

            {/* Diff Summary */}
            <DiffTable oldReview={result.old.review} newReview={result.new.review} />

            {/* Side-by-side review reports */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Old PR column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-base font-bold text-red-400">❌ Old PR</span>
                    <span className="text-xs text-gray-500 truncate">{result.old.prData.pr_title}</span>
                  </div>
                  <div className="ring-2 ring-red-800/60 rounded-xl overflow-hidden">
                    <ReviewReport prData={result.old.prData} review={{ ...result.old.review, ai_provider: provider }} />
                  </div>
                </div>

                {/* New PR column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-base font-bold text-green-400">✅ New PR</span>
                    <span className="text-xs text-gray-500 truncate">{result.new.prData.pr_title}</span>
                  </div>
                  <div className="ring-2 ring-green-800/60 rounded-xl overflow-hidden">
                    <ReviewReport prData={result.new.prData} review={{ ...result.new.review, ai_provider: provider }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-center pb-4">
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`px-8 py-2.5 rounded-lg font-semibold text-sm transition flex items-center gap-2 ${
                  saved
                    ? 'bg-green-700 text-white cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white'
                }`}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving…
                  </>
                ) : saved ? '✅ Saved!' : '💾 Save Comparison'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
