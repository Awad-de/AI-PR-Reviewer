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

function getPuckGlow(score) {
  if (score >= 90) return '0 0 18px 4px rgba(74,222,128,0.35)'
  if (score >= 70) return '0 0 18px 4px rgba(250,204,21,0.35)'
  if (score >= 50) return '0 0 18px 4px rgba(249,115,22,0.35)'
  return '0 0 18px 4px rgba(239,68,68,0.35)'
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
  const puckGlow = getPuckGlow(score)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400 font-medium">Quality Score</span>

        {/* 3D puck score circle */}
        <div
          className={`preserve-3d backface-hidden w-14 h-14 rounded-full flex items-center justify-center ${textColor} font-bold text-lg border border-white/10`}
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.12) 0%, transparent 60%), #1f2937',
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.08), inset 0 -3px 6px rgba(0,0,0,0.5), ${puckGlow}`,
            transform: 'translateZ(20px)',
          }}
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
