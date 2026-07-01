import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Saves a completed review to Supabase.
 *
 * @param {Object} prData - PR metadata from fetchPRData
 * @param {Object} reviewResult - Parsed review from reviewPR
 * @param {string} aiProvider - 'openai' or 'gemini'
 * @returns {Promise<Object>} The inserted row
 */
const VALID_VERDICTS = ['APPROVE', 'REQUEST_CHANGES', 'NEEDS_DISCUSSION']

function normalizeVerdict(verdict) {
  if (!verdict) return 'NEEDS_DISCUSSION'
  const upper = verdict.toUpperCase().replace(/\s+/g, '_')
  return VALID_VERDICTS.includes(upper) ? upper : 'NEEDS_DISCUSSION'
}

export async function saveReview(prData, reviewResult, aiProvider = 'openai') {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      pr_url: prData.pr_url,
      pr_title: prData.pr_title,
      pr_author: prData.pr_author,
      repo_name: prData.repo_name,
      score: reviewResult.score,
      verdict: normalizeVerdict(reviewResult.verdict),
      summary: reviewResult.summary,
      bugs: reviewResult.bugs,
      security_issues: reviewResult.security_issues,
      performance_issues: reviewResult.performance_issues,
      clarity_issues: reviewResult.clarity_issues,
      positives: reviewResult.positives,
      copy_comments: reviewResult.copy_comments,
      ai_provider: aiProvider,
      suggestions: reviewResult.suggestions ?? [],
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save review: ${error.message}`)
  }

  return data
}

/**
 * Fetches a single review by its UUID.
 *
 * @param {string} id - UUID of the review
 * @returns {Promise<Object|null>} The review row, or null if not found
 */
export async function getReviewById(id) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, created_at, pr_url, pr_title, pr_author, repo_name, score, verdict, summary, bugs, security_issues, performance_issues, clarity_issues, positives, copy_comments, ai_provider, suggestions')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

/**
 * Retrieves the 20 most recent reviews from Supabase.
 *
 * @returns {Promise<Array>} Array of review rows, newest first
 */
export async function getReviewHistory() {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, created_at, pr_url, pr_title, pr_author, repo_name, score, verdict, summary, bugs, security_issues, performance_issues, clarity_issues, positives, copy_comments, ai_provider, suggestions')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Failed to load review history:', error.message)
    return []
  }

  return data || []
}
