import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

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

const SPRING = { type: 'spring', stiffness: 300, damping: 30 }
const MAX_TILT = 8

/**
 * @param {{ title?: string, items: string[], type: string }} props
 */
export default function ReviewCard({ title, items, type }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.positives
  const displayTitle = title || config.label
  const isEmpty = !items || items.length === 0

  const ref = useRef(null)
  const rafRef = useRef(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springX = useSpring(rotateX, SPRING)
  const springY = useSpring(rotateY, SPRING)

  useEffect(() => {
    // SSR / touch guard — no tilt on touch-primary devices
    if (typeof window === 'undefined') return
    if (navigator.maxTouchPoints > 0) return
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const el = ref.current
    if (!el) return

    function onMove(e) {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1   // -1 → 1
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1    // -1 → 1
        const cx = Math.max(-1, Math.min(1, nx))
        const cy = Math.max(-1, Math.min(1, ny))
        rotateY.set(cx * MAX_TILT)
        rotateX.set(-cy * MAX_TILT)
      })
    }

    function onLeave() {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      rotateX.set(0)
      rotateY.set(0)
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [rotateX, rotateY])

  return (
    <div className="perspective-1000 review-card">
      <motion.div
        ref={ref}
        data-tilt-enabled="true"
        style={{ rotateX: springX, rotateY: springY }}
        className={`card preserve-3d backface-hidden relative overflow-hidden bg-gray-900 border border-gray-800 border-l-4 ${config.borderClass} rounded-lg p-4 cursor-default`}
      >
        {/* CSS-only sheen sweep on hover */}
        <div className="card-sheen" aria-hidden="true" />

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
