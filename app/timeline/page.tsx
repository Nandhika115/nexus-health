import Shell from "@/components/Shell";
import { Card, StatusDot } from "@/components/ui";
import { getProfile, getTimeline, Tone } from "@/lib/data";

const FALLBACK_EVENTS = [
  { id: "1", title: "Blood report uploaded", detail: "Vitamin D flagged as low.", tone: "attn" as Tone, occurred_at: "2026-08-01" },
  { id: "2", title: "Fever symptoms reported", detail: "Resolved within 3 days, self-care guidance followed.", tone: "good" as Tone, occurred_at: "2026-07-20" },
  { id: "3", title: "Doctor consultation", detail: "Dr. Priya · general check-up, no concerns raised.", tone: "good" as Tone, occurred_at: "2026-06-10" },
  { id: "4", title: "Annual wellness scan", detail: "All vitals within healthy range.", tone: "good" as Tone, occurred_at: "2026-04-02" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default async function TimelinePage() {
  const profile = await getProfile();
  const rows = profile ? await getTimeline(profile.id, 50) : [];
  const events = rows.length > 0 ? rows : FALLBACK_EVENTS;

  return (
    <Shell eyebrow="Health memory" title="Your Timeline">
      <Card className="p-6">
        <ol className="relative space-y-8 border-l border-slate-200 pl-6">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[29px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white ring-2 ring-slate-200">
                <StatusDot tone={e.tone} />
              </span>
              <p className="font-data text-[11px] uppercase tracking-wider text-slate-400">
                {formatDate(e.occurred_at)}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{e.title}</p>
              {e.detail && <p className="mt-0.5 text-xs text-slate-500">{e.detail}</p>}
            </li>
          ))}
        </ol>
      </Card>
    </Shell>
  );
}
