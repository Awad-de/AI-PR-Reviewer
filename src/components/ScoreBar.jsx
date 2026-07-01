import { useEffect, useState } from 'react'

function getColor(score) {
  if (score >= 90) return 'bg-green-500'
  if (score >= 70) return 'bg-yellow-400'
  if (score >= 50) return 'bg-orange-500'
  return 'bg-red-500'
}

function getTextColor(score) {
  if (score >= 90) return 'text-green-400'
  if (score >= 70) return 'text-yellow-400'
  if (score >= 50) return 'text-orange-400'
  return 'text-red-400'
}

/**
 * @param {{ score: number }} props
 */
export default function ScoreBar({ score }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 50)
    return () => clearTimeout(timer)
  }, [score])

  const barColor = getColor(score)
  const textColor = getTextColor(score)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-400 font-medium">Quality Score</span>
        <span className={`text-lg font-bold ${textColor}`}>{score}/100</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${animated}%` }}
        />
      </div>
    </div>
  )
}
