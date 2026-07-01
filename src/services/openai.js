const OPENAI_MODEL = 'gpt-4o-mini'
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

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

function cleanResponseText(text) {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callOpenAI(prompt) {
  const key = import.meta.env.VITE_OPENAI_API_KEY

  const doRequest = () =>
    fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2048,
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
      throw new Error('OpenAI rate limit exceeded. Please wait a moment and try again.')
    }
  }

  if (response.status === 401) {
    throw new Error('Invalid OpenAI API key. Check VITE_OPENAI_API_KEY.')
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${body}`)
  }

  const data = await response.json()
  const raw = data?.choices?.[0]?.message?.content

  if (!raw) {
    throw new Error('OpenAI returned an empty response.')
  }

  return cleanResponseText(raw)
}

/**
 * Sends PR data to OpenAI GPT-4o-mini and returns a structured review object.
 *
 * @param {Object} prData - PR metadata from fetchPRData
 * @returns {Promise<Object>} Parsed review JSON
 */
export async function reviewPR(prData) {
  const text = await callOpenAI(buildPrompt(prData))

  try {
    return JSON.parse(text)
  } catch {
    throw new Error('AI_PARSE_ERROR: Could not parse OpenAI response')
  }
}
