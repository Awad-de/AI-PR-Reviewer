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
  "copy_comments": ["<ready-to-paste GitHub comment>", ...],
  "suggestions": [
    {
      "issue": "<short title of the problem>",
      "broken_code": "<the actual problematic code snippet from the diff, max 10 lines>",
      "fixed_code": "<the corrected version of that code, max 10 lines>",
      "explanation": "<one sentence why this fix works>"
    }
  ]
}

Score guide: 90-100=excellent, 70-89=good, 50-69=needs work, below 50=major issues.
copy_comments should be 2-3 ready-to-use review comments the user can paste directly on GitHub.
suggestions: for each concrete issue found (bugs, security, performance, clarity), provide a code fix. If the diff does not contain clear fixable code snippets, return an empty suggestions array.`
}

function cleanResponseText(text) {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callGemini(prompt) {
  const doRequest = () =>
    fetch(buildEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
      }),
    })

  let response = await doRequest().catch(() => {
    throw new Error('Network error. Check your connection.')
  })

  if (response.status === 429) {
    await sleep(5000)
    response = await doRequest().catch(() => {
      throw new Error('Network error. Check your connection.')
    })
    if (response.status === 429) {
      throw new Error('Gemini rate limit exceeded. Please wait a moment and try again.')
    }
  }

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
  const text = await callGemini(buildPrompt(prData))

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('AI_PARSE_ERROR: Could not parse Gemini response')
  }
}
