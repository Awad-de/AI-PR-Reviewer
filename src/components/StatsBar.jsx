import { useEffect, useState, useRef } from 'react'
import { getStats } from '../services/supabase.js'

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.round(progress * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}

function StatItem({ icon, label, value, color }) {
  const display = useCountUp(value)
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <span className="text-base">{icon}</span>
      <span className={`text-lg font-bold ${color}`} style={{ animation: 'countUp 0.4s ease-out' }}>
        {display}
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

export default function StatsBar({ refreshKey }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getStats().then(setStats)
  }, [refreshKey])

  if (!stats || stats.total === 0) return null

  return (
    <div className="bg-gray-900/60 border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-0 divide-x divide-gray-800 overflow-x-auto">
        <StatItem icon="📊" label="Total Reviews" value={stats.total} color="text-white" />
        <StatItem icon="⭐" label="Avg Score" value={stats.avgScore} color="text-yellow-400" />
        <StatItem icon="✅" label="Approved" value={stats.approved} color="text-green-400" />
        <StatItem icon="🔁" label="Changes Needed" value={stats.changesNeeded} color="text-red-400" />
      </div>
    </div>
  )
}
