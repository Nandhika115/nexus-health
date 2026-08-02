import Link from "next/link";
import { Mic, ArrowRight, Activity, ShieldCheck } from "lucide-react";
import AIOrb from "@/components/AIOrb";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-navy text-white">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="absolute right-0 top-0 h-[380px] w-[380px] rounded-full bg-ink-400/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-data text-[11px] uppercase tracking-[0.18em] text-teal-300">
          <ShieldCheck className="h-3.5 w-3.5" /> Privacy-first · Autonomous · Explainable
        </span>

        <AIOrb state="idle" size="xl" />

        <h1 className="mt-10 font-display text-3xl font-semibold leading-tight md:text-5xl">
          Your Nexus is
          <br />
          <span className="bg-gradient-to-r from-teal-300 to-ink-100 bg-clip-text text-transparent">
            monitoring your health.
          </span>
        </h1>

        <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-300 md:text-base">
          A team of specialist AI agents — symptom, report, risk, wellness, and
          emergency — working quietly in the background, so nothing about your
          health goes unnoticed.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/assistant"
            className="group flex items-center gap-2 rounded-full bg-teal-500 px-6 py-3.5 text-sm font-semibold text-navy shadow-glow transition-transform hover:scale-[1.03]"
          >
            <Mic className="h-4 w-4" /> Start talking
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
          >
            <Activity className="h-4 w-4" /> View my dashboard
            <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-16 grid w-full grid-cols-3 gap-3 border-t border-white/10 pt-8 text-left">
          {[
            { label: "Reports understood", value: "128" },
            { label: "Risks flagged early", value: "6" },
            { label: "Data shared only with", value: "consent" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-data text-lg text-teal-300 md:text-xl">{s.value}</p>
              <p className="mt-1 text-[11px] leading-snug text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
