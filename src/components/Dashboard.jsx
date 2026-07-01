function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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

/**
 * @param {{ reviews: Array, onSelectReview: (review: Object) => void }} props
 */
export default function Dashboard({ reviews, onSelectReview }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-base">No reviews yet. Analyze your first PR above.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="pb-3 text-xs uppercase tracking-wider text-gray-500 font-medium pr-4">Repository</th>
            <th className="pb-3 text-xs uppercase tracking-wider text-gray-500 font-medium pr-4">PR Title</th>
            <th className="pb-3 text-xs uppercase tracking-wider text-gray-500 font-medium pr-4">Score</th>
            <th className="pb-3 text-xs uppercase tracking-wider text-gray-500 font-medium pr-4">Verdict</th>
            <th className="pb-3 text-xs uppercase tracking-wider text-gray-500 font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {reviews.map((review) => (
            <tr
              key={review.id}
              onClick={() => onSelectReview(review)}
              className="hover:bg-gray-800/50 cursor-pointer transition"
            >
              <td className="py-3 pr-4 text-gray-300 font-mono text-xs">
                {truncate(review.repo_name, 30)}
              </td>
              <td className="py-3 pr-4 text-gray-200">
                {truncate(review.pr_title, 40)}
              </td>
              <td className="py-3 pr-4">
                <span className={`font-bold ${scoreColor(review.score)}`}>
                  {review.score}/100
                </span>
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                    VERDICT_STYLES[review.verdict] || VERDICT_STYLES.NEEDS_DISCUSSION
                  }`}
                >
                  {VERDICT_ICONS[review.verdict] || '💬'} {review.verdict}
                </span>
              </td>
              <td className="py-3 text-gray-400 whitespace-nowrap">
                {formatDate(review.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
