"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileCheck2, CircleAlert } from "lucide-react";
import Shell from "@/components/Shell";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type Tone = "good" | "attn";

interface Finding {
  name: string;
  value: string;
  tone: Tone;
  explanation: string;
}

// Placeholder analysis until a real OCR/parsing pipeline is wired in —
// swap this for a call to /api/ai (report agent) or an OCR service.
const SIMULATED_FINDINGS: Finding[] = [
  { name: "Vitamin D", value: "15 ng/ml", tone: "attn", explanation: "Your level appears lower than the typical range. Low vitamin D is common and usually manageable — worth discussing with your doctor about supplementation." },
  { name: "Hemoglobin", value: "13.8 g/dl", tone: "good", explanation: "Within the typical healthy range for your profile." },
  { name: "Fasting glucose", value: "98 mg/dl", tone: "good", explanation: "Within the typical healthy range." },
];

export default function ReportsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploaded(true);
    setAnalyzing(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      try {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("reports")
          .upload(path, file);
        if (uploadError) throw uploadError;

        const { data: report, error: insertError } = await supabase
          .from("reports")
          .insert({ patient_id: user.id, file_path: path, file_name: file.name, status: "analyzing" })
          .select()
          .single();
        if (insertError) throw insertError;

        // Simulate AI analysis, then persist findings + flip status.
        setTimeout(async () => {
          await supabase.from("report_findings").insert(
            SIMULATED_FINDINGS.map((f) => ({ report_id: report.id, ...f }))
          );
          await supabase.from("reports").update({ status: "analyzed" }).eq("id", report.id);
          setFindings(SIMULATED_FINDINGS);
          setAnalyzing(false);
        }, 1400);
      } catch (err: any) {
        setError(err.message ?? "Upload failed. Check your Supabase storage bucket/policies.");
        setFindings(SIMULATED_FINDINGS);
        setAnalyzing(false);
      }
    } else {
      // Not signed in / Supabase not configured — just demo the UI.
      setTimeout(() => {
        setFindings(SIMULATED_FINDINGS);
        setAnalyzing(false);
      }, 1400);
    }
  }

  return (
    <Shell eyebrow="Report Agent" title="Medical Report Analyzer">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-600/10 text-ink-700 transition-transform hover:scale-105"
          >
            <UploadCloud className="h-6 w-6" />
          </button>
          <p className="mt-2 text-sm font-medium text-slate-700">Upload medical report</p>
          <p className="text-xs text-slate-400">PDF, JPG or PNG · lab reports, scans, prescriptions</p>
          {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
        </Card>

        <Card className="p-6">
          {!uploaded && (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-sm text-slate-400">
              Upload a report to see the AI-generated explanation here.
            </div>
          )}

          {uploaded && analyzing && (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-ink-600" />
              <p className="font-data text-xs text-slate-500">Report Agent analyzing document…</p>
            </div>
          )}

          {uploaded && !analyzing && (
            <div>
              <div className="mb-5 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-teal-600" />
                <p className="text-sm font-medium text-teal-700">Analysis complete</p>
              </div>
              <Eyebrow>Important findings</Eyebrow>
              <div className="mt-3 space-y-3">
                {findings.map((f) => (
                  <div key={f.name} className="rounded-xl border border-slate-100 bg-canvas-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{f.name}</p>
                      <Pill tone={f.tone}>
                        {f.tone === "attn" && <CircleAlert className="h-3 w-3" />} {f.value}
                      </Pill>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">{f.explanation}</p>
                  </div>
                ))}
              </div>
              <button className="mt-5 rounded-full bg-ink-600 px-4 py-2 text-xs font-semibold text-white">
                View full report
              </button>
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}
