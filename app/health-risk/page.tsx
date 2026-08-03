"use client";

import { useState } from "react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { AIProvider } from "@/lib/types";

const PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: "claude", label: "Claude" },
  { id: "gpt", label: "GPT" },
  { id: "gemini", label: "Gemini" },
  { id: "groq", label: "Groq" },
];

export default function HealthRiskPage() {
  const supabase = createClient();

  const [provider, setProvider] = useState<AIProvider>("claude");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const [riskData, setRiskData] = useState({
    level: "",
    indicators: "",
    actions: "",
    guidance: "",
  });

  const [form, setForm] = useState({
    age: "",
    symptoms: "",
    lifestyle: "",
    medicalHistory: "",
  });

  async function analyzeRisk() {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent: "risk",
          provider,
          messages: [
            {
              role: "user",
              content:
                "Analyze this person's health risk indicators.\n\n" +
                "Age: " + form.age + "\n\n" +
                "Symptoms:\n" + form.symptoms + "\n\n" +
                "Lifestyle:\n" + form.lifestyle + "\n\n" +
                "Medical History:\n" + form.medicalHistory + "\n\n" +
                "Return the answer in this exact format:\n\n" +
                "Risk Level:\n(Write only Low, Medium, or High)\n\n" +
                "Risk Indicators:\n(List possible health risk indicators)\n\n" +
                "Preventive Actions:\n(List practical preventive steps)\n\n" +
                "Doctor Guidance:\n(Explain when the person should consult a doctor)\n\n" +
                "Do not provide a confirmed diagnosis.",
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI analysis failed");
      }

      const reply = data.reply;

      setResult(reply);

      setRiskData({
        level: reply.match(/Risk Level:\s*(.*)/)?.[1] ?? "",
        indicators:
          reply.match(/Risk Indicators:\s*([\s\S]*?)Preventive Actions:/)?.[1] ?? "",
        actions:
          reply.match(/Preventive Actions:\s*([\s\S]*?)Doctor Guidance:/)?.[1] ?? "",
        guidance: reply.match(/Doctor Guidance:\s*([\s\S]*)/)?.[1] ?? "",
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from("timeline_events").insert({
          patient_id: user.id,
          title: "AI Health Risk Assessment",
          detail: "Risk Level: " + (reply.match(/Risk Level:\s*(.*)/)?.[1] ?? "Unknown"),
          tone: "attn",
          occurred_at: new Date().toISOString(),
        });
        if (error) console.error("Timeline insert error:", error);
      }
    } catch (error: any) {
      setResult(error.message || "Unable to analyze health risk.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-navy text-white p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">AI Health Risk Prediction</h1>
        <p className="text-slate-400 mb-4">
          Analyze your health data and get AI-powered risk insights.
        </p>

        <div className="mb-6 flex gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                provider === p.id
                  ? "border-teal-400 bg-teal-400/10 text-teal-300"
                  : "border-white/10 text-slate-400 hover:bg-white/5"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <input
            placeholder="Age"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="w-full rounded-xl bg-white/5 p-3"
          />

          <textarea
            placeholder="Current symptoms"
            value={form.symptoms}
            onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
            className="w-full rounded-xl bg-white/5 p-3"
          />

          <textarea
            placeholder="Lifestyle (sleep, diet, exercise, stress)"
            value={form.lifestyle}
            onChange={(e) => setForm({ ...form, lifestyle: e.target.value })}
            className="w-full rounded-xl bg-white/5 p-3"
          />

          <textarea
            placeholder="Previous medical history"
            value={form.medicalHistory}
            onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
            className="w-full rounded-xl bg-white/5 p-3"
          />

          <button
            onClick={analyzeRisk}
            disabled={loading}
            className="w-full rounded-full bg-teal-500 py-3 text-navy font-semibold disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Health Risk"}
          </button>

          {result && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-semibold">AI Health Report</h2>

              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-sm text-slate-400">Risk Level</p>
                <p className="mt-1 text-xl font-bold text-yellow-400">{riskData.level}</p>
              </div>

              <div className="rounded-xl bg-white/5 p-4">
                <p className="font-semibold">Risk Indicators</p>
                <p className="mt-2 text-sm text-slate-300 whitespace-pre-line">
                  {riskData.indicators}
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-4">
                <p className="font-semibold">Preventive Actions</p>
                <p className="mt-2 text-sm text-slate-300 whitespace-pre-line">
                  {riskData.actions}
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-4">
                <p className="font-semibold">Doctor Guidance</p>
                <p className="mt-2 text-sm text-slate-300 whitespace-pre-line">
                  {riskData.guidance}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}