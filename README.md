<div align="center">
  <img src="public/logo.png" width="96" height="96" style="border-radius:20px" alt="AI PR Reviewer" />
  <h1>AI PR Reviewer</h1>
</div>

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://ai-pr-reviewer-snowy.vercel.app)
[![CI](https://github.com/Awad-de/AI-PR-Reviewer/actions/workflows/testsprite.yml/badge.svg)](https://github.com/Awad-de/AI-PR-Reviewer/actions/workflows/testsprite.yml)
[![TestSprite](https://img.shields.io/badge/TestSprite-16%20tests%20passing-brightgreen)](https://www.testsprite.com/dashboard/tests/f9d9e262-e566-4933-9e27-fef1577eac6c)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

An AI-powered GitHub Pull Request reviewer built with React, Vite, Tailwind CSS, OpenAI GPT-4o / Gemini 2.0 Flash, and Supabase — developed iteratively with a full **write → deploy → verify → fix → verify** loop using the TestSprite CLI.

🌐 **Live:** https://ai-pr-reviewer-snowy.vercel.app  
📦 **Repo:** https://github.com/Awad-de/AI-PR-Reviewer  
🧪 **TestSprite Dashboard:** https://www.testsprite.com/dashboard/tests/f9d9e262-e566-4933-9e27-fef1577eac6c  
📋 **Loop Log:** [LOOP.md](./LOOP.md) — 16 iterations · 15 features · 1 bug fix · 16 test runs · all passing

---

## Features

| # | Feature | Route |
|---|---------|-------|
| 1 | **AI Code Review** — quality score 0–100, verdict, summary, 5 category cards | `/` |
| 2 | **Multi-Provider AI** — switch between OpenAI GPT-4o & Gemini 2.0 Flash | `/` |
| 3 | **Auto-suggest Fixes** — AI writes broken vs fixed code side-by-side with syntax highlighting | `/` |
| 4 | **Batch Review** — analyze up to 5 PRs in parallel with progress bar + summary | `/batch` |
| 5 | **Shareable Review Pages** — every review gets a permanent URL | `/review/:id` |
| 6 | **PR Comparison** — compare two PRs with score banner, diff table, side-by-side reports | `/compare` |
| 7 | **Saved Comparisons** — view, share, and delete saved comparisons | `/comparisons` |
| 8 | **Developer Profile** — GitHub avatar, score history chart (Recharts), stats, all reviews | `/developer/:username` |
| 9 | **Review History** — dashboard with AI-provider filter, delete button, share link | `/dashboard` |
| 10 | **Copy-to-GitHub Comments** — one-click copy of ready-to-paste review comments | `/` |
| 11 | **Skeleton Loading** — animated gray pulse blocks replace the spinner while AI analyzes | `/` |
| 12 | **Toast Notifications** — slide-in success / error / warning / info toasts (auto-dismiss 3s) | all pages |
| 13 | **Confetti + Excellence Banner** — pure-CSS confetti + gold banner when score ≥ 90 | `/` |
| 14 | **Stats Bar** — animated count-up strip: Total Reviews · Avg Score · Approved · Changes Needed | `/` |
| 15 | **Live Nav Badges** — History and Comparisons nav links show live item counts, update instantly on add/delete | all pages |

---

## The Loop

This project was built entirely through a **TestSprite verification loop**:

```
Write code → Deploy to Vercel → testsprite test create → Analyze verdict → Fix → Re-run
```

Every feature was verified by a real TestSprite run against the live app before moving on. Every bug caught by TestSprite was fixed and re-verified. The full log lives in [`LOOP.md`](./LOOP.md).

**16 iterations. 15 features shipped. 1 bug fixed. 16 test runs. 0 skipped verifications.**

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts |
| Syntax Highlighting | highlight.js |
| AI — Option 1 | OpenAI GPT-4o mini |
| AI — Option 2 | Google Gemini 2.0 Flash |
| GitHub Data | GitHub REST API v3 |
| Database | Supabase (PostgreSQL + RLS) |
| Deployment | Vercel |
| Testing | TestSprite CLI |
| CI/CD | GitHub Actions |

---

## Local Setup

### 1. Clone & install

```bash
git clone https://github.com/Awad-de/AI-PR-Reviewer.git
cd AI-PR-Reviewer
npm install
```

### 2. Environment variables

Create `.env`:

```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GITHUB_TOKEN=your_github_token_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

| Variable | Where to get it |
|----------|----------------|
| `VITE_OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `VITE_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `VITE_GITHUB_TOKEN` | [GitHub Settings → Tokens](https://github.com/settings/tokens) — `repo` scope |
| `VITE_SUPABASE_URL` | Supabase project → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase project → Settings → API |

### 3. Supabase setup

Run in Supabase SQL Editor:

```sql
-- Reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  pr_url text, pr_title text, pr_author text, github_username text,
  repo_name text, score integer, verdict text, summary text,
  bugs text[], security_issues text[], performance_issues text[],
  clarity_issues text[], positives text[], copy_comments text[],
  ai_provider text DEFAULT 'openai', suggestions jsonb DEFAULT '[]'
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete" ON reviews FOR DELETE USING (true);

-- Comparisons table
CREATE TABLE comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  old_pr_url text, new_pr_url text,
  old_score integer, new_score integer, score_delta integer,
  old_review jsonb, new_review jsonb,
  old_pr_data jsonb, new_pr_data jsonb,
  ai_provider text DEFAULT 'openai'
);
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON comparisons FOR ALL USING (true) WITH CHECK (true);
```

### 4. Run locally

```bash
npm run dev
```

---

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx            # Shared navbar with badges + active-link highlighting
│   ├── AIProviderSelect.jsx  # OpenAI / Gemini toggle
│   ├── DeveloperSearch.jsx   # Username search → /developer/:username
│   ├── PRInput.jsx           # URL input + validation
│   ├── ReviewReport.jsx      # Full review layout + confetti + fade-in
│   ├── SkeletonReview.jsx    # Animated skeleton placeholder while loading
│   ├── StatsBar.jsx          # Animated count-up stats strip
│   ├── Toast.jsx             # ToastProvider + useToast() hook
│   ├── ReviewCard.jsx        # Per-category card
│   ├── ScoreBar.jsx          # Animated score bar
│   ├── MergeVerdict.jsx      # Verdict badge
│   ├── CopyComments.jsx      # Copy-to-clipboard comments
│   ├── AutoSuggest.jsx       # AI fix suggestions with highlight.js
│   └── Dashboard.jsx         # History table with delete + share
├── pages/
│   ├── ReviewPage.jsx        # /review/:id — shareable review
│   ├── BatchReview.jsx       # /batch — multi-PR analysis
│   ├── DeveloperPage.jsx     # /developer/:username — profile + chart
│   ├── ComparePage.jsx       # /compare — side-by-side PR comparison
│   ├── ComparisonsPage.jsx   # /comparisons — saved comparisons list
│   └── ComparisonDetailPage.jsx  # /comparisons/:id — detail + share
├── contexts/
│   └── NavCounts.jsx         # Live badge counts context (reviews + comparisons)
├── services/
│   ├── github.js             # GitHub REST API
│   ├── gemini.js             # Gemini 2.0 Flash
│   ├── openai.js             # OpenAI GPT-4o mini
│   ├── batchReview.js        # Parallel batch analysis
│   └── supabase.js           # All DB operations + getStats()
├── utils/
│   └── parseGitHubURL.js
├── App.jsx
└── main.jsx
```

---

## Test Coverage (TestSprite)

| # | Feature | Test ID | Result |
|---|---------|---------|--------|
| 1 | PR Input Validation | `210caabd` | ✅ 7/7 |
| 2 | Dashboard + History | `053e8c00` | ✅ 6/6 |
| 3 | Full AI Review Flow | `070d3dfa` | ✅ PASS |
| 4 | Copy Comments | `f20e4ba7` | ✅ 14/14 |
| 5 | Loading State | `5dda9fb8` | ✅ PASS |
| 6 | Multi-Provider AI | `f158a268` | ✅ 19/19 |
| 7 | Shareable Review Page | `5ed09e9b` | ✅ 23/23 |
| 8 | Batch Review | `24362a21` | ✅ 15/15 |
| 9 | Auto-suggest Fix | `a2a0a890` | ✅ 7/7 |
| 10 | Developer Profile Page | `85b034ca` | ✅ PASS |
| 11 | PR Comparison | `0c29ae52` | ✅ 15/15 |
| 12 | Unified Navbar + Comparisons | `42beb976` | ✅ 20/20 |
| 13 | Delete + Detail + Share Link | `67475cd5` | ✅ 17/17 |
| 14 | Delete Bug Fix | `8c4acdd4` | ✅ 7/7 |
| 15 | Polish — Skeleton + Toast + Confetti + StatsBar | `163232ae` `52e098cf` `10f6b888` `acc0114b` | ✅ PASS 4/4 |
| 16 | Live Nav Badges (History + Comparisons) | `b4cd720d` `6952c9fd` | ✅ 13/13 |

Full loop log: [`LOOP.md`](./LOOP.md)

---

## Try it

```
# Single PR review (has security bugs → good for testing Auto-suggest)
https://github.com/OWASP/NodeGoat/pull/300

# Compare two PRs
https://github.com/vercel/next.js/pull/95370  vs  https://github.com/vercel/next.js/pull/95371

# Developer profile
https://ai-pr-reviewer-snowy.vercel.app/developer/torvalds

# Batch review (paste each on a new line)
https://github.com/OWASP/NodeGoat/pull/300
https://github.com/vercel/next.js/pull/1
```
