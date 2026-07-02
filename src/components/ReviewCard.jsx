import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

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

  const ref = useRef(null)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 })
  const [shine, setShine] = useState({ x: 50, y: 50, opacity: 0 })

  function handleMouseMove(e) {
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)
    setTilt({ rotateX: -dy * 10, rotateY: dx * 10 })
    setShine({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      opacity: 0.12,
    })
  }

  function handleMouseLeave() {
    setTilt({ rotateX: 0, rotateY: 0 })
    setShine({ x: 50, y: 50, opacity: 0 })
  }

  return (
    <div className="perspective-1000">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`preserve-3d backface-hidden relative bg-gray-900 border border-gray-800 border-l-4 ${config.borderClass} rounded-lg p-4 cursor-default`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Glassmorphism shine sweep */}
        <div
          className="pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,${shine.opacity}) 0%, transparent 65%)`,
          }}
        />

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
      </motion.div>
    </div>
  )
}
