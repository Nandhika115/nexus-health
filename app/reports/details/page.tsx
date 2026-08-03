"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Tone = "good" | "attn" | "alert";

interface FindingRow {
  id: string;
  category: string | null;
  name: string;
  value: string;
  unit: string | null;
  normal_range: string | null;
  tone: Tone;
  explanation: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  vitals: "Vitals",
  blood_sugar: "Blood Sugar",
  lipids: "Lipids",
  liver: "Liver",
  kidney: "Kidney",
  other: "Other",
};

const CATEGORY_ORDER = ["vitals", "blood_sugar", "lipids", "liver", "kidney", "other"];

const TONE_STYLES: Record<Tone, { badge: string; bar: string; dot: string; label: string }> = {
  good: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    label: "Normal",
  },
  attn: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    label: "Borderline",
  },
  alert: {
    badge: "bg-red-50 text-red-700 border-red-200",
    bar: "bg-red-500",
    dot: "bg-red-500",
    label: "Out of range",
  },
};

function firstNumber(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = s.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function parseRange(range: string | null | undefined): [number, number] | null {
  if (!range) return null;
  const m = range.match(/(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  return [parseFloat(m[1]), parseFloat(m[2])];
}

function buildScale(value: string, normalRange: string | null) {
  const current = firstNumber(value);
  const range = parseRange(normalRange);
  if (current === null || !range) return null;

  const [low, high] = range;
  const span = high - low || 1;
  const padding = span * 0.6;
  const min = Math.min(low - padding, current);
  const max = Math.max(high + padding, current);
  const total = max - min || 1;

  const pct = (n: number) => Math.min(100, Math.max(0, ((n - min) / total) * 100));

  return {
    currentPct: pct(current),
    lowPct: pct(low),
    highPct: pct(high),
  };
}

function ScaleBar({ value, normalRange, tone }: { value: string; normalRange: string | null; tone: Tone }) {
  if (value.includes("/") && normalRange?.includes("/")) {
    const [vSys, vDia] = value.split("/");
    const [rSys, rDia] = normalRange.split("/");
    return (
      <div className="mt-3 grid grid-cols-2 gap-3">
        <ScaleBar value={vSys.trim()} normalRange={rSys.trim()} tone={tone} />
        <ScaleBar value={vDia.trim()} normalRange={rDia.trim()} tone={tone} />
      </div>
    );
  }

  const scale = buildScale(value, normalRange);
  if (!scale) return null;

  const styles = TONE_STYLES[tone];

  return (
    <div className="mt-3">
      <div className="relative h-2 w-full rounded-full bg-slate-100">
        <div
          className="absolute h-2 rounded-full bg-slate-300/70"
          style={{ left: `${scale.lowPct}%`, width: `${Math.max(2, scale.highPct - scale.lowPct)}%` }}
        />
        <div
          className={`absolute -top-1 h-4 w-1.5 rounded-full ${styles.bar}`}
          style={{ left: `calc(${scale.currentPct}% - 3px)` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>Low</span>
        <span>Normal range</span>
        <span>High</span>
      </div>
    </div>
  );
}

export default function ReportDetailsPage() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const [report, setReport] = useState<any>(null);
  const [findings, setFindings] = useState<FindingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) return;

    async function load() {
      const { data: reportData } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

      const { data: findingsData } = await supabase
        .from("report_findings")
        .select("*")
        .eq("report_id", reportId);

      setReport(reportData);
      setFindings(findingsData || []);
      setLoading(false);
    }

    load();
  }, [reportId]);

  const grouped = useMemo(() => {
    const map = new Map<string, FindingRow[]>();
    for (const f of findings) {
      const key = f.category ?? "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({ category: c, findings: map.get(c)! }));
  }, [findings]);

  const alertCount = findings.filter((f) => f.tone === "alert").length;
  const attnCount = findings.filter((f) => f.tone === "attn").length;

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-3xl items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-slate-500">Report not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Full Report</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{report.file_name ?? "Medical Report"}</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {alertCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {alertCount} out of range
            </span>
          )}
          {attnCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {attnCount} borderline
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {findings.filter((f) => f.tone === "good").length} normal
          </span>
        </div>
      </header>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
        <h2 className="text-sm font-semibold text-slate-800">Summary</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{report.detailed_summary}</p>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-slate-800">Findings by category</h2>

        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.category}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {CATEGORY_LABELS[group.category] ?? group.category}
              </p>
              <div className="space-y-3">
                {group.findings.map((f) => {
                  const styles = TONE_STYLES[f.tone];
                  return (
                    <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{f.name}</p>
                          <p className="mt-0.5 font-mono text-sm text-slate-500">
                            {f.value}
                            {f.unit ? ` ${f.unit}` : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles.badge}`}
                        >
                          {styles.label}
                        </span>
                      </div>

                      {f.normal_range && (
                        <ScaleBar value={f.value} normalRange={f.normal_range} tone={f.tone} />
                      )}

                      <p className="mt-3 text-xs leading-relaxed text-slate-600">{f.explanation}</p>
                      {f.normal_range && (
                        <p className="mt-1 text-[11px] text-slate-400">Typical range: {f.normal_range}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 text-xs text-slate-400">
        This analysis is informational only and isn't a diagnosis. Please review the full report with your doctor.
      </p>
    </div>
  );
}