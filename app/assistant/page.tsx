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
        "Hi, I'm Nexus. Tell me what you're feeling, or ask about a report — I'm listening.",
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
          content: `Debug error: ${err.message ?? "unknown error"}`,
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
    <Shell eyebrow="Nexus brain · voice mode" title="Nexus">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-navy to-ink-700 px-6 py-12 text-center text-white">
          <AIOrb state={orbState} size="xl" />

          <p className="font-display text-lg font-medium">
            {orbState === "listening" && "Listening…"}
            {orbState === "thinking" && "Thinking…"}
            {orbState === "speaking" && "Responding…"}
            {orbState === "idle" && "Tell me what you are feeling"}
          </p>