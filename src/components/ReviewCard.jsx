const TYPE_CONFIG = {
  bugs: {
    icon: '🐛',
    label: 'Bugs',
    borderClass: 'border-l-red-500',
    badgeClass: 'bg-red-900/40 text-red-300',
  },
  security_issues: {
    icon: '🔒',
    label: 'Security Issues',
    borderClass: 'border-l-orange-500',
    badgeClass: 'bg-orange-900/40 text-orange-300',
  },
  performance_issues: {
    icon: '⚡',
    label: 'Performance',
    borderClass: 'border-l-blue-500',
    badgeClass: 'bg-blue-900/40 text-blue-300',
  },
  clarity_issues: {
    icon: '📝',
    label: 'Clarity',
    borderClass: 'border-l-purple-500',
    badgeClass: 'bg-purple-900/40 text-purple-300',
  },
  positives: {
    icon: '✅',
    label: 'Positives',
    borderClass: 'border-l-green-500',
    badgeClass: 'bg-green-900/40 text-green-300',
  },
}

/**
 * @param {{ title?: string, items: string[], type: string }} props
 */
export default function ReviewCard({ title, items, type }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.positives
  const displayTitle = title || config.label
  const isEmpty = !items || items.length === 0

  return (
    <div className={`bg-gray-900 border border-gray-800 border-l-4 ${config.borderClass} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{config.icon}</span>
        <h3 className="text-sm font-semibold text-white">{displayTitle}</h3>
        {!isEmpty && (
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${config.badgeClass}`}>
            {items.length}
          </span>
        )}
      </div>

      {isEmpty ? (
        <p className="text-sm text-gray-500 italic">None found ✓</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-gray-600 mt-0.5 shrink-0">•</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
