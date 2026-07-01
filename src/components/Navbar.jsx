import { useNavigate, useLocation } from 'react-router-dom'
import DeveloperSearch from './DeveloperSearch.jsx'

const NAV_LINKS = [
  { label: 'Review',       path: '/' },
  { label: 'History',      path: '/dashboard' },
  { label: 'Batch',        path: '/batch' },
  { label: 'Compare',      path: '/compare' },
  { label: 'Comparisons',  path: '/comparisons' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const isActive = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  return (
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 shrink-0 mr-2"
        >
          <img src="/logo.png" alt="AI PR Reviewer" className="h-8 w-8 rounded-xl object-cover" />
          <span className="font-bold text-white text-base tracking-tight hidden sm:block">
            AI PR Reviewer
          </span>
        </button>

        {/* Nav links — scrollable on small screens */}
        <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none flex-1 min-w-0">
          {NAV_LINKS.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                isActive(path)
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Developer search — compact, right side */}
        <div className="shrink-0 pl-2 border-l border-gray-700">
          <DeveloperSearch />
        </div>
      </div>
    </header>
  )
}
