import { useEffect, useState } from 'react'

function getBarColor(score) {
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

function getGlowColor(score) {
  if (score >= 90) return 'shadow-green-500/40'
  if (score >= 70) return 'shadow-yellow-400/40'
  if (score >= 50) return 'shadow-orange-500/40'
  return 'shadow-red-500/40'
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

  const barColor = getBarColor(score)
  const textColor = getTextColor(score)
  const glowColor = getGlowColor(score)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400 font-medium">Quality Score</span>

        {/* 3D score puck — depth via CSS class, no inline transforms */}
        <div
          className={`score-puck preserve-3d backface-hidden w-14 h-14 flex items-center justify-center ${textColor} font-bold text-lg border border-white/10 shadow-lg ${glowColor}`}
        >
          {score}
        </div>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${animated}%` }}
        />
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-600">0</span>
        <span className="text-xs text-gray-600">100</span>
      </div>
    </div>
  )
}
