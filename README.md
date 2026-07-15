# TOEIC 900+ Error Log

A focused deliberate-practice app for turning wrong, guessed-right, and too-slow TOEIC questions into transferable rules.

## Setup

1. Create a brand-new Supabase project. Do not reuse the `cer-log` project.
2. Run `supabase/migrations/20260715000100_initial_toeic_error_log.sql` in that project's SQL editor.
3. Copy `.env.example` to `.env.local` and fill in the new project's URL and anon key.
4. Run `npm install` and `npm run dev`.

## Quality checks

```text
npm test
npm run typecheck
npm run lint
npm run build
```

## Product boundary

This is an error-analysis and active-recall system, not a question bank. Store only enough source context to reconstruct a useful mistake. It intentionally has no AI, OCR, bulk import, course content, or shared data with `cer-log`.
