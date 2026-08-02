# Nexus Health

A privacy-first, multi-agent AI healthcare companion. This is a working Next.js
front end for the hackathon blueprint: a voice-first Nexus home screen,
patient dashboard, agent brain visualizer, medical report analyzer, health
memory timeline, doctor dashboard, and a privacy/consent center — wired up to
call GPT, Claude, or Gemini interchangeably.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # add your keys (see below)
npm run dev
```

Open http://localhost:3000

### 1. AI provider (at least one)

You don't need all three provider keys — pick whichever you have, and select
it from the model switcher on the `/assistant` screen. If a key is missing,
the assistant will tell you instead of failing silently.

### 2. Database (Supabase)

The app now has a real database and auth behind it. To set it up:

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run everything in `supabase/schema.sql` — it creates
   all tables, Row Level Security policies, and the `reports` storage
   bucket in one go.
3. Copy `Project Settings -> API -> Project URL / anon key / service_role
   key` into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Run the app, go to `/login`, sign up as a **patient** (or a **doctor**,
   for the `/doctor` screen) — this creates both a Supabase auth user and a
   matching row in `profiles`.
5. Everything else (vitals, timeline, reports, consent shares,
   appointments) starts empty for a new account — the app falls back to
   sample data on any screen with no rows yet, so it still looks populated
   for a demo. Insert real rows via the Supabase table editor, or wire up
   the "add vitals" / "book appointment" flows next.

If you skip this step entirely, the app still runs — every page falls back
to inline sample data, and sign-in/sign-up simply won't work (middleware
will keep redirecting to `/login` since there's no session to check).

## Screens

| Route         | Screen                                                        |
|---------------|----------------------------------------------------------------|
| `/`           | Nexus Home — the ambient "wow" entry screen               |
| `/dashboard`  | Patient dashboard — vitals, timeline preview, insights          |
| `/assistant`  | Voice + text AI assistant (speech-to-text, text-to-speech, model + language picker) |
| `/agents`     | Agent Brain — visualizes the 6 specialist agents                |
| `/reports`    | Medical Report Analyzer — upload + plain-language explanation   |
| `/timeline`   | Health Memory Timeline                                          |
| `/doctor`     | Doctor Dashboard — AI-generated patient summaries                |
| `/privacy`    | Privacy Center — consent-based data sharing, revoke access       |

## How the multi-agent + multi-model routing works

- `lib/agents.ts` defines six agents (Symptom, Report, Risk, Wellness, Doctor
  Assistant, Emergency), each with its own system prompt, plus a shared
  **safety layer** appended to every agent (no confirmed diagnoses, always
  recommend a professional, emergency guidance takes priority).
- `lib/providers.ts` has thin adapters for OpenAI (GPT), Anthropic (Claude),
  and Google (Gemini) — same request/response shape in, plain text out.
- `app/api/ai/route.ts` is the single endpoint the UI calls. It picks an
  agent (keyword-routed automatically, or pass `agent` explicitly), builds
  the system prompt, and calls whichever `provider` the UI selected.

This means swapping or adding a model is a one-file change (`lib/providers.ts`),
and swapping or tuning an agent's behavior is a one-file change (`lib/agents.ts`).

## Voice

Speech-to-text and text-to-speech use the browser's native Web Speech API
(`SpeechRecognition` / `speechSynthesis`) — no extra service or key required.
Chrome and Edge have the best support; Safari and Firefox support varies.
English, Tamil, and Hindi are wired up as language options on `/assistant`;
add more by extending the `LANGUAGES` array in `app/assistant/page.tsx`.

## Design system

- **Palette** — Medical Blue `#0F4C81` (trust/security) + Teal `#14B8A6`
  (health/wellness), on a soft `#F8FAFC` clinical background for data
  screens, and a deep navy `#0B1220` for the ambient AI-presence screens
  (home + assistant). Status colors: green `#22C55E` / orange `#F97316` /
  red `#EF4444`.
- **Type** — Space Grotesk (display/headings), Inter (body), JetBrains Mono
  (vitals, timestamps, and anything that reads like a data readout).
- **Signature element** — the "Nexus orb": a breathing gradient orb with
  expanding rings, used consistently as the AI-presence indicator, from a
  small nav avatar up to the full hero on `/` and `/assistant`. Its state
  (idle / listening / thinking / speaking) is driven by real app state, not
  decoration.
- **Layout logic** — clinical screens (dashboard, reports, timeline, doctor,
  privacy) are light, card-based, and calm, because they're where people read
  data. Nexus's own presence (home, assistant) is dark and ambient,
  because that's an open-ended conversation, not a data screen. The
  light/dark split is intentional, not a theme toggle.

Tune tokens in `tailwind.config.ts` (`colors`, `fontFamily`, `boxShadow`,
`keyframes`/`animation`).

## Project structure

```
app/
  page.tsx                # Nexus Home
  login/page.tsx           # Sign in / sign up (Supabase auth)
  auth/callback/route.ts    # Email confirmation redirect handler
  dashboard/page.tsx         # Server component, real Supabase queries
  assistant/page.tsx
  agents/page.tsx
  reports/page.tsx           # Client component, uploads to Supabase Storage
  timeline/page.tsx           # Server component, real Supabase queries
  doctor/page.tsx              # Server component, real Supabase queries
  privacy/page.tsx               # Server component + PrivacyClient
  api/ai/route.ts                 # multi-provider chat endpoint + persistence
components/
  Shell.tsx                 # sidebar (desktop) + bottom nav (mobile) + sign out
  AIOrb.tsx                  # signature breathing orb
  ui.tsx                      # Card, Pill, StatusDot, Eyebrow
  PrivacyClient.tsx             # interactive memory toggle / revoke-access
lib/
  agents.ts                    # agent prompts + safety layer + keyword router
  providers.ts                  # GPT / Claude / Gemini adapters
  data.ts                         # typed Supabase read helpers
  supabase/client.ts               # browser Supabase client
  supabase/server.ts                # server Supabase client (+ service role)
  types.ts
middleware.ts               # refreshes auth session, protects app routes
supabase/schema.sql          # tables + Row Level Security + storage bucket
```

## Notes for the demo

- Every page has a **sample-data fallback**: if a table has no rows yet
  (fresh account, or Supabase not configured at all), the screen shows the
  same realistic sample data it always did — so it still looks populated
  during a demo, and nothing breaks if a judge clicks around before you've
  seeded real data.
- The report upload on `/reports` really uploads to Supabase Storage and
  writes a `reports` row — the *analysis* itself is still simulated
  (`SIMULATED_FINDINGS`); swap that for a real OCR/parsing call when ready.
- Chat messages from `/assistant` are persisted to `conversations` /
  `messages` for signed-in users — best-effort, so a signed-out demo
  session still works, it just won't save history.
- Row Level Security is on for every table: patients only ever see their
  own rows; doctors only see a patient's data once that patient has an
  active, unexpired `consent_shares` row naming them. Revoking access in
  `/privacy` immediately cuts that off.
- This is a real backend now, but still not a claim of medical accuracy.
  Keep the safety layer in `lib/agents.ts` intact in any extension — it's
  what keeps every agent's output framed as guidance, not diagnosis.
