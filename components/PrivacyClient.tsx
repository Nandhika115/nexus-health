"use client";

import { useState } from "react";
import { Lock, BrainCircuit, X } from "lucide-react";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface Share {
  id: string;
  scope: string;
  expires_at: string;
  doctor: { full_name: string } | { full_name: string }[] | null;
}

export default function PrivacyClient({
  patientId,
  initialMemoryEnabled,
  initialShares,
  isDemoData,
}: {
  patientId: string | null;
  initialMemoryEnabled: boolean;
  initialShares: Share[];
  isDemoData: boolean;
}) {
  const supabase = createClient();
  const [memoryOn, setMemoryOn] = useState(initialMemoryEnabled);
  const [shares, setShares] = useState(initialShares);

  async function toggleMemory() {
    const next = !memoryOn;
    setMemoryOn(next);
    if (!patientId || isDemoData) return;
    await supabase.from("profiles").update({ memory_enabled: next }).eq("id", patientId);
  }

  async function revoke(shareId: string) {
    setShares((cur) => cur.filter((s) => s.id !== shareId));
    if (isDemoData) return;
    await supabase
      .from("consent_shares")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", shareId);
  }

  function doctorName(share: Share) {
    if (!share.doctor) return "Doctor";
    return Array.isArray(share.doctor) ? share.doctor[0]?.full_name : share.doctor.full_name;
  }

  function expiresLabel(iso: string) {
    const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
    if (days <= 0) return "today";
    if (days === 1) return "in 1 day";
    return `in ${days} days`;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <Eyebrow>Your health data</Eyebrow>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-canvas-card/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4 text-ink-600" />
              <p className="text-sm font-medium text-slate-700">Medical reports</p>
            </div>
            <Pill tone="good">Encrypted</Pill>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-canvas-card/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-4 w-4 text-ink-600" />
              <p className="text-sm font-medium text-slate-700">AI memory</p>
            </div>
            <button
              onClick={toggleMemory}
              className={`h-6 w-11 rounded-full transition-colors ${
                memoryOn ? "bg-teal-500" : "bg-slate-200"
              } relative`}
              aria-label="Toggle AI memory"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  memoryOn ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <Eyebrow>Data sharing</Eyebrow>
        <div className="mt-4 space-y-3">
          {shares.length === 0 && (
            <p className="text-sm text-slate-400">No active shares. You're fully private.</p>
          )}
          {shares.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-canvas-card/50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-700">{doctorName(s)}</p>
                <p className="text-xs text-slate-400">
                  Access: {s.scope} · expires {expiresLabel(s.expires_at)}
                </p>
              </div>
              <button
                onClick={() => revoke(s.id)}
                className="flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <X className="h-3 w-3" /> Revoke
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
