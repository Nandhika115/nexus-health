"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
}

export default function BookAppointmentClient({ patientId }: { patientId: string | null }) {
  const supabase = createClient();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [concern, setConcern] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDoctors() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, specialization")
        .eq("role", "doctor");
      if (error) {
        console.error("Failed to load doctors:", error);
      }
      setDoctors(data ?? []);
    }
    loadDoctors();
  }, []);

  async function handleBook() {
    if (!patientId || !doctorId || !concern.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: apptError } = await supabase.from("appointments").insert({
        patient_id: patientId,
        doctor_id: doctorId,
        scheduled_at: scheduledAt,
        concern,
        status: "scheduled",
      });
      if (apptError) throw apptError;

      const { error: consentError } = await supabase.from("consent_shares").insert({
        patient_id: patientId,
        doctor_id: doctorId,
        scope: "Full medical history",
        expires_at: expiresAt,
      });
      if (consentError) throw consentError;

      setDone(true);
      setConcern("");
      setDoctorId("");
    } catch (err: any) {
      setError(err.message ?? "Could not book appointment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!patientId) return null;

  return (
    <Card className="p-5">
      <Eyebrow>Book an appointment</Eyebrow>

      {done ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-teal-700">
          <Check className="h-4 w-4" /> Appointment booked. Your doctor can now see your records.
          <button
            onClick={() => setDone(false)}
            className="ml-auto text-xs font-medium text-ink-600 underline"
          >
            Book another
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-ink-400"
          >
            <option value="">Choose a doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
                {d.specialization ? " - " + d.specialization : ""}
              </option>
            ))}
          </select>
          <input
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            placeholder="What is this about?"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-ink-400"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={handleBook}
            disabled={submitting || !doctorId || !concern.trim()}
            className="flex items-center gap-1.5 rounded-full bg-ink-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            {submitting ? "Booking..." : "Book appointment"}
          </button>
          {doctors.length === 0 && (
            <p className="text-xs text-slate-400">
              No doctors available yet - sign up a doctor account first.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}