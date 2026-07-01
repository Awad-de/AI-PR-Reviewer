# LOOP.md — AI PR Reviewer TestSprite Iterations

Live URL tested: https://ai-pr-reviewer-snowy.vercel.app
TestSprite Project ID: f9d9e262-e566-4933-9e27-fef1577eac6c

---

## Iteration 1 — PR Input Validation

**Code Written:**
- `src/utils/parseGitHubURL.js` — regex parser for GitHub PR URLs, throws on invalid input
- `src/components/PRInput.jsx` — form with client-side URL validation, red error message, loading/disabled state

**TestSprite Check:** `testsprite test create-batch` → created (ID: `210caabd-a2ed-4ffe-9ae3-70b56b1e1f25`)

**Test plan steps:**
1. Navigate to home page
2. Type `not-a-url` → click Analyze PR → assert red error appears, no spinner
3. Type `https://google.com/not-a-pr` → click Analyze PR → assert error about `/pull/`

**Run:** `testsprite test run 210caabd... --target-url https://ai-pr-reviewer-snowy.vercel.app --wait`

**Errors Found:** None

**Fixes Applied:** None needed

**Result:** `testsprite test run` → **PASS ✅** — 7/7 steps completed
Dashboard: https://www.testsprite.com/dashboard/tests/f9d9e262-e566-4933-9e27-fef1577eac6c/test/210caabd-a2ed-4ffe-9ae3-70b56b1e1f25

---

## Iteration 2 — Dashboard + Supabase History

**Code Written:**
- `src/services/supabase.js` — `saveReview()` inserts row, `getReviewHistory()` fetches last 20
- `src/components/Dashboard.jsx` — table with repo, title (truncated), score (colored), verdict badge, date
- `src/App.jsx` — History tab wired to `getReviewHistory()` on mount and after each analysis

**TestSprite Check:** `testsprite test create-batch` → created (ID: `053e8c00-d790-48a6-8b33-93ca99a67cb5`)

**Test plan steps:**
1. Navigate to home page
2. Click History tab → assert table or empty-state message visible
3. Assert each row shows repo, title, colored score, verdict badge, date
4. Click Review tab → assert PR input is visible again

**Run:** `testsprite test run 053e8c00... --target-url https://ai-pr-reviewer-snowy.vercel.app --wait`

**Errors Found:** None

**Fixes Applied:** None needed

**Result:** `testsprite test run` → **PASS ✅** — 6/6 steps completed
Dashboard: https://www.testsprite.com/dashboard/tests/f9d9e262-e566-4933-9e27-fef1577eac6c/test/053e8c00-d790-48a6-8b33-93ca99a67cb5

---

## Iteration 3 — Full AI Review Flow (GitHub + Gemini)

**Code Written:**
- `src/services/github.js` — `fetchPRData()` fetches PR metadata + file diffs, handles 404/403/network errors
- `src/services/gemini.js` — `reviewPR()` calls Gemini 1.5 Flash, cleans markdown fences, parses JSON, retries once on parse failure
- `src/components/ReviewReport.jsx` — full review layout: header, ScoreBar, MergeVerdict, summary, 5 ReviewCards
- `src/components/ScoreBar.jsx` — animated progress bar, color-coded by score range
- `src/components/MergeVerdict.jsx` — verdict badge (green/red/yellow)
- `src/components/ReviewCard.jsx` — per-category card with colored left border and icon

**TestSprite Check:** `testsprite test create-batch` → created (ID: `070d3dfa-6d4d-4faf-a1aa-cc0661b72107`)

**Test plan steps:**
1. Navigate to home page
2. Paste `https://github.com/vercel/next.js/pull/1` → click Analyze PR → wait
3. Assert review report card with PR title and score/100 appears
4. Assert colored progress bar visible below score label
5. Assert merge verdict badge shows one of the three verdicts
6. Assert 2-3 sentence summary paragraph visible
7. Assert all 5 review category cards visible

**Run:** `testsprite test run 070d3dfa... --target-url https://ai-pr-reviewer-snowy.vercel.app --wait`

**Errors Found:** Pending (test running)

**Fixes Applied:** Pending

**Result:** Pending — see iteration update below

---

## Iteration 4 — Copy Comments Functionality

**Code Written:**
- `src/components/CopyComments.jsx` — renders each comment in a code-like box, Copy button uses `navigator.clipboard.writeText()`, shows "Copied ✓" for 2s then reverts

**TestSprite Check:** `testsprite test create-batch` → created (ID: `f20e4ba7-ffbb-4c22-b757-004f43e7bff1`)

**Test plan steps:**
1. Navigate to home page
2. Paste `https://github.com/vercel/next.js/pull/1` → click Analyze PR → wait for review
3. Scroll to Ready-to-Paste Comments section
4. Assert at least one comment box with Copy button visible
5. Click Copy button → assert label changes to "Copied ✓"
6. Wait ~2 seconds → assert label reverts to "Copy"

**Run:** Queued — to be run after Iteration 3 completes

**Result:** Pending

---

## Iteration 5 — PR Input Loading State

**Code Written:**
- `src/components/PRInput.jsx` — spinner SVG with `animate-spin`, "Analyzing..." text, disabled input during load
- `src/App.jsx` — `isLoading` state passed to `PRInput`, toggled around the full async flow

**TestSprite Check:** `testsprite test create-batch` → created (ID: `5dda9fb8-e895-401f-9c6e-cfe23e1c4ed2`)

**Test plan steps:**
1. Navigate to home page
2. Paste `https://github.com/vercel/next.js/pull/1` → click Analyze PR
3. Assert button shows spinner and "Analyzing..." text while loading
4. Assert input field is disabled during analysis

**Run:** Queued — to be run after Iteration 4 completes

**Result:** Pending

---

## Summary

| # | Feature | Test ID | Status |
|---|---|---|---|
| 1 | PR Input Validation | `210caabd` | ✅ PASS (7/7) |
| 2 | Dashboard + History | `053e8c00` | ✅ PASS (6/6) |
| 3 | Full AI Review Flow | `070d3dfa` | ⏳ Running |
| 4 | Copy Comments | `f20e4ba7` | ⏳ Queued |
| 5 | Loading State | `5dda9fb8` | ⏳ Queued |
