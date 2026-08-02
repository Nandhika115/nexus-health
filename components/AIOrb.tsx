"use client";

import clsx from "clsx";

type OrbState = "idle" | "listening" | "thinking" | "speaking";

const STATE_COLOR: Record<OrbState, string> = {
  idle: "from-teal-400 to-ink-600",
  listening: "from-teal-400 to-teal-700",
  thinking: "from-ink-400 to-ink-700",
  speaking: "from-teal-400 to-ink-600",
};

export default function AIOrb({
  state = "idle",
  size = "md",
  showRings = true,
}: {
  state?: OrbState;
  size?: "sm" | "md" | "lg" | "xl";
  showRings?: boolean;
}) {
  const dims: Record<string, string> = {
    sm: "h-9 w-9",
    md: "h-16 w-16",
    lg: "h-28 w-28",
    xl: "h-44 w-44",
  };

  return (
    <div className={clsx("relative flex items-center justify-center", dims[size])}>
      {showRings && (
        <>
          <span className="absolute inset-0 rounded-full border border-teal-400/40 animate-ring1" />
          <span className="absolute inset-0 rounded-full border border-teal-400/30 animate-ring2" />
          <span className="absolute inset-0 rounded-full border border-teal-400/20 animate-ring3" />
        </>
      )}
      <div
        className={clsx(
          "relative h-full w-full rounded-full bg-gradient-to-br animate-breathe shadow-glow",
          STATE_COLOR[state]
        )}
      >
        <div className="absolute inset-[18%] rounded-full bg-white/10 backdrop-blur-sm" />
        <div className="absolute inset-[38%] rounded-full bg-white/70" />
      </div>
    </div>
  );
}
