import { Card, Eyebrow } from "@/components/ui";
import { Check, TriangleAlert } from "lucide-react";

interface HealthMetric {
  label: string;
  ok: boolean;
}

const METRICS: HealthMetric[] = [
  { label: "Hydration", ok: true },
  { label: "Sleep", ok: false },
  { label: "Exercise", ok: true },
];

const SCORE = 82;

export default function HealthScoreCard() {
  return (
    <Card className="p-5">
      <Eyebrow>Health Score</Eyebrow>
      <div className="mt-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
        <p className="font-data text-2xl font-semibold text-slate-900">
          {SCORE} <span className="text-sm font-normal text-slate-400">/ 100</span>
        </p>
      </div>
      <div className="mt-4 space-y-2">
        {METRICS.map((m) => (
          <div key={m.label} className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{m.label}</span>
            {m.ok ? (
              <Check className="h-4 w-4 text-teal-600" />
            ) : (
              <TriangleAlert className="h-4 w-4 text-amber-500" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}