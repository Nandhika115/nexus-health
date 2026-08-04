# Nexus Health

A privacy-first, multi-agent AI healthcare app. Patients get an AI-powered health assistant, real medical report analysis, and easy booking with doctors — all backed by row-level-secured data so nothing is visible without explicit consent.

# Nexus Health

**Live demo:** [nexus-health-bq7vdfob1-navi19.vercel.app](https://nexus-health-bq7vdfob1-navi19.vercel.app/)

A privacy-first, multi-agent AI healthcare app. Patients get an AI-powered health assistant, real medical report analysis, and easy booking with doctors — all backed by row-level-secured data so nothing is visible without explicit consent.

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database & Auth:** Supabase (Postgres, Auth, Storage) with Row Level Security throughout
- **AI Providers:** Claude, GPT, Gemini, Groq (Groq added as a free-tier fallback)
- **Deployment:** Vercel

## Features

### AI Voice Assistant
Real speech-to-text / text-to-speech conversation with a model + language switcher. Chat history is persisted to the database.

### Agent Brain
Six specialist agents — Symptom, Report, Risk, Wellness, Emergency, and Doctor — each individually selectable, with voice input and a shared safety layer sitting behind every response.

### Medical Report Analyzer
Upload a lab report, scan, or prescription (PDF/JPG/PNG). Claude reads the document directly and returns:
- A short list of key findings (name, value, and whether it's normal, worth monitoring, or needs attention)
- A longer, plain-language summary explaining what the results mean and what to ask a doctor

The full report view groups findings by severity so the most important results are seen first.

### BMI Calculator
Enter height and weight to get an instant BMI score and category (Underweight / Normal / Overweight / Obese), with the reference table shown alongside.

### Health Score Card
An at-a-glance card summarizing hydration, sleep, and exercise status alongside an overall score.

### Daily Health Tips
A rotating, randomly-selected wellness tip shown on the dashboard each visit.

### Booking & Consent
Patients book appointments with doctors; booking automatically grants that doctor consent to view the patient's records. Patients can revoke consent at any time from the Privacy Center.

### Doctor Dashboard
Doctors see their real upcoming appointments (role-gated via middleware — patients cannot access `/doctor` at all) and can open a patient's record, which respects consent through RLS.

### Health Risk & Health Plan
- **Health Risk:** a form feeds into an AI risk assessment, which is logged to the patient's timeline.
- **Health Plan:** a form generates a personalized diet / exercise / sleep / stress plan via AI, persisted to its own table and reloaded automatically on return visits.

### Privacy Center
Patients can toggle AI memory on/off and revoke doctor consent — both actions write directly to the database.

## Database Schema (Supabase / Postgres)

All tables use Row Level Security.

| Table | Purpose |
|---|---|
| `profiles` | User accounts with patient/doctor role |
| `vitals` | Latest vitals (heart rate, sleep, steps) |
| `timeline_events` | Chronological health events log |
| `reports` | Uploaded medical reports + AI-generated summary |
| `report_findings` | Individual findings extracted from a report |
| `appointments` | Bookings between patients and doctors |
| `consent_shares` | Patient consent grants for doctor record access |
| `conversations` / `messages` | AI Assistant chat history |
| `health_plans` | Saved AI-generated wellness plans |

## Auth & Access Control

Email/password authentication via Supabase Auth, with `patient` and `doctor` roles. Role-based access is enforced in Next.js middleware — patients cannot reach `/doctor` routes at all, and doctors only see patient data they have active consent for.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
```

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Known Gaps / Next Steps

- No UI yet for a doctor to edit or cancel appointments
- No admin UI for account management
- A few duplicate test doctor accounts should be cleaned up before demoing