import { useEffect, useRef, useState } from 'react'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import 'highlight.js/styles/github-dark.css'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)

function CodeBlock({ code, label, colorClass }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current && code) {
      ref.current.removeAttribute('data-highlighted')
      ref.current.textContent = code
      hljs.highlightElement(ref.current)
    }
  }, [code])

  return (
    <div className="flex-1 min-w-0 rounded-lg overflow-hidden border border-gray-700">
      <div className={`px-3 py-1.5 text-xs font-semibold ${colorClass}`}>
        {label}
      </div>
      <pre className="m-0 overflow-x-auto text-xs leading-relaxed max-h-64">
        <code ref={ref} className="hljs !bg-gray-900 !p-3 block" />
      </pre>
    </div>
  )
}

function SuggestionCard({ suggestion, index }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(suggestion.fixed_code).catch(() => {
      const el = document.createElement('textarea')
      el.value = suggestion.fixed_code
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      {/* Issue title + copy button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="text-gray-500 text-sm font-mono mt-0.5">#{index + 1}</span>
          <h4 className="text-sm font-semibold text-red-400">{suggestion.issue}</h4>
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition border ${
            copied
              ? 'bg-green-800/50 text-green-300 border-green-700'
              : 'bg-gray-800 text-gray-300 border-gray-700 hover:text-white hover:bg-gray-700'
          }`}
        >
          {copied ? 'Copied ✓' : 'Copy Fix'}
        </button>
      </div>

      {/* Side-by-side code blocks */}
      <div className="flex flex-col sm:flex-row gap-3">
        <CodeBlock
          code={suggestion.broken_code}
          label="❌ Current Code"
          colorClass="bg-red-950/60 text-red-300"
        />
        <CodeBlock
          code={suggestion.fixed_code}
          label="✅ Fixed Code"
          colorClass="bg-green-950/60 text-green-300"
        />
      </div>

      {/* Explanation */}
      {suggestion.explanation && (
        <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-800 pt-3">
          💡 {suggestion.explanation}
        </p>
      )}
    </div>
  )
}

/**
 * @param {{ suggestions: Array }} props
 */
export default function AutoSuggest({ suggestions }) {
  const raw = suggestions
  const list = Array.isArray(raw) ? raw : []

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-white flex items-center gap-2">
        <span>🔧</span>
        <span>Auto-suggested Fixes</span>
        {list.length > 0 && (
          <span className="text-xs bg-gray-800 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full font-normal">
            {list.length} fix{list.length !== 1 ? 'es' : ''}
          </span>
        )}
        {/* debug: remove after confirming */}
        <span className="text-xs text-gray-700 font-mono ml-2">
          ({raw === undefined ? 'undefined' : raw === null ? 'null' : `array[${list.length}]`})
        </span>
      </h3>

      {list.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center text-sm text-gray-400">
          ✅ No fixes needed — code looks clean!
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((s, i) => (
            <SuggestionCard key={i} suggestion={s} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
