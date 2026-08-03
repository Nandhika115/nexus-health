"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Home,
  Mic,
  FileHeart,
  Clock,
  Stethoscope,
  ShieldCheck,
  Sparkles,
  LogOut,
  AlertTriangle,
  Salad,
} from "lucide-react";
import AIOrb from "./AIOrb";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/assistant", label: "AI", icon: Mic },
  { href: "/reports", label: "Records", icon: FileHeart },
  { href: "/timeline", label: "Timeline", icon: Clock },
  { href: "/privacy", label: "Privacy", icon: ShieldCheck },
];

const SIDEBAR_EXTRA = [
  { href: "/agents", label: "Agent Brain", icon: Sparkles },
  { href: "/health-risk", label: "Health Risk", icon: AlertTriangle },
  { href: "/health-plan", label: "Health Plan", icon: Salad },
];

const DOCTOR_ONLY_LINK = { href: "/doctor", label: "Doctor View", icon: Stethoscope };

export default function Shell({
  children,
  title,
  eyebrow,
}: {
  children: React.ReactNode;
  title: string;
  eyebrow?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setIsDoctor(data?.role === "doctor");
    }
    loadRole();
  }, []);

  const navItems = isDoctor
    ? [...NAV, ...SIDEBAR_EXTRA, DOCTOR_ONLY_LINK]
    : [...NAV, ...SIDEBAR_EXTRA];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white/60 px-5 py-6 md:flex">
          <Link href="/" className="mb-8 flex items-center gap-3 px-1">
            <AIOrb size="sm" showRings={false} />
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold text-ink-700">
                Nexus Health
              </p>
              <p className="font-data text-[10px] uppercase tracking-wider text-slate-400">
                v0.1 - private beta
              </p>
            </div>
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-ink-600/10 text-ink-700"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
            <p className="font-data text-[10px] uppercase tracking-wider text-teal-700">
              Nexus status
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Monitoring quietly. No new risks detected.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </aside>

        {/* Main column */}
        <div className="flex min-h-screen flex-1 flex-col pb-24 md:pb-0">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/70 bg-canvas/80 px-5 py-4 backdrop-blur md:px-8">
            <div>
              {eyebrow && (
                <p className="font-data text-[11px] uppercase tracking-[0.18em] text-ink-600/70">
                  {eyebrow}
                </p>
              )}
              <h1 className="font-display text-xl font-semibold text-slate-900 md:text-2xl">
                {title}
              </h1>
            </div>
            <Link
              href="/assistant"
              className="hidden items-center gap-2 rounded-full bg-ink-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition-transform hover:scale-[1.02] md:flex"
            >
              <Mic className="h-4 w-4" /> Talk to Nexus
            </Link>
          </header>

          <main className="flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium",
                active ? "text-ink-700" : "text-slate-400"
              )}
            >
              <Icon className={clsx("h-5 w-5", active && "stroke-[2.4]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}