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
      github_username: prData.github_username || prData.pr_author || 'unknown',
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
const REVIEW_FIELDS = 'id, created_at, pr_url, pr_title, pr_author, github_username, repo_name, score, verdict, summary, bugs, security_issues, performance_issues, clarity_issues, positives, copy_comments, ai_provider, suggestions'

export async function getReviewById(id) {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_FIELDS)
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
    .select(REVIEW_FIELDS)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Failed to load review history:', error.message)
    return []
  }

  return data || []
}

export async function getReviewHistoryPaged(page = 1, pageSize = 10) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await supabase
    .from('reviews')
    .select(REVIEW_FIELDS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Failed to load review history page:', error.message)
    return { data: [], count: 0 }
  }

  return { data: data || [], count: count || 0 }
}

export async function getComparisonsPaged(page = 1, pageSize = 10) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await supabase
    .from('comparisons')
    .select('id, created_at, old_pr_url, new_pr_url, old_score, new_score, score_delta, ai_provider', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Failed to load comparisons page:', error.message)
    return { data: [], count: 0 }
  }

  return { data: data || [], count: count || 0 }
}

export async function getTotalReviewCount() {
  const { count, error } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
  return error ? 0 : (count || 0)
}

export async function getTotalComparisonCount() {
  const { count, error } = await supabase
    .from('comparisons')
    .select('id', { count: 'exact', head: true })
  return error ? 0 : (count || 0)
}

/**
 * Fetches all reviews for a specific GitHub username.
 *
 * @param {string} username - GitHub username
 * @returns {Promise<Array>} Array of review rows
 */
export async function getReviewsByUsername(username) {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_FIELDS)
    .eq('github_username', username)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load reviews for username:', error.message)
    return []
  }

  return data || []
}

/**
 * Calculates aggregate stats for a developer from their review history.
 *
 * @param {Array} reviews - Array of review rows from getReviewsByUsername
 * @returns {Object} { total, avgScore, approveRate, mostRecentDate }
 */
export function getDeveloperStats(reviews) {
  if (!reviews.length) {
    return { total: 0, avgScore: 0, approveRate: 0, mostRecentDate: null }
  }

  const total = reviews.length
  const avgScore = Math.round(reviews.reduce((s, r) => s + (r.score || 0), 0) / total)
  const approveCount = reviews.filter((r) => r.verdict === 'APPROVE').length
  const approveRate = Math.round((approveCount / total) * 100)
  const mostRecentDate = reviews.at(-1)?.created_at ?? null

  return { total, avgScore, approveRate, mostRecentDate }
}

/**
 * Saves a PR comparison to Supabase.
 *
 * @param {Object} data - { old_pr_url, new_pr_url, old_review, new_review, old_pr_data, new_pr_data, score_delta, ai_provider }
 * @returns {Promise<Object>} The inserted row
 */
export async function saveComparison(data) {
  const { data: row, error } = await supabase
    .from('comparisons')
    .insert({
      old_pr_url: data.old_pr_url,
      new_pr_url: data.new_pr_url,
      old_score: data.old_review.score,
      new_score: data.new_review.score,
      score_delta: data.new_review.score - data.old_review.score,
      old_review: data.old_review,
      new_review: data.new_review,
      old_pr_data: data.old_pr_data,
      new_pr_data: data.new_pr_data,
      ai_provider: data.ai_provider ?? 'openai',
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to save comparison: ${error.message}`)
  return row
}

/**
 * Retrieves the 20 most recent PR comparisons from Supabase.
 *
 * @returns {Promise<Array>} Array of comparison rows, newest first
 */
export async function getComparisons() {
  const { data, error } = await supabase
    .from('comparisons')
    .select('id, created_at, old_pr_url, new_pr_url, old_score, new_score, score_delta, ai_provider')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Failed to load comparisons:', error.message)
    return []
  }

  return data || []
}

export async function getStats() {
  const { data, error } = await supabase
    .from('reviews')
    .select('score, verdict')

  if (error || !data) return { total: 0, avgScore: 0, approved: 0, changesNeeded: 0 }

  const total = data.length
  const avgScore = total ? Math.round(data.reduce((s, r) => s + (r.score || 0), 0) / total) : 0
  const approved = data.filter((r) => r.verdict === 'APPROVE').length
  const changesNeeded = data.filter((r) => r.verdict === 'REQUEST_CHANGES').length
  return { total, avgScore, approved, changesNeeded }
}

export async function deleteReview(id) {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete: ${error.message}`)
}

export async function getComparisonById(id) {
  const { data, error } = await supabase
    .from('comparisons')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function deleteComparison(id) {
  const { error } = await supabase
    .from('comparisons')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Failed to delete: ${error.message}`)
}
