import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { getComparisons, deleteComparison } from '../services/supabase.js'

function deltaColor(delta) {
  if (delta > 0) return 'text-green-400'
  if (delta < 0) return 'text-red-400'
  return 'text-gray-500'
}

function shortUrl(url) {
  try {
    const m = url.match(/github\.com\/(.+)\/pull\/(\d+)/)
    if (m) return `${m[1]}#${m[2]}`
  } catch {}
  return url
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function ComparisonsPage() {
  const navigate = useNavigate()
  const [comparisons, setComparisons] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    getComparisons().then((data) => {
      setComparisons(data)
      setLoading(false)
    })
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('Delete this comparison?')) return
    setDeleting(id)
    try {
      await deleteComparison(id)
      setComparisons((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Saved Comparisons</h1>
          <button
            onClick={() => navigate('/compare')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition"
          >
            + New Comparison
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <svg className="animate-spin h-7 w-7 text-indigo-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading…
          </div>
        ) : comparisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
            <p className="text-5xl mb-4">⚖️</p>
            <p className="text-base">No comparisons saved yet</p>
            <p className="text-sm mt-1">Use the Compare page to analyse two PRs and save the result.</p>
            <button
              onClick={() => navigate('/compare')}
              className="mt-5 px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition"
            >
              Compare PRs now
            </button>
          </div>
        ) : (
          <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                  <th className="px-5 py-3 text-left font-medium">Old PR</th>
                  <th className="px-5 py-3 text-left font-medium">New PR</th>
                  <th className="px-5 py-3 text-center font-medium text-red-400">Old</th>
                  <th className="px-5 py-3 text-center font-medium text-green-400">New</th>
                  <th className="px-5 py-3 text-center font-medium">Delta</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {comparisons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-800/40 transition">
                    <td className="px-5 py-3 text-gray-300 font-mono text-xs">{shortUrl(c.old_pr_url)}</td>
                    <td className="px-5 py-3 text-gray-300 font-mono text-xs">{shortUrl(c.new_pr_url)}</td>
                    <td className="px-5 py-3 text-center font-bold text-red-400">{c.old_score}</td>
                    <td className="px-5 py-3 text-center font-bold text-green-400">{c.new_score}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-semibold ${deltaColor(c.score_delta)}`}>
                        {c.score_delta > 0 ? '+' : ''}{c.score_delta}
                        {' '}{c.score_delta > 0 ? '↑' : c.score_delta < 0 ? '↓' : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/comparisons/${c.id}`)}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 transition"
                          title="View details & share link"
                        >
                          🔗 View
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deleting === c.id}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-900/20 text-red-400 hover:bg-red-900/40 disabled:opacity-40 transition"
                          title="Delete comparison"
                        >
                          {deleting === c.id ? '…' : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  )
}
