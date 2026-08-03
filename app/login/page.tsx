"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, User, Eye, EyeOff } from "lucide-react";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import AIOrb from "@/components/AIOrb";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "sign-up") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      // Create the matching profile row (id must equal auth.users.id).
      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: fullName,
          role,
        });
      }
      setLoading(false);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-6 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <AIOrb size="md" />
          <p className="font-display text-lg font-semibold">Nexus Health</p>
          <p className="text-xs text-slate-400">
            {mode === "sign-in" ? "Sign in to continue" : "Create your account"}
          </p>
        </div>

        <div className="mb-5 flex rounded-full border border-white/10 bg-white/5 p-1">
          {(["sign-in", "sign-up"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={clsx(
                "flex-1 rounded-full py-2 text-xs font-medium transition-colors",
                mode === m ? "bg-white text-navy" : "text-slate-300"
              )}
            >
              {m === "sign-in" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "sign-up" && (
            <>
              <input
                required
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-teal-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole("patient")}
                  className={clsx(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium",
                    role === "patient"
                      ? "border-teal-400 bg-teal-400/10 text-teal-300"
                      : "border-white/10 text-slate-400"
                  )}
                >
                  <User className="h-3.5 w-3.5" /> Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole("doctor")}
                  className={clsx(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium",
                    role === "doctor"
                      ? "border-teal-400 bg-teal-400/10 text-teal-300"
                      : "border-white/10 text-slate-400"
                  )}
                >
                  <Stethoscope className="h-3.5 w-3.5" /> Doctor
                </button>
              </div>
            </>
          )}
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-teal-400"
          />
          <div className="relative">
  <input
    required
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    minLength={6}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-11 text-sm outline-none focus:border-teal-400"
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
  >
    {showPassword ? (
      <Eye className="h-5 w-5" />
    ) : (
      <EyeOff className="h-5 w-5" />
    )}
  </button>
</div>
          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-teal-500 py-2.5 text-sm font-semibold text-navy disabled:opacity-60"
          >
            {loading ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
