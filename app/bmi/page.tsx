"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { Card, Eyebrow, Pill } from "@/components/ui";

type Category = "Underweight" | "Normal" | "Overweight" | "Obese";

function getCategory(bmi: number): { label: Category; tone: "good" | "attn" } {
  if (bmi < 18.5) return { label: "Underweight", tone: "attn" };
  if (bmi < 25) return { label: "Normal", tone: "good" };
  if (bmi < 30) return { label: "Overweight", tone: "attn" };
  return { label: "Obese", tone: "attn" };
}

export default function BmiPage() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState<number | null>(null);

  function handleCalculate() {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return;

    const heightInMeters = h / 100;
    const result = w / (heightInMeters * heightInMeters);
    setBmi(Math.round(result * 100) / 100);
  }

  const category = bmi !== null ? getCategory(bmi) : null;

  return (
    <Shell eyebrow="Health Tools" title="BMI Calculator">
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card className="p-6">
          <Eyebrow>Your details</Eyebrow>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 170"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 65"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleCalculate}
              className="w-full rounded-full bg-ink-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Calculate
            </button>
          </div>
        </Card>

        <Card className="p-6">
          {bmi === null && (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-sm text-slate-400">
              Enter your height and weight to see your BMI here.
            </div>
          )}

          {bmi !== null && category && (
            <div>
              <Eyebrow>Result</Eyebrow>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-canvas-card/50 p-5">
                <div>
                  <p className="text-3xl font-bold text-slate-800">{bmi}</p>
                  <p className="text-xs text-slate-400">BMI</p>
                </div>
                <Pill tone={category.tone}>{category.label}</Pill>
              </div>

              <div className="mt-6">
                <Eyebrow>Categories</Eyebrow>
                <table className="mt-3 w-full text-xs text-slate-600">
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 font-medium">&lt; 18.5</td>
                      <td className="py-2">Underweight</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 font-medium">18.5 – 24.9</td>
                      <td className="py-2">Normal</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 font-medium">25 – 29.9</td>
                      <td className="py-2">Overweight</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">&ge; 30</td>
                      <td className="py-2">Obese</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}