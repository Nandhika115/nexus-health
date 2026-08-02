import { Calendar, FolderOpen } from "lucide-react";
import Shell from "@/components/Shell";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { getProfile, getDoctorAppointments } from "@/lib/data";

const FALLBACK_PATIENTS = [
  { id: "1", scheduled_at: "10:30 AM", concern: "Fatigue, low energy", patient: { full_name: "Rahul Menon" } },
  { id: "2", scheduled_at: "11:15 AM", concern: "Recurring headaches", patient: { full_name: "Anitha Suresh" } },
];

export default async function DoctorPage() {
  const profile = await getProfile();
  const rows =
    profile?.role === "doctor" ? await getDoctorAppointments(profile.id) : [];
  const appointments = rows.length > 0 ? rows : FALLBACK_PATIENTS;

  return (
    <Shell eyebrow="Clinician view" title="Doctor Dashboard">
      <div className="mb-5 flex items-center gap-2 text-sm text-slate-500">
        <Calendar className="h-4 w-4" /> Today's appointments
      </div>

      {profile && profile.role !== "doctor" && (
        <p className="mb-4 text-xs text-slate-400">
          Showing sample data — sign in with a doctor account to see your own appointments.
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {appointments.map((p: any) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-base font-semibold text-slate-800">
                  {p.patient?.full_name ?? "Patient"}
                </p>
                <p className="font-data text-[11px] text-slate-400">
                  {typeof p.scheduled_at === "string" && p.scheduled_at.includes("T")
                    ? new Date(p.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : p.scheduled_at}
                </p>
              </div>
              <Pill tone="idle">
                <FolderOpen className="h-3 w-3" /> reports
              </Pill>
            </div>

            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <div>
                <Eyebrow>AI summary — main concern</Eyebrow>
                <p className="mt-1 text-sm text-slate-700">{p.concern}</p>
              </div>
            </div>

            <button className="mt-5 w-full rounded-full bg-ink-600 py-2.5 text-xs font-semibold text-white">
              Open patient record
            </button>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
