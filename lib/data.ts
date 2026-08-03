import { createClient } from "@/lib/supabase/server";

export type Tone = "good" | "attn" | "alert";

export interface Profile {
  id: string;
  full_name: string;
  role: "patient" | "doctor";
  memory_enabled: boolean;
}

export interface Vitals {
  heart_rate_bpm: number | null;
  sleep_hours: number | null;
  steps: number | null;
}

export interface TimelineEvent {
  id: string;
  title: string;
  detail: string | null;
  tone: Tone;
  occurred_at: string;
}

/** Returns the signed-in user's profile, or null if not signed in / no row yet. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, memory_enabled")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}

export async function getLatestVitals(patientId: string): Promise<Vitals | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vitals")
    .select("heart_rate_bpm, sleep_hours, steps")
    .eq("patient_id", patientId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getTimeline(patientId: string, limit = 20): Promise<TimelineEvent[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("timeline_events")
    .select("id, title, detail, tone, occurred_at")
    .eq("patient_id", patientId)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  return (data as TimelineEvent[]) ?? [];
}

export async function getConsentShares(patientId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("consent_shares")
    .select("id, scope, expires_at, doctor:profiles!consent_shares_doctor_id_fkey(full_name)")
    .eq("patient_id", patientId)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });
  return data ?? [];
}

export async function getDoctorAppointments(doctorId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, concern, status, patient:profiles!appointments_patient_id_fkey(id, full_name)"
    )
    .eq("doctor_id", doctorId)
    .order("scheduled_at", { ascending: true });
  return data ?? [];
}

/**
 * Fetches one patient's record for a doctor to view. Relies entirely on
 * Row Level Security: if the doctor has no active consent_shares row for
 * this patient, every one of these queries returns nothing (not an error) -
 * the page renders an "access not granted" state instead.
 */
export async function getPatientRecordForDoctor(patientId: string) {
  const supabase = createClient();

  const [{ data: profile }, { data: vitals }, { data: timeline }, { data: reports }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", patientId)
        .maybeSingle(),
      supabase
        .from("vitals")
        .select("heart_rate_bpm, sleep_hours, steps, recorded_at")
        .eq("patient_id", patientId)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("timeline_events")
        .select("id, title, detail, tone, occurred_at")
        .eq("patient_id", patientId)
        .order("occurred_at", { ascending: false })
        .limit(10),
      supabase
        .from("reports")
        .select("id, file_name, status, uploaded_at, report_findings(name, value, tone, explanation)")
        .eq("patient_id", patientId)
        .order("uploaded_at", { ascending: false }),
    ]);

  return {
    profile: profile ?? null,
    vitals: vitals ?? null,
    timeline: timeline ?? [],
    reports: reports ?? [],
  };
}
export async function getPatientAppointments(patientId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_at, concern, status, doctor:profiles!appointments_doctor_id_fkey(full_name)"
    )
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: true });
  return data ?? [];
}