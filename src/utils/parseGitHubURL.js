/**
 * Parses a GitHub PR URL and extracts owner, repo, and pull_number.
 * Accepts:
 *   https://github.com/owner/repo/pull/123
 *   https://github.com/owner/repo/pulls/123
 *
 * @param {string} url
 * @returns {{ owner: string, repo: string, pull_number: number }}
 * @throws {Error} if the URL doesn't match the expected format
 */
export function parseGitHubURL(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid GitHub PR URL')
  }

  const pattern = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pulls?\/(\d+)/

  const match = url.trim().match(pattern)

  if (!match) {
    throw new Error('Invalid GitHub PR URL')
  }

  const [, owner, repo, pull_number] = match

  return {
    owner,
    repo,
    pull_number: parseInt(pull_number, 10),
  }
}
