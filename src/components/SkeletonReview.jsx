function SkeletonBlock({ className }) {
  return <div className={`bg-gray-700 animate-pulse rounded ${className}`} />
}

export default function SkeletonReview() {
  return (
    <div className="space-y-4">
      {/* Score + Verdict row */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <SkeletonBlock className="h-16 w-16 rounded-full" />
            <SkeletonBlock className="h-3 w-12" />
          </div>
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
          </div>
          <SkeletonBlock className="h-8 w-28 rounded-full" />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-2">
        <SkeletonBlock className="h-3 w-24 mb-3" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-11/12" />
        <SkeletonBlock className="h-3 w-4/5" />
      </div>

      {/* 5 category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
