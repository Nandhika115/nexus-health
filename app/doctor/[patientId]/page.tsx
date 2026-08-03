import Link from "next/link";
import { ArrowLeft, HeartPulse, Moon, Footprints, ShieldOff } from "lucide-react";
import Shell from "@/components/Shell";
import { Card, Eyebrow, Pill, StatusDot } from "@/components/ui";
import { getPatientRecordForDoctor } from "@/lib/data";

export default async function PatientRecordPage({
  params,
}: {
  params: { patientId: string };
}) {
  const { profile, vitals, timeline, reports } = await getPatientRecordForDoctor(
    params.patientId
  );

  return (
    <Shell eyebrow="Clinician view" title={profile?.full_name ?? "Patient record"}>
      <Link
        href="/doctor"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to appointments
      </Link>

      {!profile && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <ShieldOff className="h-6 w-6 text-slate-400" />
          <p className="text-sm font-medium text-slate-700">
            No consented access to this patient
          </p>
          <p className="max-w-sm text-xs text-slate-500">
            This patient has not shared an active consent record with you, or it has
            expired or been revoked. Ask the patient to grant access from their
            Privacy Center.
          </p>
        </Card>
      )}

      {profile && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <Eyebrow>Latest vitals</Eyebrow>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-100 bg-canvas-card/60 p-4">
                <HeartPulse className="h-4 w-4 text-ink-600" />
                <p className="mt-3 font-data text-xl text-slate-900">
                  {vitals?.heart_rate_bpm ?? "-"}
                  <span className="ml-1 text-xs text-slate-400">bpm</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">Heart rate</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-canvas-card/60 p-4">
                <Moon className="h-4 w-4 text-ink-600" />
                <p className="mt-3 font-data text-xl text-slate-900">
                  {vitals?.sleep_hours ?? "-"}
                  <span className="ml-1 text-xs text-slate-400">hrs</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">Sleep</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-canvas-card/60 p-4">
                <Footprints className="h-4 w-4 text-ink-600" />
                <p className="mt-3 font-data text-xl text-slate-900">
                  {vitals?.steps ?? "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500">Steps</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <Eyebrow>Patient</Eyebrow>
            <p className="mt-2 font-display text-base font-semibold text-slate-800">
              {profile.full_name}
            </p>
            <p className="text-xs text-slate-400">Patient record</p>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <Eyebrow>Recent timeline</Eyebrow>
            {timeline.length === 0 && (
              <p className="mt-3 text-sm text-slate-400">No timeline events yet.</p>
            )}
            <ul className="mt-4 space-y-4">
              {timeline.map((t: any) => (
                <li key={t.id} className="flex items-start gap-3">
                  <StatusDot tone={t.tone} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.title}</p>
                    {t.detail && <p className="text-xs text-slate-500">{t.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <Eyebrow>Reports</Eyebrow>
            {reports.length === 0 && (
              <p className="mt-3 text-sm text-slate-400">No reports uploaded yet.</p>
            )}
            <div className="mt-3 space-y-3">
              {reports.map((r: any) => (
                <div key={r.id} className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs font-semibold text-slate-700">{r.file_name}</p>
                  <p className="mb-2 text-[11px] text-slate-400">{r.status}</p>
                  {(r.report_findings ?? []).map((f: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{f.name}</span>
                      <Pill tone={f.tone}>{f.value}</Pill>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </Shell>
  );
}