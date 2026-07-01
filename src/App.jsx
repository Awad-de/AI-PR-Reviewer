import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import PRInput from './components/PRInput.jsx'
import ReviewReport from './components/ReviewReport.jsx'
import Dashboard from './components/Dashboard.jsx'
import AIProviderSelect from './components/AIProviderSelect.jsx'
import ReviewPage from './pages/ReviewPage.jsx'
import { fetchPRData } from './services/github.js'
import { reviewPR as reviewWithGemini } from './services/gemini.js'
import { reviewPR as reviewWithOpenAI } from './services/openai.js'
import { saveReview, getReviewHistory } from './services/supabase.js'

function HomePage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [review, setReview] = useState(null)
  const [prData, setPrData] = useState(null)
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('review')
  const [provider, setProvider] = useState('openai')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    const data = await getReviewHistory()
    setHistory(data)
  }

  async function handleAnalyze(url) {
    setIsLoading(true)
    setError(null)
    setToast(null)

    try {
      const fetchedPR = await fetchPRData(url)

      const reviewResult =
        provider === 'openai'
          ? await reviewWithOpenAI(fetchedPR)
          : await reviewWithGemini(fetchedPR)

      const saved = await saveReview(fetchedPR, reviewResult, provider)

      setPrData(fetchedPR)
      setReview({ ...reviewResult, ai_provider: provider, id: saved?.id })
      setActiveTab('review')
      await loadHistory()

      if (saved?.id) {
        setToast(saved.id)
        setTimeout(() => setToast(null), 6000)
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 shadow-xl text-sm">
          <span className="text-green-400 font-medium">✅ Review saved!</span>
          <button
            onClick={() => navigate(`/review/${toast}`)}
            className="text-indigo-400 hover:text-indigo-300 underline transition"
          >
            View at /review/{toast.slice(0, 8)}…
          </button>
          <button
            onClick={() => setToast(null)}
            className="ml-1 text-gray-500 hover:text-gray-300 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <span className="font-bold text-white text-lg tracking-tight">AI PR Reviewer</span>
          </div>

          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('review')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'review'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              Review
            </button>
            <button
              onClick={() => { setActiveTab('history'); navigate('/dashboard') }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              History
              {history.length > 0 && (
                <span className="ml-1.5 bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">
                  {history.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* PR Input — always visible */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <AIProviderSelect selectedProvider={provider} onProviderChange={setProvider} />
          <div>
            <h2 className="text-base font-semibold text-gray-300 mb-3">
              Paste a GitHub PR URL to get an AI-powered review
            </h2>
            <PRInput onSubmit={handleAnalyze} isLoading={isLoading} error={error} />
          </div>
        </section>

        {/* Tab: Review */}
        {activeTab === 'review' && (
          <>
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
                <svg
                  className="animate-spin h-10 w-10 text-indigo-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <div className="text-center">
                  <p className="font-medium text-gray-300">Analyzing your PR...</p>
                  <p className="text-sm text-gray-500 mt-1">Fetching diff and running AI review</p>
                </div>
              </div>
            )}

            {!isLoading && review && (
              <ReviewReport prData={prData} review={review} />
            )}

            {!isLoading && !review && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                <p className="text-5xl mb-4">📋</p>
                <p className="text-base">Your review will appear here</p>
                <p className="text-sm mt-1">Paste a PR URL above and click "Analyze PR"</p>
              </div>
            )}
          </>
        )}

        {/* Tab: History */}
        {activeTab === 'history' && (
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-300 mb-6">Review History</h2>
            <Dashboard reviews={history} onSelectReview={() => {}} />
          </section>
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/review/:id" element={<ReviewPage />} />
    </Routes>
  )
}

function DashboardPage() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    getReviewHistory().then(setHistory)
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <span className="font-bold text-white text-lg tracking-tight">AI PR Reviewer</span>
          </div>
          <nav className="flex gap-1">
            <a
              href="/"
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              Review
            </a>
            <span className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white">
              History
              {history.length > 0 && (
                <span className="ml-1.5 bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {history.length}
                </span>
              )}
            </span>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-300 mb-6">Review History</h2>
          <Dashboard reviews={history} onSelectReview={() => {}} />
        </section>
      </main>
    </div>
  )
}
