import Link from "next/link";
import { HeartPulse, Moon, Footprints, Mic, ArrowUpRight, TrendingUp, Scale } from "lucide-react";
import Shell from "@/components/Shell";
import { Card, Eyebrow, Pill, StatusDot } from "@/components/ui";
import { getProfile, getLatestVitals, getTimeline, getPatientAppointments, Tone } from "@/lib/data";
import BookAppointmentClient from "@/components/BookAppointmentClient";
import DailyHealthTips from "@/components/DailyHealthTips";
import HealthScoreCard from "@/components/HealthScoreCard";

const FALLBACK_TIMELINE = [
  { id: "1", title: "Blood report analyzed", detail: null, tone: "good" as Tone, occurred_at: new Date().toISOString() },
  { id: "2", title: "Appointment booked with Dr. Priya", detail: null, tone: "good" as Tone, occurred_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", title: "Follow-up needed - Vitamin D", detail: null, tone: "attn" as Tone, occurred_at: new Date(Date.now() - 3 * 86400000).toISOString() },
];

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return days + " days ago";
}

export default async function DashboardPage() {
  const profile = await getProfile();
  const vitals = profile ? await getLatestVitals(profile.id) : null;
  const timelineRows = profile ? await getTimeline(profile.id, 3) : [];
  const timeline = timelineRows.length > 0 ? timelineRows : FALLBACK_TIMELINE;
  const appointments = profile?.role === "patient" ? await getPatientAppointments(profile.id) : [];
  const VITALS = [
    { label: "Heart rate", value: vitals?.heart_rate_bpm ?? 78, unit: "bpm", icon: HeartPulse },
    { label: "Sleep", value: vitals?.sleep_hours ?? 7.2, unit: "hrs", icon: Moon },
    { label: "Activity", value: (vitals?.steps ?? 6500).toLocaleString(), unit: "steps", icon: Footprints },
  ];

  return (
    <Shell eyebrow="Good morning" title={(profile?.full_name ?? "there") + " :)"}>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <Eyebrow>Health overview</Eyebrow>
            <Pill tone="good">
              <StatusDot tone="good" /> Stable
            </Pill>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {VITALS.map((v) => (
              <div
                key={v.label}
                className="rounded-xl border border-slate-100 bg-canvas-card/60 p-4"
              >
                <v.icon className="h-4 w-4 text-ink-600" strokeWidth={2.2} />
                <p className="mt-3 font-data text-xl text-slate-900 md:text-2xl">
                  {v.value}
                  <span className="ml-1 text-xs text-slate-400">{v.unit}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">{v.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-ink-700 to-navy p-6 text-center text-white">
          <div className="absolute -top-10 right-0 h-40 w-40 rounded-full bg-teal-400/20 blur-3xl" />
          <Mic className="h-6 w-6 text-teal-300" />
          <p className="mt-3 font-display text-lg font-semibold">Talk to Nexus</p>
          <p className="mt-1 text-xs text-slate-300">How can I help you today?</p>
          <Link
            href="/assistant"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-navy"
          >
            Start conversation <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <Eyebrow>Recent health timeline</Eyebrow>
          <ul className="mt-4 space-y-4">
            {timeline.map((t) => (
              <li key={t.id} className="flex items-start gap-3">
                <StatusDot tone={t.tone} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.title}</p>
                  <p className="font-data text-[11px] text-slate-400">{relativeTime(t.occurred_at)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/timeline"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-ink-600 hover:underline"
          >
            View full timeline <ArrowUpRight className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="p-5">
          <Eyebrow>Health insight</Eyebrow>
          <div className="mt-4 flex items-start gap-3">
            <TrendingUp className="mt-0.5 h-4 w-4 text-teal-600" />
            <p className="text-sm leading-relaxed text-slate-700">
              Your sleep improved <span className="font-medium text-teal-700">15%</span> this
              week. Keep your current wind-down routine going.
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Link
          href="/bmi"
          className="rounded-xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-ink-600" />
            <p className="text-sm font-semibold text-slate-800">BMI Calculator</p>
          </div>
          <p className="mt-1 text-xs text-slate-400">Check your body mass index</p>
        </Link>

        <HealthScoreCard />

        <DailyHealthTips />
      </div>

      {profile?.role === "patient" && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <Eyebrow>Your upcoming appointments</Eyebrow>
            {appointments.length === 0 && (
              <p className="mt-3 text-sm text-slate-400">No appointments booked yet.</p>
            )}
            <div className="mt-3 space-y-3">
              {appointments.map((a: any) => (
                <div key={a.id} className="rounded-lg border border-slate-100 p-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {a.doctor?.full_name ?? "Doctor"}
                  </p>
                  <p className="text-xs text-slate-500">{a.concern}</p>
                  <p className="mt-1 font-data text-[11px] text-slate-400">
                    {new Date(a.scheduled_at).toLocaleString()} - {a.status}
                  </p>
                </div>
              ))}
            </div>
          </Card>
          <BookAppointmentClient patientId={profile.id} />
        </div>
      )}
    </Shell>
  );
}