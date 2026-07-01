import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getReviewsByUsername, getDeveloperStats } from '../services/supabase.js'

function StatCard({ label, value, color }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col items-center gap-1 min-w-0">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-gray-400 text-center">{label}</span>
    </div>
  )
}

function scoreColor(score) {
  if (score >= 75) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

function verdictBadge(verdict) {
  const map = {
    APPROVE: 'bg-green-900/60 text-green-300',
    REQUEST_CHANGES: 'bg-red-900/60 text-red-300',
    NEEDS_DISCUSSION: 'bg-yellow-900/60 text-yellow-300',
  }
  return map[verdict] ?? 'bg-gray-800 text-gray-400'
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DeveloperPage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getReviewsByUsername(username).then((data) => {
      setReviews(data)
      setLoading(false)
    })
  }, [username])

  const stats = getDeveloperStats(reviews)

  const chartData = reviews.map((r) => ({
    date: new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: r.score,
  }))

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
            <a
              href="/"
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              Review
            </a>
            <a
              href="/dashboard"
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              History
            </a>
            <a
              href="/batch"
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              Batch Review
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
        >
          ← Back
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <svg className="animate-spin h-8 w-8 text-indigo-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading profile…
          </div>
        ) : (
          <>
            {/* Profile header */}
            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center gap-6">
              <img
                src={`https://github.com/${username}.png`}
                alt={username}
                className="w-20 h-20 rounded-full border-2 border-gray-700"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white">@{username}</h1>
                <a
                  href={`https://github.com/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-sm transition mt-0.5 inline-block"
                >
                  View on GitHub ↗
                </a>
              </div>
            </section>

            {/* Stats cards */}
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Stats</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Total PRs Reviewed" value={stats.total} color="text-white" />
                <StatCard
                  label="Average Score"
                  value={stats.total ? `${stats.avgScore}/100` : '—'}
                  color={stats.total ? scoreColor(stats.avgScore) : 'text-gray-500'}
                />
                <StatCard
                  label="Approve Rate"
                  value={stats.total ? `${stats.approveRate}%` : '—'}
                  color={stats.total ? (stats.approveRate >= 60 ? 'text-green-400' : 'text-yellow-400') : 'text-gray-500'}
                />
                <StatCard
                  label="Most Recent Review"
                  value={formatDate(stats.mostRecentDate)}
                  color="text-gray-300"
                />
              </div>
            </section>

            {reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <p className="text-5xl mb-4">👤</p>
                <p className="text-base">No reviews found for @{username}</p>
                <p className="text-sm mt-1">Analyze a PR authored by this user to populate their profile.</p>
              </div>
            ) : (
              <>
                {/* Score History Chart */}
                <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Score History</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                        labelStyle={{ color: '#d1d5db' }}
                        itemStyle={{ color: '#34d399' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#34d399"
                        strokeWidth={2}
                        dot={{ fill: '#34d399', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </section>

                {/* Reviews table */}
                <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Reviews</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                          <th className="pb-3 text-left font-medium">PR</th>
                          <th className="pb-3 text-left font-medium">Repo</th>
                          <th className="pb-3 text-left font-medium">Score</th>
                          <th className="pb-3 text-left font-medium">Verdict</th>
                          <th className="pb-3 text-left font-medium">Date</th>
                          <th className="pb-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {[...reviews].reverse().map((review) => (
                          <tr
                            key={review.id}
                            onClick={() => navigate(`/review/${review.id}`)}
                            className="hover:bg-gray-800/40 cursor-pointer transition"
                          >
                            <td className="py-3 pr-4 max-w-[200px] truncate text-gray-200">
                              {review.pr_title || review.pr_url}
                            </td>
                            <td className="py-3 pr-4 text-gray-400 text-xs">{review.repo_name}</td>
                            <td className="py-3 pr-4">
                              <span className={`font-semibold ${scoreColor(review.score)}`}>
                                {review.score}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${verdictBadge(review.verdict)}`}>
                                {review.verdict?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-gray-500 text-xs">{formatDate(review.created_at)}</td>
                            <td className="py-3 text-gray-600 text-base">🔗</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
