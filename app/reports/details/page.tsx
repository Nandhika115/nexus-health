"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function ReportDetailsContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const [report, setReport] = useState<any>(null);
  const [findings, setFindings] = useState<any[]>([]);
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

  if (loading) return <p>Loading report...</p>;
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