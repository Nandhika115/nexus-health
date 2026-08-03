"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Send, Sparkles } from "lucide-react";
import clsx from "clsx";
import Shell from "@/components/Shell";
import AIOrb from "@/components/AIOrb";
import { Card, Pill } from "@/components/ui";
import { AIProvider, ChatMessage } from "@/lib/types";

const PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: "claude", label: "Claude" },
  { id: "gpt", label: "GPT" },
  { id: "gemini", label: "Gemini" },
  { id: "groq", label: "Groq" },
];

const LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "ta-IN", label: "Tamil" },
  { code: "hi-IN", label: "Hindi" },
];

type OrbState = "idle" | "listening" | "thinking" | "speaking";

export default function AssistantPage() {
  const [provider, setProvider] = useState<AIProvider>("claude");
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm Nexus. Tell me what you're feeling, or ask about a report - I'm listening.",
    },
  ]);
  const [lastAgent, setLastAgent] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, orbState]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDraft(transcript);
      handleSend(transcript);
    };
    recognition.onend = () => setOrbState((s) => (s === "listening" ? "idle" : s));
    recognitionRef.current = recognition;
  }, [language, provider]);

  function toggleListening() {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert("Voice input isn't supported in this browser. Type your message instead.");
      return;
    }
    recognition.lang = language.code;
    if (orbState === "listening") {
      recognition.stop();
      setOrbState("idle");
    } else {
      recognition.start();
      setOrbState("listening");
    }
  }

  async function handleSend(text?: string) {
    const content = (text ?? draft).trim();
    if (!content) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setDraft("");
    setOrbState("thinking");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, messages: nextMessages, conversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");

      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      setLastAgent(data.agent);
      if (data.conversationId) setConversationId(data.conversationId);
      setOrbState("speaking");
      speak(data.reply);
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Debug error: " + (err.message ?? "unknown error"),
        },
      ]);
      setOrbState("idle");
    }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      setOrbState("idle");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language.code;
    utterance.onend = () => setOrbState("idle");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <Shell eyebrow="Nexus brain - voice mode" title="Nexus">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-navy to-ink-700 px-6 py-12 text-center text-white">
          <AIOrb state={orbState} size="xl" />

          <p className="font-display text-lg font-medium">
            {orbState === "listening" && "Listening..."}
            {orbState === "thinking" && "Thinking..."}
            {orbState === "speaking" && "Responding..."}
            {orbState === "idle" && "Tell me what you are feeling"}
          </p>
          {lastAgent && orbState !== "idle" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] text-teal-200">
              <Sparkles className="h-3 w-3" /> {lastAgent} responding via {provider}
            </span>
          )}

          <button
            onClick={toggleListening}
            className={clsx(
              "mt-2 flex h-14 w-14 items-center justify-center rounded-full transition-colors",
              orbState === "listening"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-teal-500 hover:bg-teal-400"
            )}
            aria-label={orbState === "listening" ? "Stop listening" : "Start conversation"}
          >
            {orbState === "listening" ? (
              <Square className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5 text-navy" />
            )}
          </button>
          <p className="font-data text-[11px] uppercase tracking-widest text-slate-400">
            {orbState === "listening" ? "Stop" : "Start conversation"}
          </p>

          <div className="mt-4 flex items-center gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l)}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  language.code === l.code
                    ? "bg-white text-navy"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <p className="mb-2 font-data text-[11px] uppercase tracking-widest text-slate-400">
              AI model
            </p>
            <div className="flex gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={clsx(
                    "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
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

          <Card className="flex flex-1 flex-col p-4">
            <p className="mb-2 font-data text-[11px] uppercase tracking-widest text-slate-400">
              Conversation
            </p>
            <div ref={scrollRef} className="max-h-[360px] flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-none">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={clsx(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "ml-auto bg-ink-600 text-white"
                      : "bg-canvas-card text-slate-700"
                  )}
                >
                  {m.content}
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type instead of speaking..."
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-ink-400"
              />
              <button
                type="submit"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-600 text-white"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </Card>

          <Pill tone="idle">This is general guidance, not a diagnosis. For emergencies, contact local emergency services.</Pill>
        </div>
      </div>
    </Shell>
  );
}