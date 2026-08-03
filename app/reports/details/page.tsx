"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ReportDetailsContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const [report, setReport] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);
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

  if (loading) return <p>Loading report...</p>;
  if (error) return <p>Error loading report: {error}</p>;
  if (!report) return <p>Report not found.</p>;

  return (
    <div>
      <h1>Full Report</h1>

      <section>
        <h2>Summary</h2>
        <p>{report.detailed_summary}</p>
      </section>

      <section>
        <h2>All findings</h2>
        {findings.map((f) => (
          <div key={f.id}>
            <strong>{f.name}</strong>: {f.value} ({f.tone})
            <p>{f.explanation}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function ReportDetailsPage() {
  return (
    <Suspense fallback={<p>Loading report...</p>}>
      <ReportDetailsContent />
    </Suspense>
  );
}