import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import PRInput from './components/PRInput.jsx'
import ReviewReport from './components/ReviewReport.jsx'
import Dashboard from './components/Dashboard.jsx'
import AIProviderSelect from './components/AIProviderSelect.jsx'
import ReviewPage from './pages/ReviewPage.jsx'
import BatchReview from './pages/BatchReview.jsx'
import DeveloperPage from './pages/DeveloperPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import ComparisonsPage from './pages/ComparisonsPage.jsx'
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
  const [provider, setProvider] = useState('openai')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getReviewHistory().then(setHistory)
  }, [])

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
      await getReviewHistory().then(setHistory)

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
          <button onClick={() => setToast(null)} className="ml-1 text-gray-500 hover:text-gray-300 transition">✕</button>
        </div>
      )}

      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <AIProviderSelect selectedProvider={provider} onProviderChange={setProvider} />
          <div>
            <h2 className="text-base font-semibold text-gray-300 mb-3">
              Paste a GitHub PR URL to get an AI-powered review
            </h2>
            <PRInput onSubmit={handleAnalyze} isLoading={isLoading} error={error} />
          </div>
        </section>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
            <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <div className="text-center">
              <p className="font-medium text-gray-300">Analyzing your PR...</p>
              <p className="text-sm text-gray-500 mt-1">Fetching diff and running AI review</p>
            </div>
          </div>
        )}

        {!isLoading && review && <ReviewReport prData={prData} review={review} />}

        {!isLoading && !review && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-base">Your review will appear here</p>
            <p className="text-sm mt-1">Paste a PR URL above and click "Analyze PR"</p>
          </div>
        )}
      </main>
    </div>
  )
}

function DashboardPage() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    getReviewHistory().then(setHistory)
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-300 mb-6">
            Review History
            {history.length > 0 && (
              <span className="ml-2 bg-gray-700 text-gray-400 text-xs px-2 py-0.5 rounded-full">
                {history.length}
              </span>
            )}
          </h2>
          <Dashboard reviews={history} onSelectReview={() => {}} />
        </section>
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
      <Route path="/batch" element={<BatchReview />} />
      <Route path="/developer/:username" element={<DeveloperPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/comparisons" element={<ComparisonsPage />} />
    </Routes>
  )
}
