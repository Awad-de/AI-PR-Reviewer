import { useState } from 'react'

/**
 * @param {{ onSubmit: (url: string) => void, isLoading: boolean, error: string|null }} props
 */
export default function PRInput({ onSubmit, isLoading, error }) {
  const [url, setUrl] = useState('')
  const [localError, setLocalError] = useState(null)

  function validate(value) {
    if (!value.startsWith('https://github.com/')) {
      return 'URL must start with https://github.com/'
    }
    if (!/\/pull(s)?\/\d+/.test(value)) {
      return 'URL must contain /pull/123 or /pulls/123'
    }
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = url.trim()
    const validationError = validate(trimmed)
    if (validationError) {
      setLocalError(validationError)
      return
    }
    setLocalError(null)
    onSubmit(trimmed)
  }

  const displayError = localError || error

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setLocalError(null)
          }}
          placeholder="Paste GitHub PR URL (e.g. https://github.com/owner/repo/pull/123)"
          className="flex-1 bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          disabled={isLoading}
          aria-label="GitHub PR URL"
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition whitespace-nowrap text-sm"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            'Analyze PR'
          )}
        </button>
      </div>

      {displayError && (
        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
          <span>⚠</span>
          {displayError}
        </p>
      )}
    </form>
  )
}
