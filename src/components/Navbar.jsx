import { useNavigate, useLocation } from 'react-router-dom'
import DeveloperSearch from './DeveloperSearch.jsx'
import { useNavCounts } from '../contexts/NavCounts.jsx'

const MAX_BADGE = 20

function Badge({ count }) {
  // hide badge for links that have no badge prop (undefined/null), but always show for count >= 0
  if (count == null) return null
  const label = count > MAX_BADGE ? `${MAX_BADGE}+` : count
  return (
    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-indigo-500 text-white leading-none">
      {label}
    </span>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { reviewCount, comparisonCount } = useNavCounts()

  const isActive = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  const NAV_LINKS = [
    { label: 'Review',      path: '/' },
    { label: 'History',     path: '/dashboard',    badge: reviewCount },
    { label: 'Batch',       path: '/batch' },
    { label: 'Compare',     path: '/compare' },
    { label: 'Comparisons', path: '/comparisons',  badge: comparisonCount },
  ]

  return (
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 shrink-0 mr-2"
        >
          <span className="text-xl">🔍</span>
          <span className="font-bold text-white text-base tracking-tight hidden sm:block">
            AI PR Reviewer
          </span>
        </button>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none flex-1 min-w-0">
          {NAV_LINKS.map(({ label, path, badge }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap flex items-center ${
                isActive(path)
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {label}
              <Badge count={badge} />
            </button>
          ))}
        </nav>

        {/* Developer search */}
        <div className="shrink-0 pl-2 border-l border-gray-700">
          <DeveloperSearch />
        </div>
      </div>
    </header>
  )
}
