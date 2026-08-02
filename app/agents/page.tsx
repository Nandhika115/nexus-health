"use client";

import { useState } from "react";
import { Stethoscope, FileHeart, AlertTriangle, Salad, Siren, ClipboardList } from "lucide-react";
import clsx from "clsx";
import Shell from "@/components/Shell";
import AIOrb from "@/components/AIOrb";
import { Card, Eyebrow, StatusDot } from "@/components/ui";

const AGENTS = [
  { id: "symptom", label: "Symptom Agent", icon: Stethoscope, note: "Understands what you're feeling and asks the right follow-up questions." },
  { id: "report", label: "Report Agent", icon: FileHeart, note: "Reads lab reports and explains values in plain language." },
  { id: "risk", label: "Risk Agent", icon: AlertTriangle, note: "Flags preventive risk indicators from patterns over time." },
  { id: "wellness", label: "Wellness Agent", icon: Salad, note: "Builds diet, sleep and activity guidance around your routine." },
  { id: "emergency", label: "Emergency Agent", icon: Siren, note: "Watches for urgent situations and guides immediate next steps." },
  { id: "doctor", label: "Doctor Agent", icon: ClipboardList, note: "Prepares a structured summary for your clinician." },
];

export default function AgentsPage() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <Shell eyebrow="How Nexus works" title="Agent Brain">
      <Card className="flex flex-col items-center gap-4 bg-gradient-to-b from-white to-canvas-card px-6 py-10">
        <AIOrb size="lg" state={active ? "thinking" : "idle"} />
        <p className="font-display text-base font-semibold text-slate-800">
          Nexus Health Agent Brain
        </p>
        <p className="max-w-md text-center text-sm text-slate-500">
          One request, several specialists. Nexus quietly routes what you say to
          the agent best suited to help — you only ever have one conversation.
        </p>
      </Card>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((a) => {
          const Icon = a.icon;
          const isActive = active === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setActive(isActive ? null : a.id)}
              className="text-left"
            >
              <Card
                className={clsx(
                  "h-full p-5 transition-all",
                  isActive && "border-teal-300 ring-2 ring-teal-100"
                )}
              >
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
                {isActive && (
                  <p className="mt-3 font-data text-[11px] text-teal-600 animate-rise">
                    ● {a.label.split(" ")[0]} Agent analyzing…
                  </p>
                )}
              </Card>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}
