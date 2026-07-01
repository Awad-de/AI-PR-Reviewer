import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import ReviewReport from '../components/ReviewReport.jsx'
import { getComparisonById } from '../services/supabase.js'

const CATEGORIES = [
  { key: 'bugs', label: 'Bugs' },
  { key: 'security_issues', label: 'Security' },
  { key: 'performance_issues', label: 'Performance' },
  { key: 'clarity_issues', label: 'Clarity' },
  { key: 'positives', label: 'Positives' },
]

function countIssues(arr) {
  return Array.isArray(arr) ? arr.length : 0
}

export default function ComparisonDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [comp, setComp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getComparisonById(id).then((data) => {
      setComp(data)
      setLoading(false)
    })
  }, [id])

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      const el = document.createElement('textarea')
      el.value = window.location.href
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/comparisons')} className="text-sm text-gray-400 hover:text-white transition">
            ← Back to Comparisons
          </button>
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
              copied
                ? 'bg-green-800/60 text-green-300 border-green-700'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:text-white hover:bg-gray-700'
            }`}
          >
            {copied ? '✓ Copied!' : '🔗 Copy Share Link'}
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <svg className="animate-spin h-7 w-7 text-indigo-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading…
          </div>
        )}

        {!loading && !comp && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <p className="text-5xl mb-4">⚖️</p>
            <p className="text-base">Comparison not found.</p>
            <button onClick={() => navigate('/comparisons')} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition">
              ← Back to Comparisons
            </button>
          </div>
        )}

        {!loading && comp && (
          <>
            {/* Score Banner */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">Score Comparison</h2>
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs text-gray-500 uppercase">Old PR</span>
                  <span className="text-6xl font-black text-red-400">{comp.old_score}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[180px]">{comp.old_pr_url}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className={`text-3xl font-bold ${comp.score_delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {comp.score_delta >= 0 ? '↑' : '↓'}
                  </span>
                  <span className={`text-lg font-bold ${comp.score_delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {comp.score_delta > 0 ? '+' : ''}{comp.score_delta} pts
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs text-gray-500 uppercase">New PR</span>
                  <span className="text-6xl font-black text-green-400">{comp.new_score}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[180px]">{comp.new_pr_url}</span>
                </div>
              </div>
            </section>

            {/* Diff Table */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Diff Summary</h2>
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
                  <tr>
                    <td className="py-3 text-gray-300 font-semibold">Overall Score</td>
                    <td className="py-3 text-center font-bold text-red-400">{comp.old_score}</td>
                    <td className="py-3 text-center font-bold text-green-400">{comp.new_score}</td>
                    <td className="py-3 text-center">
                      <span className={`font-semibold ${comp.score_delta > 0 ? 'text-green-400' : comp.score_delta < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                        {comp.score_delta > 0 ? '+' : ''}{comp.score_delta} {comp.score_delta > 0 ? '✅' : comp.score_delta < 0 ? '❌' : '—'}
                      </span>
                    </td>
                  </tr>
                  {CATEGORIES.map(({ key, label }) => {
                    const oldC = countIssues(comp.old_review?.[key])
                    const newC = countIssues(comp.new_review?.[key])
                    const change = newC - oldC
                    const isPositive = key === 'positives'
                    const improved = isPositive ? change > 0 : change < 0
                    return (
                      <tr key={key}>
                        <td className="py-3 text-gray-300">{label}</td>
                        <td className="py-3 text-center text-gray-400">{oldC}</td>
                        <td className="py-3 text-center text-gray-400">{newC}</td>
                        <td className="py-3 text-center">
                          {change === 0 ? (
                            <span className="text-gray-500">—</span>
                          ) : (
                            <span className={`font-semibold ${improved ? 'text-green-400' : 'text-red-400'}`}>
                              {change > 0 ? '+' : ''}{change} {improved ? '✅' : '❌'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </section>

            {/* Side by side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-base font-bold text-red-400 px-1">❌ Old PR</p>
                <div className="ring-2 ring-red-800/60 rounded-xl overflow-hidden">
                  <ReviewReport prData={comp.old_pr_data} review={{ ...comp.old_review, ai_provider: comp.ai_provider }} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-base font-bold text-green-400 px-1">✅ New PR</p>
                <div className="ring-2 ring-green-800/60 rounded-xl overflow-hidden">
                  <ReviewReport prData={comp.new_pr_data} review={{ ...comp.new_review, ai_provider: comp.ai_provider }} />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
