"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { AIProvider } from "@/lib/types";

const PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: "claude", label: "Claude" },
  { id: "gpt", label: "GPT" },
  { id: "gemini", label: "Gemini" },
  { id: "groq", label: "Groq" },
];

export default function HealthPlanPage() {
  const supabase = createClient();

  const [provider, setProvider] = useState<AIProvider>("claude");
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [result, setResult] = useState("");

  const [plan, setPlan] = useState({
    diet: "",
    exercise: "",
    sleep: "",
    stress: "",
  });

  const [form, setForm] = useState({
    goal: "",
    dietPreference: "",
    activityLevel: "",
    sleepIssues: "",
    stressLevel: "",
  });

  useEffect(() => {
    async function loadExistingPlan() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoadingExisting(false);
        return;
      }
      const { data } = await supabase
        .from("health_plans")
        .select("diet, exercise, sleep, stress")
        .eq("patient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setPlan(data);
        setResult("loaded");
      }
      setLoadingExisting(false);
    }
    loadExistingPlan();
  }, []);

  async function generatePlan() {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent: "wellness",
          provider,
          messages: [
            {
              role: "user",
              content:
                "Create a personalized wellness plan for this person.\n\n" +
                "Main goal: " + form.goal + "\n\n" +
                "Diet preference: " + form.dietPreference + "\n\n" +
                "Current activity level: " + form.activityLevel + "\n\n" +
                "Sleep issues: " + form.sleepIssues + "\n\n" +
                "Stress level: " + form.stressLevel + "\n\n" +
                "Return the answer in this exact format:\n\n" +
                "Diet:\n(Practical diet guidance)\n\n" +
                "Exercise:\n(A realistic weekly activity plan)\n\n" +
                "Sleep:\n(Specific sleep improvement steps)\n\n" +
                "Stress:\n(Stress management techniques)",
            },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI plan generation failed");

      const reply = data.reply;

      const newPlan = {
        diet: reply.match(/Diet:\s*([\s\S]*?)Exercise:/)?.[1]?.trim() ?? "",
        exercise: reply.match(/Exercise:\s*([\s\S]*?)Sleep:/)?.[1]?.trim() ?? "",
        sleep: reply.match(/Sleep:\s*([\s\S]*?)Stress:/)?.[1]?.trim() ?? "",
        stress: reply.match(/Stress:\s*([\s\S]*)/)?.[1]?.trim() ?? "",
      };

      setPlan(newPlan);
      setResult(reply);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error: planError } = await supabase.from("health_plans").insert({
          patient_id: user.id,
          ...newPlan,
        });
        if (planError) console.error("Health plan insert error:", planError);

        const { error: timelineError } = await supabase.from("timeline_events").insert({
          patient_id: user.id,
          title: "Wellness plan generated",
          detail: "Goal: " + (form.goal || "General wellness"),
          tone: "good",
          occurred_at: new Date().toISOString(),
        });
        if (timelineError) console.error("Timeline insert error:", timelineError);
      }
    } catch (error: any) {
      setResult(error.message || "Unable to generate a wellness plan.");
    } finally {
      setLoading(false);
    }
  }

  const hasPlan = plan.diet || plan.exercise || plan.sleep || plan.stress;

  return (
    <main className="min-h-screen bg-navy text-white p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">AI Personalized Health Plan</h1>
        <p className="text-slate-400 mb-4">
          Tell Nexus about your goals and routine to get a diet, exercise, sleep,
          and stress plan built around you.
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
            placeholder="Main goal (e.g. lose weight, sleep better, reduce stress)"
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            className="w-full rounded-xl bg-white/5 p-3"
          />
          <input
            placeholder="Diet preference (e.g. vegetarian, no restrictions)"
            value={form.dietPreference}
            onChange={(e) => setForm({ ...form, dietPreference: e.target.value })}
            className="w-full rounded-xl bg-white/5 p-3"
          />
          <input
            placeholder="Current activity level (e.g. sedentary, light exercise, active)"
            value={form.activityLevel}
            onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
            className="w-full rounded-xl bg-white/5 p-3"
          />
          <input
            placeholder="Sleep issues (e.g. trouble falling asleep, none)"
            value={form.sleepIssues}
            onChange={(e) => setForm({ ...form, sleepIssues: e.target.value })}
            className="w-full rounded-xl bg-white/5 p-3"
          />
          <input
            placeholder="Stress level (e.g. low, moderate, high)"
            value={form.stressLevel}
            onChange={(e) => setForm({ ...form, stressLevel: e.target.value })}
            className="w-full rounded-xl bg-white/5 p-3"
          />

          <button
            onClick={generatePlan}
            disabled={loading}
            className="w-full rounded-full bg-teal-500 py-3 text-navy font-semibold disabled:opacity-50"
          >
            {loading ? "Generating..." : hasPlan ? "Generate new plan" : "Generate my plan"}
          </button>

          {loadingExisting && (
            <p className="text-center text-xs text-slate-500">Checking for an existing plan...</p>
          )}

          {!loadingExisting && hasPlan && (
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-semibold">Your wellness plan</h2>

              <div className="rounded-xl bg-white/5 p-4">
                <p className="font-semibold">Diet</p>
                <p className="mt-2 text-sm text-slate-300 whitespace-pre-line">{plan.diet}</p>
              </div>

              <div className="rounded-xl bg-white/5 p-4">
                <p className="font-semibold">Exercise</p>
                <p className="mt-2 text-sm text-slate-300 whitespace-pre-line">{plan.exercise}</p>
              </div>

              <div className="rounded-xl bg-white/5 p-4">
                <p className="font-semibold">Sleep</p>
                <p className="mt-2 text-sm text-slate-300 whitespace-pre-line">{plan.sleep}</p>
              </div>

              <div className="rounded-xl bg-white/5 p-4">
                <p className="font-semibold">Stress</p>
                <p className="mt-2 text-sm text-slate-300 whitespace-pre-line">{plan.stress}</p>
              </div>
            </div>
          )}

          {!hasPlan && result && result !== "loaded" && (
            <p className="text-sm text-red-400">{result}</p>
          )}
        </div>
      </div>
    </main>
  );
}