import ScoreBar from './ScoreBar.jsx'
import MergeVerdict from './MergeVerdict.jsx'
import ReviewCard from './ReviewCard.jsx'
import CopyComments from './CopyComments.jsx'

const PROVIDER_BADGE = {
  openai: {
    label: '🤖 GPT-4o',
    className: 'bg-blue-900/50 text-blue-300 border border-blue-700',
  },
  gemini: {
    label: '✨ Gemini',
    className: 'bg-purple-900/50 text-purple-300 border border-purple-700',
  },
}

/**
 * @param {{ prData: Object|null, review: Object }} props
 */
export default function ReviewReport({ prData, review }) {
  const badge = PROVIDER_BADGE[review?.ai_provider]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white leading-snug">
                {prData?.pr_title || review?.pr_title || 'Pull Request Review'}
              </h2>
              {badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
              <span>
                by{' '}
                <span className="text-indigo-400 font-medium">
                  {prData?.pr_author || review?.pr_author}
                </span>
              </span>
              <span>·</span>
              <span className="font-mono text-xs text-gray-500">
                {prData?.repo_name || review?.repo_name}
              </span>
            </div>
            {prData?.files_changed != null && (
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>{prData.files_changed} files changed</span>
                <span className="text-green-500">+{prData.additions}</span>
                <span className="text-red-400">-{prData.deletions}</span>
              </div>
            )}
          </div>
          <MergeVerdict verdict={review.verdict} />
        </div>

        <ScoreBar score={review.score} />

        {review.summary && (
          <p className="text-sm text-gray-300 leading-relaxed border-t border-gray-800 pt-4">
            {review.summary}
          </p>
        )}
      </div>

      {/* Review Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReviewCard type="bugs" items={review.bugs} />
        <ReviewCard type="security_issues" items={review.security_issues} />
        <ReviewCard type="performance_issues" items={review.performance_issues} />
        <ReviewCard type="clarity_issues" items={review.clarity_issues} />
        <ReviewCard type="positives" items={review.positives} />
      </div>

      {/* Copy Comments */}
      {review.copy_comments?.length > 0 && (
        <CopyComments comments={review.copy_comments} />
      )}
    </div>
  )
}
