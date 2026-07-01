import { useEffect, useState } from 'react'
import PRInput from './components/PRInput.jsx'
import ReviewReport from './components/ReviewReport.jsx'
import Dashboard from './components/Dashboard.jsx'
import AIProviderSelect from './components/AIProviderSelect.jsx'
import { fetchPRData } from './services/github.js'
import { reviewPR as reviewWithGemini } from './services/gemini.js'
import { reviewPR as reviewWithOpenAI } from './services/openai.js'
import { saveReview, getReviewHistory } from './services/supabase.js'

export default function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [review, setReview] = useState(null)
  const [prData, setPrData] = useState(null)
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('review')
  const [provider, setProvider] = useState('openai')

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

    try {
      const fetchedPR = await fetchPRData(url)

      const reviewResult =
        provider === 'openai'
          ? await reviewWithOpenAI(fetchedPR)
          : await reviewWithGemini(fetchedPR)

      await saveReview(fetchedPR, reviewResult, provider)

      setPrData(fetchedPR)
      setReview({ ...reviewResult, ai_provider: provider })
      setActiveTab('review')
      await loadHistory()
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSelectReview(selectedReview) {
    setReview(selectedReview)
    setPrData(null)
    setActiveTab('review')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
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
              onClick={() => setActiveTab('history')}
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
            <Dashboard reviews={history} onSelectReview={handleSelectReview} />
          </section>
        )}
      </main>
    </div>
  )
}
