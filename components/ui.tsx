import clsx from "clsx";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200/70 bg-white/90 shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

const DOT_COLOR: Record<string, string> = {
  good: "bg-status-good",
  attn: "bg-status-attn",
  alert: "bg-status-alert",
  idle: "bg-slate-300",
};

export function StatusDot({
  tone = "good",
  pulse = false,
}: {
  tone?: "good" | "attn" | "alert" | "idle";
  pulse?: boolean;
}) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {pulse && (
        <span
          className={clsx(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
            DOT_COLOR[tone]
          )}
        />
      )}
      <span className={clsx("relative inline-flex h-2.5 w-2.5 rounded-full", DOT_COLOR[tone])} />
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-data text-[11px] uppercase tracking-[0.18em] text-ink-600/70">
      {children}
    </p>
  );
}

export function Pill({
  children,
  tone = "idle",
}: {
  children: React.ReactNode;
  tone?: "good" | "attn" | "alert" | "idle";
}) {
  const toneClasses: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    attn: "bg-orange-50 text-orange-700 border-orange-200",
    alert: "bg-red-50 text-red-700 border-red-200",
    idle: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}
