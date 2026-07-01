const GEMINI_MODEL = 'gemini-2.0-flash'

function buildEndpoint() {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`
}

function buildPrompt(prData) {
  return `You are an expert code reviewer. Analyze this GitHub Pull Request and return ONLY a valid JSON object with no extra text, no markdown, no code fences.

PR Title: ${prData.pr_title}
Author: ${prData.pr_author}
Repository: ${prData.repo_name}
Files Changed: ${prData.files_changed}
Additions: ${prData.additions}, Deletions: ${prData.deletions}

Code Diff:
${prData.diff}

Return this exact JSON structure:
{
  "score": <number 0-100>,
  "verdict": "<one of: APPROVE, REQUEST_CHANGES, NEEDS_DISCUSSION>",
  "summary": "<2-3 sentence overview of what this PR does and its quality>",
  "bugs": ["<bug description>", ...] or [],
  "security_issues": ["<issue description>", ...] or [],
  "performance_issues": ["<issue description>", ...] or [],
  "clarity_issues": ["<issue description>", ...] or [],
  "positives": ["<positive point>", ...],
  "copy_comments": ["<ready-to-paste GitHub comment>", ...]
}

Score guide: 90-100=excellent, 70-89=good, 50-69=needs work, below 50=major issues.
copy_comments should be 2-3 ready-to-use review comments the user can paste directly on GitHub.`
}

function buildSimplifiedPrompt(prData) {
  return `Review this PR and return ONLY valid JSON, nothing else. No markdown, no explanation.

PR: ${prData.pr_title} by ${prData.pr_author} in ${prData.repo_name}

JSON format:
{"score":75,"verdict":"APPROVE","summary":"Brief summary.","bugs":[],"security_issues":[],"performance_issues":[],"clarity_issues":[],"positives":["Good code"],"copy_comments":["LGTM! This looks good to merge."]}`
}

function cleanResponseText(text) {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

async function callGemini(prompt) {
  const response = await fetch(buildEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${body}`)
  }

  const data = await response.json()
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!raw) {
    throw new Error('Gemini returned an empty response.')
  }

  return cleanResponseText(raw)
}

/**
 * Sends PR data to Gemini and returns a structured review object.
 *
 * @param {Object} prData - PR metadata from fetchPRData
 * @returns {Promise<Object>} Parsed review JSON
 */
export async function reviewPR(prData) {
  const primaryText = await callGemini(buildPrompt(prData))

  try {
    return JSON.parse(primaryText)
  } catch {
    // Retry with simplified prompt
    const retryText = await callGemini(buildSimplifiedPrompt(prData))

    try {
      return JSON.parse(retryText)
    } catch {
      throw new Error('AI_PARSE_ERROR: Could not parse Gemini response')
    }
  }
}
