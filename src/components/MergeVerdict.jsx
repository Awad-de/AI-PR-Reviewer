const VERDICTS = {
  APPROVE: {
    icon: '✅',
    label: 'Approve Merge',
    className: 'bg-green-900/50 text-green-300 border border-green-700',
  },
  REQUEST_CHANGES: {
    icon: '❌',
    label: 'Request Changes',
    className: 'bg-red-900/50 text-red-300 border border-red-700',
  },
  NEEDS_DISCUSSION: {
    icon: '💬',
    label: 'Needs Discussion',
    className: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
  },
}

/**
 * @param {{ verdict: 'APPROVE' | 'REQUEST_CHANGES' | 'NEEDS_DISCUSSION' }} props
 */
export default function MergeVerdict({ verdict }) {
  const config = VERDICTS[verdict] || VERDICTS.NEEDS_DISCUSSION

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${config.className}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}
