import { NextRequest, NextResponse } from "next/server";
import { AGENTS, AgentId, buildSystemPrompt, routeAgent } from "@/lib/agents";
import { callProvider } from "@/lib/providers";
import { AIProvider, ChatMessage } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const provider = (body.provider ?? "claude") as AIProvider;
    const messages = (body.messages ?? []) as ChatMessage[];
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

    const agent: AgentId = body.agent ?? routeAgent(lastUserMessage?.content ?? "");
    const system = buildSystemPrompt(agent);

    const reply = await callProvider(provider, { system, messages });

    // Best-effort persistence — a signed-in user gets their conversation and
    // both sides of this turn saved; an unauthenticated/demo session just
    // skips this without breaking the response.
    let conversationId: string | null = body.conversationId ?? null;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        if (!conversationId) {
          const { data: conversation } = await supabase
            .from("conversations")
            .insert({ patient_id: user.id, provider })
            .select("id")
            .single();
          conversationId = conversation?.id ?? null;
        }

        if (conversationId && lastUserMessage) {
          await supabase.from("messages").insert([
            {
              conversation_id: conversationId,
              role: "user",
              content: lastUserMessage.content,
              agent_id: agent,
            },
            {
              conversation_id: conversationId,
              role: "assistant",
              content: reply,
              agent_id: agent,
            },
          ]);
        }
      }
    } catch (persistErr) {
      console.error("Chat persistence skipped:", persistErr);
    }

    return NextResponse.json({
      reply,
      agent: AGENTS[agent].label,
      agentId: agent,
      provider,
      conversationId,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Nexus error: " + (err?.message ?? "unknown") },
      { status: 500 }
    );
  }
}