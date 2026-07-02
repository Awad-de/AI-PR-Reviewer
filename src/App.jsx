import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import PRInput from './components/PRInput.jsx'
import ReviewReport from './components/ReviewReport.jsx'
import SkeletonReview from './components/SkeletonReview.jsx'
import StatsBar from './components/StatsBar.jsx'
import { ToastProvider, useToast } from './components/Toast.jsx'
import Dashboard from './components/Dashboard.jsx'
import AIProviderSelect from './components/AIProviderSelect.jsx'
import DeveloperSearch from './components/DeveloperSearch.jsx'
import { useNavCounts } from './contexts/NavCounts.jsx'
import ReviewPage from './pages/ReviewPage.jsx'
import BatchReview from './pages/BatchReview.jsx'
import DeveloperPage from './pages/DeveloperPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import ComparisonsPage from './pages/ComparisonsPage.jsx'
import ComparisonDetailPage from './pages/ComparisonDetailPage.jsx'
import { fetchPRData } from './services/github.js'
import { reviewPR as reviewWithGemini } from './services/gemini.js'
import { reviewPR as reviewWithOpenAI } from './services/openai.js'
import { saveReview, getReviewHistory, getComparisonsPaged } from './services/supabase.js'

function HomePageInner() {
  const navigate = useNavigate()
  const addToast = useToast()
  const { refresh: refreshNavCounts } = useNavCounts()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [review, setReview] = useState(null)
  const [prData, setPrData] = useState(null)
  const [history, setHistory] = useState([])
  const [provider, setProvider] = useState('openai')
  const [statsKey, setStatsKey] = useState(0)

  useEffect(() => {
    getReviewHistory().then(setHistory)
  }, [])

  async function handleAnalyze(url) {
    setIsLoading(true)
    setError(null)

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
      setStatsKey((k) => k + 1)
      refreshNavCounts()

      addToast('Review saved successfully!', 'success')
      if (saved?.id) {
        setTimeout(() => addToast(`View at /review/${saved.id.slice(0, 8)}…`, 'info', 5000), 500)
      }
    } catch (err) {
      const msg = err.message || 'An unexpected error occurred.'
      setError(msg)
      if (msg.includes('rate limit') || msg.includes('429')) {
        addToast('AI rate limit exceeded. Retrying…', 'warning')
      } else {
        addToast(msg, 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <StatsBar refreshKey={statsKey} />

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

        {isLoading && <SkeletonReview />}

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

function HomePage() {
  return (
    <ToastProvider>
      <HomePageInner />
    </ToastProvider>
  )
}

function shortUrl(url) {
  try {
    const m = url.match(/github\.com\/(.+)\/pull\/(\d+)/)
    if (m) return `${m[1]}#${m[2]}`
  } catch {}
  return url
}

const COMP_PAGE_SIZE = 10

function DashboardPage() {
  const navigate = useNavigate()
  const [comparisons, setComparisons] = useState([])
  const [compTotal, setCompTotal] = useState(0)
  const [compPage, setCompPage] = useState(1)
  const [compLoading, setCompLoading] = useState(false)
  const [tab, setTab] = useState('reviews')
  const { reviewCount, comparisonCount } = useNavCounts()

  async function loadComparisons(p) {
    setCompLoading(true)
    const { data, count } = await getComparisonsPaged(p, COMP_PAGE_SIZE)
    setComparisons(data)
    setCompTotal(count)
    setCompLoading(false)
  }

  useEffect(() => {
    if (tab === 'comparisons') loadComparisons(compPage)
  }, [tab, compPage])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-800 pb-0">
          <button
            onClick={() => setTab('reviews')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition border-b-2 ${
              tab === 'reviews'
                ? 'border-indigo-500 text-white bg-gray-900'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Reviews
            <span className="ml-1.5 bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">{reviewCount}</span>
          </button>
          <button
            onClick={() => setTab('comparisons')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition border-b-2 ${
              tab === 'comparisons'
                ? 'border-indigo-500 text-white bg-gray-900'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Comparisons
            <span className="ml-1.5 bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">{comparisonCount}</span>
          </button>
        </div>

        {tab === 'reviews' && (
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <Dashboard />
          </section>
        )}

        {tab === 'comparisons' && (
          <section className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {compLoading && comparisons.length === 0 ? (
              <div className="space-y-3 p-6 animate-pulse">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded-lg" />)}
              </div>
            ) : compTotal === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <p className="text-4xl mb-3">⚖️</p>
                <p className="text-sm">No comparisons saved yet.</p>
                <button
                  onClick={() => navigate('/compare')}
                  className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition"
                >
                  Compare PRs now
                </button>
              </div>
            ) : (
              <>
                <div className={`transition-opacity duration-150 ${compLoading ? 'opacity-40' : 'opacity-100'}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                        <th className="px-5 py-3 text-left font-medium">Old PR</th>
                        <th className="px-5 py-3 text-left font-medium">New PR</th>
                        <th className="px-5 py-3 text-center font-medium text-red-400">Old</th>
                        <th className="px-5 py-3 text-center font-medium text-green-400">New</th>
                        <th className="px-5 py-3 text-center font-medium">Delta</th>
                        <th className="px-5 py-3 text-left font-medium">Date</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {comparisons.map((c) => {
                        const delta = c.score_delta
                        const dCls = delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-500'
                        return (
                          <tr key={c.id} className="hover:bg-gray-800/40 transition cursor-pointer" onClick={() => navigate(`/comparisons/${c.id}`)}>
                            <td className="px-5 py-3 text-gray-300 font-mono text-xs">{shortUrl(c.old_pr_url)}</td>
                            <td className="px-5 py-3 text-gray-300 font-mono text-xs">{shortUrl(c.new_pr_url)}</td>
                            <td className="px-5 py-3 text-center font-bold text-red-400">{c.old_score}</td>
                            <td className="px-5 py-3 text-center font-bold text-green-400">{c.new_score}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`font-semibold ${dCls}`}>
                                {delta > 0 ? '+' : ''}{delta} {delta > 0 ? '↑' : delta < 0 ? '↓' : '—'}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-gray-500 text-xs">
                              {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-5 py-3 text-gray-600 text-base">🔗</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {Math.ceil(compTotal / COMP_PAGE_SIZE) > 1 && (
                  <div className="flex items-center justify-center gap-1 py-3 px-5">
                    <button
                      onClick={() => setCompPage(p => Math.max(1, p - 1))}
                      disabled={compPage === 1 || compLoading}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >←</button>
                    {Array.from({ length: Math.ceil(compTotal / COMP_PAGE_SIZE) }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setCompPage(p)}
                        disabled={compLoading}
                        className={`w-8 h-8 text-sm rounded-lg font-medium transition ${
                          p === compPage ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                        } disabled:cursor-not-allowed`}
                      >{p}</button>
                    ))}
                    <button
                      onClick={() => setCompPage(p => Math.min(Math.ceil(compTotal / COMP_PAGE_SIZE), p + 1))}
                      disabled={compPage === Math.ceil(compTotal / COMP_PAGE_SIZE) || compLoading}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >→</button>
                    <span className="ml-2 text-xs text-gray-600">
                      {(compPage - 1) * COMP_PAGE_SIZE + 1}–{Math.min(compPage * COMP_PAGE_SIZE, compTotal)} of {compTotal}
                    </span>
                  </div>
                )}
              </>
            )}
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
      <Route path="/batch" element={<BatchReview />} />
      <Route path="/developer/:username" element={<DeveloperPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/comparisons" element={<ComparisonsPage />} />
      <Route path="/comparisons/:id" element={<ComparisonDetailPage />} />
    </Routes>
  )
}
