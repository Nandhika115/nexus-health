"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Shell from "@/components/Shell";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";

type Tone = "good" | "attn" | "alert";

interface Finding {
  id: string;
  name: string;
  value: string;
  tone: Tone;
  explanation: string;
}

const TONE_ORDER: Tone[] = ["alert", "attn", "good"];

const TONE_META: Record<Tone, { label: string; icon: any; className: string }> = {
  alert: { label: "Needs attention", icon: CircleAlert, className: "text-red-600" },
  attn: { label: "Worth monitoring", icon: TriangleAlert, className: "text-amber-500" },
  good: { label: "Normal range", icon: CircleCheck, className: "text-teal-600" },
};

function ReportDetailsContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const [report, setReport] = useState<any>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setError("No report ID provided in the URL.");
      setLoading(false);
      return;
    }

    async function load() {
      const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (reportError) {
        setError(reportError.message);
        setLoading(false);
        return;
      }

      const { data: findingsData, error: findingsError } = await supabase
        .from("report_findings")
        .select("*")
        .eq("report_id", reportId);

      if (findingsError) {
        setError(findingsError.message);
        setLoading(false);
        return;
      }

      setReport(reportData);
      setFindings(findingsData || []);
      setLoading(false);
    }

    load();
  }, [reportId]);

  if (loading) {
    return (
      <Shell eyebrow="Report Agent" title="Full Report">
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-ink-600" />
          <p className="font-data text-xs text-slate-500">Loading report…</p>
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell eyebrow="Report Agent" title="Full Report">
        <Card className="p-6 text-sm text-red-600">Error loading report: {error}</Card>
      </Shell>
    );
  }

  if (!report) {
    return (
      <Shell eyebrow="Report Agent" title="Full Report">
        <Card className="p-6 text-sm text-slate-500">Report not found.</Card>
      </Shell>
    );
  }

  const alertCount = findings.filter((f) => f.tone === "alert").length;
  const attnCount = findings.filter((f) => f.tone === "attn").length;
  const goodCount = findings.filter((f) => f.tone === "good").length;

  return (
    <Shell eyebrow="Report Agent" title="Full Report">
      <div className="grid gap-5">
        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>AI Summary</Eyebrow>
            <div className="flex gap-2">
              {alertCount > 0 && <Pill tone="attn">{alertCount} needs attention</Pill>}
              {attnCount > 0 && <Pill tone="attn">{attnCount} to monitor</Pill>}
              {goodCount > 0 && <Pill tone="good">{goodCount} normal</Pill>}
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{report.detailed_summary}</p>
        </Card>

        {TONE_ORDER.filter((tone) => findings.some((f) => f.tone === tone)).map((tone) => {
          const meta = TONE_META[tone];
          const group = findings.filter((f) => f.tone === tone);

          return (
            <Card key={tone} className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <meta.icon className={"h-4 w-4 " + meta.className} />
                <Eyebrow>{meta.label}</Eyebrow>
              </div>
              <div className="space-y-3">
                {group.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-slate-100 bg-canvas-card/50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{f.name}</p>
                      <Pill tone={f.tone === "good" ? "good" : "attn"}>{f.value}</Pill>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </Shell>
  );
}

export default function ReportDetailsPage() {
  return (
    <Suspense
      fallback={
        <Shell eyebrow="Report Agent" title="Full Report">
          <p className="text-sm text-slate-400">Loading report…</p>
        </Shell>
      }
    >
      <ReportDetailsContent />
    </Suspense>
  );
}