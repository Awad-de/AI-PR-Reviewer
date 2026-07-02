import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteReview, getReviewHistoryPaged } from '../services/supabase.js'
import { useNavCounts } from '../contexts/NavCounts.jsx'

const PAGE_SIZE = 10

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function truncate(str, max) {
  if (!str) return '—'
  return str.length > max ? str.slice(0, max) + '...' : str
}

function scoreColor(score) {
  if (score >= 90) return 'text-green-400'
  if (score >= 70) return 'text-yellow-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-red-400'
}

const VERDICT_STYLES = {
  APPROVE: 'bg-green-900/50 text-green-300 border-green-700',
  REQUEST_CHANGES: 'bg-red-900/50 text-red-300 border-red-700',
  NEEDS_DISCUSSION: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
}

const VERDICT_ICONS = {
  APPROVE: '✅',
  REQUEST_CHANGES: '❌',
  NEEDS_DISCUSSION: '💬',
}

const PROVIDER_BADGE = {
  openai:  { label: '🤖 GPT-4o',  className: 'bg-blue-900/50 text-blue-300 border-blue-700' },
  gemini:  { label: '✨ Gemini',   className: 'bg-purple-900/50 text-purple-300 border-purple-700' },
}

const FILTERS = [
  { id: 'all',    label: 'All' },
  { id: 'openai', label: '🤖 OpenAI' },
  { id: 'gemini', label: '✨ Gemini' },
]

export default function Dashboard() {
  const [reviews, setReviews]           = useState([])
  const [totalCount, setTotalCount]     = useState(0)
  const [page, setPage]                 = useState(1)
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState('all')
  const [deleting, setDeleting]         = useState(null)
  const navigate = useNavigate()
  const { refresh: refreshNavCounts } = useNavCounts()

  async function loadPage(p) {
    setLoading(true)
    const { data, count } = await getReviewHistoryPaged(p, PAGE_SIZE)
    setReviews(data)
    setTotalCount(count)
    setLoading(false)
  }

  useEffect(() => { loadPage(page) }, [page])

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1) }, [filter])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.ai_provider === filter)

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!window.confirm('Delete this review?')) return
    setDeleting(id)
    try {
      await deleteReview(id)
      refreshNavCounts()
      // If we deleted the last item on this page, go back one page
      const newPage = reviews.length === 1 && page > 1 ? page - 1 : page
      setPage(newPage)
      if (newPage === page) await loadPage(page)
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  function Pagination() {
    if (totalPages <= 1) return null
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    const visible = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    const withEllipsis = []
    visible.forEach((p, i) => {
      if (i > 0 && p - visible[i - 1] > 1) withEllipsis.push('…')
      withEllipsis.push(p)
    })

    return (
      <div className="flex items-center justify-center gap-1 pt-5">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >←</button>

        {withEllipsis.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1 text-gray-600 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              disabled={loading}
              className={`w-8 h-8 text-sm rounded-lg font-medium transition ${
                p === page
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              } disabled:cursor-not-allowed`}
            >{p}</button>
          )
        )}

        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || loading}
          className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >→</button>

        <span className="ml-2 text-xs text-gray-600">
          {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
        </span>
      </div>
    )
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-800 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!loading && totalCount === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-base">No reviews yet. Analyze your first PR above.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter + count */}
      <div className="flex items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition border ${
              filter === f.id
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white hover:bg-gray-700'
            }`}
          >{f.label}</button>
        ))}
        <span className="ml-auto text-xs text-gray-600">
          {totalCount} review{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          No reviews from this provider on this page.
        </div>
      ) : (
        <div className={`overflow-x-auto transition-opacity duration-150 ${loading ? 'opacity-40' : 'opacity-100'}`}>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-800">
                {['Repository', 'PR Title', 'Score', 'Verdict', 'AI Used', 'Date', 'Actions'].map(h => (
                  <th key={h} className="pb-3 text-xs uppercase tracking-wider text-gray-500 font-medium pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.map(review => {
                const providerBadge = PROVIDER_BADGE[review.ai_provider]
                return (
                  <tr
                    key={review.id}
                    onClick={() => navigate(`/review/${review.id}`)}
                    className="hover:bg-gray-700/40 cursor-pointer transition"
                  >
                    <td className="py-3 pr-4 text-gray-300 font-mono text-xs">{truncate(review.repo_name, 30)}</td>
                    <td className="py-3 pr-4 text-gray-200">{truncate(review.pr_title, 40)}</td>
                    <td className="py-3 pr-4">
                      <span className={`font-bold ${scoreColor(review.score)}`}>{review.score}/100</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                        VERDICT_STYLES[review.verdict] || VERDICT_STYLES.NEEDS_DISCUSSION
                      }`}>
                        {VERDICT_ICONS[review.verdict] || '💬'} {review.verdict}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {providerBadge ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${providerBadge.className}`}>
                          {providerBadge.label}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">{formatDate(review.created_at)}</td>
                    <td className="py-3 pr-2 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => navigate(`/review/${review.id}`)}
                          className="px-2 py-1 rounded text-xs bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 transition"
                          title="View"
                        >🔗</button>
                        <button
                          onClick={e => handleDelete(e, review.id)}
                          disabled={deleting === review.id}
                          className="px-2 py-1 rounded text-xs bg-red-900/20 text-red-400 hover:bg-red-900/40 disabled:opacity-40 transition"
                          title="Delete"
                        >{deleting === review.id ? '…' : '🗑️'}</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination />
    </div>
  )
}
