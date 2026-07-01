# 🔍 AI PR Reviewer

An AI-powered GitHub Pull Request reviewer built with React, OpenAI GPT-4o / Gemini Flash, and Supabase.

**Live URL:** https://ai-pr-reviewer-snowy.vercel.app

---

## What it does

Paste any GitHub PR URL and get an instant AI code review including:

- **Shareable Review Links** — every review gets its own URL (`/review/:id`) you can share with teammates
- **AI Provider Choice** — switch between OpenAI GPT-4o and Gemini Flash before each review
- **Quality Score** (0–100) with animated progress bar
- **Merge Verdict** — APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION
- **2–3 sentence summary** of the PR
- **5 review categories** — Bugs, Security, Performance, Clarity, Positives
- **Ready-to-paste GitHub comments** with one-click copy
- **Review history** stored in Supabase with the AI provider used, filterable by provider

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| AI (option 1) | OpenAI GPT-4o mini |
| AI (option 2) | Google Gemini 2.0 Flash |
| Data | GitHub REST API v3 |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |
| Testing | TestSprite |

---

## Local Setup

### 1. Clone & install

```bash
git clone https://github.com/Awad-de/AI-PR-Reviewer.git
cd AI-PR-Reviewer
npm install
```

### 2. Configure environment variables

Create a `.env` file and fill in your keys:

```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GITHUB_TOKEN=your_github_token_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

| Variable | Where to get it |
|---|---|
| `VITE_OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `VITE_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `VITE_GITHUB_TOKEN` | [GitHub Settings → Tokens](https://github.com/settings/tokens) — `repo` scope |
| `VITE_SUPABASE_URL` | Supabase project → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase project → Settings → API |

### 3. Create Supabase table

Run this SQL in your Supabase SQL editor:

```sql
create table reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  pr_url text,
  pr_title text,
  pr_author text,
  repo_name text,
  score integer,
  verdict text,
  summary text,
  bugs text[],
  security_issues text[],
  performance_issues text[],
  clarity_issues text[],
  positives text[],
  copy_comments text[],
  ai_provider text default 'openai'
);
```

> **Note:** If you already have the table without `ai_provider`, run:
> ```sql
> ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ai_provider text DEFAULT 'openai';
> ```

### 4. Run locally

```bash
npm run dev
```

---

## Deploy to Vercel

```bash
vercel --prod
```

Set all 5 environment variables in your Vercel project dashboard under **Settings → Environment Variables**.

---

## Project Structure

```
src/
├── components/
│   ├── AIProviderSelect.jsx  # OpenAI / Gemini toggle
│   ├── PRInput.jsx           # URL input + validation
│   ├── ReviewReport.jsx      # Full review layout + provider badge
│   ├── ReviewCard.jsx        # Per-category card (bugs, security…)
│   ├── ScoreBar.jsx          # Animated score progress bar
│   ├── MergeVerdict.jsx      # Verdict badge
│   ├── CopyComments.jsx      # Copy-to-clipboard comments
│   └── Dashboard.jsx         # History table + AI Used column + filter
├── services/
│   ├── github.js             # GitHub REST API
│   ├── gemini.js             # Gemini 2.0 Flash
│   ├── openai.js             # OpenAI GPT-4o mini
│   └── supabase.js           # Supabase read/write
├── utils/
│   └── parseGitHubURL.js     # URL parser
├── App.jsx
└── main.jsx
```

---

## Try it with a real PR

```
https://github.com/vercel/next.js/pull/1
```

---

## Test Coverage (TestSprite)

| # | Feature | Status |
|---|---|---|
| 1 | PR Input Validation | ✅ PASS |
| 2 | Dashboard + History | ✅ PASS |
| 3 | Full AI Review Flow | ✅ PASS |
| 4 | Copy Comments | ✅ PASS |
| 5 | Loading State | ✅ PASS |
| 6 | Multi-Provider AI Selection | ✅ PASS |
| 7 | Shareable Review Page (/review/:id) | ✅ PASS |
