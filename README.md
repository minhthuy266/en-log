# Signal Log

A private feedback-loop app for turning wrong, uncertain, and too-slow decisions into transferable rules.

## Setup

1. Create a brand-new Supabase project.
2. Run `supabase/migrations/20260715000100_initial_signal_log.sql` in that project's SQL editor.
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

This is an error-analysis and active-recall system, not a content warehouse. Store only enough source context to reconstruct a useful miss. Structured text is parsed locally; the app does not call an AI service or send import text anywhere.
