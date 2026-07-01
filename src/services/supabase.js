import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Saves a completed review to Supabase.
 *
 * @param {Object} prData - PR metadata from fetchPRData
 * @param {Object} reviewResult - Parsed review from reviewPR
 * @returns {Promise<Object>} The inserted row
 */
export async function saveReview(prData, reviewResult) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      pr_url: prData.pr_url,
      pr_title: prData.pr_title,
      pr_author: prData.pr_author,
      repo_name: prData.repo_name,
      score: reviewResult.score,
      verdict: reviewResult.verdict,
      summary: reviewResult.summary,
      bugs: reviewResult.bugs,
      security_issues: reviewResult.security_issues,
      performance_issues: reviewResult.performance_issues,
      clarity_issues: reviewResult.clarity_issues,
      positives: reviewResult.positives,
      copy_comments: reviewResult.copy_comments,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save review: ${error.message}`)
  }

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
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Failed to load review history:', error.message)
    return []
  }

  return data || []
}
