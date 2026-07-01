import { fetchPRData } from './github.js'
import { reviewPR as reviewWithGemini } from './gemini.js'
import { reviewPR as reviewWithOpenAI } from './openai.js'
import { saveReview } from './supabase.js'

/**
 * Analyzes multiple PRs in parallel.
 *
 * @param {string[]} urls - Array of GitHub PR URLs
 * @param {string} provider - 'openai' | 'gemini'
 * @param {function} onProgress - Called with (index, status, data?) after each PR completes
 * @returns {Promise<Array<{url, status: 'success'|'error', data?, error?, savedId?}>>}
 */
export async function analyzeBatch(urls, provider, onProgress) {
  const reviewFn = provider === 'openai' ? reviewWithOpenAI : reviewWithGemini

  const tasks = urls.map(async (url, index) => {
    onProgress?.(index, 'analyzing')
    try {
      const prData = await fetchPRData(url)
      const reviewResult = await reviewFn(prData)
      const saved = await saveReview(prData, reviewResult, provider)
      onProgress?.(index, 'success', { ...reviewResult, ai_provider: provider, id: saved?.id, pr_title: prData.pr_title, pr_url: url })
      return { url, status: 'success', data: { ...reviewResult, ai_provider: provider, id: saved?.id, pr_title: prData.pr_title, pr_url: url } }
    } catch (err) {
      const message = err.message || 'Unknown error'
      onProgress?.(index, 'error', null, message)
      return { url, status: 'error', error: message }
    }
  })

  const results = await Promise.allSettled(tasks)
  return results.map((r) => (r.status === 'fulfilled' ? r.value : { url: '', status: 'error', error: r.reason?.message || 'Unknown error' }))
}
