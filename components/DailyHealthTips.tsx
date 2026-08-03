"use client";

import { useEffect, useState } from "react";
import { Card, Eyebrow } from "@/components/ui";

const TIPS = [
  "💧 Drink 2–3 liters of water.",
  "🚶 Walk 30 minutes daily.",
  "🥗 Eat more fruits and vegetables.",
  "😴 Sleep for at least 7–8 hours.",
  "🩺 Get regular health checkups.",
  "🚭 Avoid smoking and excessive alcohol.",
  "🧘 Practice meditation for 10 minutes.",
];

export default function DailyHealthTips() {
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
    setTip(randomTip);
  }, []);

  return (
    <Card className="p-5">
      <Eyebrow>🌿 Daily Health Tip</Eyebrow>
      <p className="mt-2 text-sm text-slate-600">{tip}</p>
    </Card>
  );
}