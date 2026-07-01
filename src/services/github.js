import { parseGitHubURL } from '../utils/parseGitHubURL.js'

const MAX_DIFF_LENGTH = 15000

function buildHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  const token = import.meta.env.VITE_GITHUB_TOKEN
  if (token && token !== 'your_github_token_here') {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

async function githubFetch(url) {
  let response

  try {
    response = await fetch(url, { headers: buildHeaders() })
  } catch {
    throw new Error('Network error. Check your connection.')
  }

  if (response.status === 404) {
    throw new Error('PR not found. Check the URL.')
  }

  if (response.status === 401) {
    throw new Error('GitHub token is invalid or expired. Update VITE_GITHUB_TOKEN in your environment.')
  }

  if (response.status === 403) {
    throw new Error('GitHub rate limit exceeded. Add a valid GitHub token.')
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetches all relevant PR data from the GitHub API.
 *
 * @param {string} prURL - Full GitHub PR URL
 * @returns {Promise<Object>} PR metadata and combined diff string
 */
export async function fetchPRData(prURL) {
  let parsed

  try {
    parsed = parseGitHubURL(prURL)
  } catch {
    throw new Error('Invalid GitHub PR URL format.')
  }

  const { owner, repo, pull_number } = parsed

  const base = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}`

  const [pr, files] = await Promise.all([
    githubFetch(base),
    githubFetch(`${base}/files`),
  ])

  const totalAdditions = files.reduce((sum, f) => sum + (f.additions || 0), 0)
  const totalDeletions = files.reduce((sum, f) => sum + (f.deletions || 0), 0)

  const rawDiff = files
    .map((f) => {
      const patch = f.patch || '(binary or no diff)'
      return `--- ${f.filename} [${f.status}] +${f.additions} -${f.deletions}\n${patch}`
    })
    .join('\n\n')

  const diff = rawDiff.length > MAX_DIFF_LENGTH
    ? rawDiff.slice(0, MAX_DIFF_LENGTH) + '\n\n[...diff truncated for token limit...]'
    : rawDiff

  return {
    pr_url: prURL,
    pr_title: pr.title,
    pr_author: pr.user?.login || 'unknown',
    github_username: pr.user?.login || 'unknown',
    repo_name: pr.base?.repo?.full_name || `${owner}/${repo}`,
    pr_body: pr.body || '',
    files_changed: files.length,
    additions: totalAdditions,
    deletions: totalDeletions,
    diff,
  }
}
