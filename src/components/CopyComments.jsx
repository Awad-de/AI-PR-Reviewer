import { useState } from 'react'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`text-xs px-2 py-1 rounded transition font-medium ${
        copied
          ? 'bg-green-700 text-green-100'
          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
      }`}
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  )
}

/**
 * @param {{ comments: string[] }} props
 */
export default function CopyComments({ comments }) {
  if (!comments || comments.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Ready-to-Paste Comments
      </h3>
      {comments.map((comment, idx) => (
        <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-750 border-b border-gray-700">
            <span className="text-xs text-gray-500">Comment {idx + 1}</span>
            <CopyButton text={comment} />
          </div>
          <pre className="px-4 py-3 text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {comment}
          </pre>
        </div>
      ))}
    </div>
  )
}
