-- ============================================================
-- Nexus Health — database schema (run in Supabase SQL editor)
-- ============================================================
-- Auth is handled by Supabase's built-in auth.users table.
-- Everything below hangs off auth.users.id via `profiles`.

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create type user_role as enum ('patient', 'doctor');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'patient',
  specialization text,               -- doctors only
  memory_enabled boolean not null default true,  -- AI memory toggle (Privacy Center)
  created_at timestamptz not null default now()
);

-- ---------- vitals ----------
create table if not exists vitals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  heart_rate_bpm int,
  sleep_hours numeric(4,1),
  steps int,
  recorded_at timestamptz not null default now()
);

-- ---------- timeline events ----------
create type event_tone as enum ('good', 'attn', 'alert');

create table if not exists timeline_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  detail text,
  tone event_tone not null default 'good',
  occurred_at timestamptz not null default now()
);

-- ---------- reports (uploaded files + AI analysis) ----------
create type report_status as enum ('uploaded', 'analyzing', 'analyzed');

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  file_path text not null,          -- path inside the `reports` storage bucket
  file_name text not null,
  status report_status not null default 'uploaded',
  uploaded_at timestamptz not null default now()
);

create table if not exists report_findings (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  name text not null,               -- e.g. "Vitamin D"
  value text not null,               -- e.g. "15 ng/ml"
  tone event_tone not null default 'good',
  explanation text
);

-- ---------- doctor appointments ----------
create type appointment_status as enum ('scheduled', 'completed', 'cancelled');

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  doctor_id uuid not null references profiles(id) on delete cascade,
  scheduled_at timestamptz not null,
  concern text,
  status appointment_status not null default 'scheduled'
);

-- ---------- consent-based data sharing ----------
create table if not exists consent_shares (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  doctor_id uuid not null references profiles(id) on delete cascade,
  scope text not null,               -- e.g. "Blood report", "Full medical history"
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

-- ---------- AI Guardian conversations ----------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  provider text not null,            -- 'gpt' | 'claude' | 'gemini'
  started_at timestamptz not null default now()
);

create type message_role as enum ('user', 'assistant');

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role message_role not null,
  content text not null,
  agent_id text,                     -- e.g. 'symptom', 'report', 'risk'...
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table vitals enable row level security;
alter table timeline_events enable row level security;
alter table reports enable row level security;
alter table report_findings enable row level security;
alter table appointments enable row level security;
alter table consent_shares enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- profiles: everyone can read their own profile; doctors can read patients
-- who've shared an active consent record with them.
create policy "read own profile" on profiles
  for select using (id = auth.uid());

create policy "update own profile" on profiles
  for update using (id = auth.uid());

create policy "insert own profile" on profiles
  for insert with check (id = auth.uid());

create policy "doctors read consenting patients' profiles" on profiles
  for select using (
    exists (
      select 1 from consent_shares cs
      where cs.patient_id = profiles.id
        and cs.doctor_id = auth.uid()
        and cs.revoked_at is null
        and cs.expires_at > now()
    )
  );

-- generic helper pattern applied to each patient-owned table:
-- patients manage their own rows; doctors may read rows for patients who
-- have an active, unexpired, unrevoked consent share with them.

create policy "patients manage own vitals" on vitals
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy "doctors read consented vitals" on vitals
  for select using (
    exists (select 1 from consent_shares cs where cs.patient_id = vitals.patient_id
      and cs.doctor_id = auth.uid() and cs.revoked_at is null and cs.expires_at > now())
  );

create policy "patients manage own timeline" on timeline_events
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy "doctors read consented timeline" on timeline_events
  for select using (
    exists (select 1 from consent_shares cs where cs.patient_id = timeline_events.patient_id
      and cs.doctor_id = auth.uid() and cs.revoked_at is null and cs.expires_at > now())
  );

create policy "patients manage own reports" on reports
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy "doctors read consented reports" on reports
  for select using (
    exists (select 1 from consent_shares cs where cs.patient_id = reports.patient_id
      and cs.doctor_id = auth.uid() and cs.revoked_at is null and cs.expires_at > now())
  );

create policy "patients manage own findings" on report_findings
  for all using (
    exists (select 1 from reports r where r.id = report_findings.report_id and r.patient_id = auth.uid())
  ) with check (
    exists (select 1 from reports r where r.id = report_findings.report_id and r.patient_id = auth.uid())
  );
create policy "doctors read consented findings" on report_findings
  for select using (
    exists (
      select 1 from reports r
      join consent_shares cs on cs.patient_id = r.patient_id
      where r.id = report_findings.report_id
        and cs.doctor_id = auth.uid() and cs.revoked_at is null and cs.expires_at > now()
    )
  );

create policy "patients manage own appointments" on appointments
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy "doctors read + update their appointments" on appointments
  for select using (doctor_id = auth.uid());
create policy "doctors update their appointments" on appointments
  for update using (doctor_id = auth.uid());

create policy "patients manage own consent shares" on consent_shares
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy "doctors read shares granted to them" on consent_shares
  for select using (doctor_id = auth.uid());

create policy "patients manage own conversations" on conversations
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());

create policy "patients manage own messages" on messages
  for all using (
    exists (select 1 from conversations c where c.id = messages.conversation_id and c.patient_id = auth.uid())
  ) with check (
    exists (select 1 from conversations c where c.id = messages.conversation_id and c.patient_id = auth.uid())
  );

-- ============================================================
-- Storage bucket for uploaded reports (create via SQL or Dashboard)
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('reports', 'reports', false)
  on conflict (id) do nothing;

create policy "patients read own report files" on storage.objects
  for select using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "patients upload own report files" on storage.objects
  for insert with check (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "patients delete own report files" on storage.objects
  for delete using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);
