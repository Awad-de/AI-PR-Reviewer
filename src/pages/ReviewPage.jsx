import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReviewReport from '../components/ReviewReport.jsx'
import { getReviewById } from '../services/supabase.js'

export default function ReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getReviewById(id)
      setReview(data)
      setLoading(false)
    }
    load()
  }, [id])

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => {
      const el = document.createElement('textarea')
      el.value = window.location.href
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <span className="font-bold text-white text-lg tracking-tight">AI PR Reviewer</span>
          </div>

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
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-800 rounded-lg w-2/3" />
            <div className="h-4 bg-gray-800 rounded w-1/3" />
            <div className="h-32 bg-gray-800 rounded-xl mt-6" />
            <div className="h-32 bg-gray-800 rounded-xl" />
            <div className="h-32 bg-gray-800 rounded-xl" />
          </div>
        )}

        {!loading && !review && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-medium text-gray-300">Review not found</p>
            <p className="text-sm mt-1 mb-6">This review may have been deleted or the URL is incorrect.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        )}

        {!loading && review && (
          <ReviewReport prData={null} review={review} />
        )}
      </main>
    </div>
  )
}
