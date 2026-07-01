const PROVIDERS = [
  {
    id: 'openai',
    label: 'OpenAI GPT-4o',
    emoji: '🤖',
    baseClass: 'bg-blue-900/40 border-blue-700 text-blue-300 hover:bg-blue-800/50',
    activeClass: 'bg-blue-700 border-blue-400 text-white shadow-lg shadow-blue-900/40',
  },
  {
    id: 'gemini',
    label: 'Gemini Flash',
    emoji: '✨',
    baseClass: 'bg-purple-900/40 border-purple-700 text-purple-300 hover:bg-purple-800/50',
    activeClass: 'bg-purple-700 border-purple-400 text-white shadow-lg shadow-purple-900/40',
  },
]

/**
 * @param {{ selectedProvider: string, onProviderChange: (id: string) => void }} props
 */
export default function AIProviderSelect({ selectedProvider, onProviderChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mr-1">
        AI Model
      </span>
      {PROVIDERS.map((p) => {
        const isActive = selectedProvider === p.id
        return (
          <button
            key={p.id}
            onClick={() => onProviderChange(p.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-150 ${
              isActive ? p.activeClass : p.baseClass
            }`}
          >
            <span>{p.emoji}</span>
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
