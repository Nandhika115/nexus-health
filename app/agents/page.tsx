"use client";

import { useState } from "react";
import { Stethoscope, FileHeart, AlertTriangle, Salad, Siren, ClipboardList, Send } from "lucide-react";
import clsx from "clsx";
import Shell from "@/components/Shell";
import AIOrb from "@/components/AIOrb";
import { Card, Eyebrow, StatusDot } from "@/components/ui";
import { AIProvider } from "@/lib/types";

const PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: "claude", label: "Claude" },
  { id: "gpt", label: "GPT" },
  { id: "gemini", label: "Gemini" },
  { id: "groq", label: "Groq" },
];

const AGENTS = [
  { id: "symptom", label: "Symptom Agent", icon: Stethoscope, note: "Understands what you are feeling and asks the right follow-up questions.", placeholder: "e.g. I have had a headache for two days" },
  { id: "report", label: "Report Agent", icon: FileHeart, note: "Reads lab reports and explains values in plain language.", placeholder: "e.g. My vitamin D is 15 ng/ml, what does that mean?" },
  { id: "risk", label: "Risk Agent", icon: AlertTriangle, note: "Flags preventive risk indicators from patterns over time.", placeholder: "e.g. I have a family history of diabetes" },
  { id: "wellness", label: "Wellness Agent", icon: Salad, note: "Builds diet, sleep and activity guidance around your routine.", placeholder: "e.g. I want to sleep better" },
  { id: "emergency", label: "Emergency Agent", icon: Siren, note: "Watches for urgent situations and guides immediate next steps.", placeholder: "e.g. I feel chest pain right now" },
  { id: "doctor", label: "Doctor Agent", icon: ClipboardList, note: "Prepares a structured summary for your clinician.", placeholder: "e.g. Summarize my fatigue and low vitamin D for my doctor" },
];

export default function AgentsPage() {
  const [active, setActive] = useState<string | null>(null);
  const [provider, setProvider] = useState<AIProvider>("claude");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<Record<string, string>>({});

  function openAgent(id: string) {
    setActive((cur) => (cur === id ? null : id));
    setDraft("");
  }

  async function ask(agentId: string) {
    if (!draft.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          agent: agentId,
          messages: [{ role: "user", content: draft }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setReplies((r) => ({ ...r, [agentId]: data.reply }));
    } catch (err: any) {
      setReplies((r) => ({ ...r, [agentId]: "Error: " + (err.message ?? "unknown error") }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell eyebrow="How Nexus works" title="Agent Brain">
      <Card className="flex flex-col items-center gap-4 bg-gradient-to-b from-white to-canvas-card px-6 py-10">
        <AIOrb size="lg" state={loading ? "thinking" : "idle"} />
        <p className="font-display text-base font-semibold text-slate-800">
          Nexus Health Agent Brain
        </p>
        <p className="max-w-md text-center text-sm text-slate-500">
          Click any agent below, type a message, and see how that specialist responds on its own.
        </p>
        <div className="flex gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={clsx(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                provider === p.id
                  ? "border-ink-600 bg-ink-600/10 text-ink-700"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((a) => {
          const Icon = a.icon;
          const isActive = active === a.id;
          return (
            <Card
              key={a.id}
              className={clsx(
                "h-full p-5 transition-all",
                isActive && "border-teal-300 ring-2 ring-teal-100"
              )}
            >
              <button onClick={() => openAgent(a.id)} className="w-full text-left">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-600/10 text-ink-700">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <StatusDot tone="good" pulse={isActive} />
                </div>
                <p className="mt-3 font-display text-sm font-semibold text-slate-800">
                  {a.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{a.note}</p>
              </button>

              {isActive && (
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={a.placeholder}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-ink-400"
                  />
                  <button
                    onClick={() => ask(a.id)}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-full bg-ink-600 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    {loading ? "Thinking..." : "Ask this agent"}
                  </button>
                  {replies[a.id] && (
                    <p className="rounded-lg bg-canvas-card p-3 text-xs leading-relaxed text-slate-700">
                      {replies[a.id]}
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Shell>
  );
}