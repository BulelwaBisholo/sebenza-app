/**
 * Server-only AI plumbing for Deskwork.
 *
 * Prefers Anthropic (Claude) when ANTHROPIC_API_KEY is configured; otherwise
 * falls back to the Lovable AI Gateway. Either way the key stays on the server.
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-5";
const GATEWAY_MODEL = "google/gemini-3.7-flash";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export class AiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function friendly(status: number, raw: string): string {
  if (status === 429) return "The assistant is rate limited right now. Please try again in a moment.";
  if (status === 402) return "AI credits are exhausted for this workspace. Add credits to keep generating.";
  if (status === 403) return "AI access is blocked for this workspace. Check your workspace AI settings.";
  if (status === 401) return "The AI provider rejected the configured API key.";
  return raw || "The assistant could not complete this request.";
}

export async function runChat(system: string, turns: ChatTurn[]): Promise<string> {
  const anthropicKey = process.env["ANTHROPIC_API_KEY"];

  if (anthropicKey) {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2000,
        system,
        messages: turns,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new AiError(res.status, friendly(res.status, text.slice(0, 300)));
    }
    const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const out = (json.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("")
      .trim();
    if (!out) throw new AiError(502, "The assistant returned an empty response.");
    return out;
  }

  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!lovableKey) throw new AiError(500, "No AI provider is configured.");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Lovable-API-Key": lovableKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: GATEWAY_MODEL,
      messages: [{ role: "system", content: system }, ...turns],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new AiError(res.status, friendly(res.status, text.slice(0, 300)));
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const out = json.choices?.[0]?.message?.content?.trim();
  if (!out) throw new AiError(502, "The assistant returned an empty response.");
  return out;
}

export function runPrompt(system: string, user: string): Promise<string> {
  return runChat(system, [{ role: "user", content: user }]);
}

const NO_INVENTION =
  "Absolutely never invent facts, names, dates, numbers or deadlines that were not supplied by the user. " +
  "Where a specific detail is missing but needed, insert a bracketed placeholder such as [date] or [figure]. " +
  "Return plain text only — no markdown code fences, no commentary about your process.";

export const CHAT_SYSTEM =
  "You are Deskwork's workplace assistant: helpful, concise and professional. " +
  "Answer in short, practical paragraphs or bullets. " +
  "If you do not know something, or the question needs up-to-date information you do not have, say so plainly instead of guessing. " +
  "Never fabricate facts, statistics or sources. Return plain text only — no markdown code fences.";

export const PROMPTS = {
  email: {
    system:
      "You are a precise business writing assistant producing ready-to-send workplace emails. " +
      NO_INVENTION +
      " Output format, exactly: a first line beginning with 'Subject: ', then a blank line, then a greeting line, " +
      "then the body of 120-180 words in short paragraphs, then a closing line, then '[Your name]' on the final line. " +
      "Match the requested tone precisely: Formal = measured, courteous, no contractions; " +
      "Friendly = warm, direct, conversational but still professional; " +
      "Persuasive = confident, benefit-led, with a clear call to action.",
    user: (d: { topic: string; recipient: string; tone: string; keyPoints?: string }) =>
      [
        `Recipient type: ${d.recipient}`,
        `Tone: ${d.tone}`,
        `What the email is about:\n${d.topic}`,
        d.keyPoints?.trim() ? `Key points that must be covered:\n${d.keyPoints}` : "Key points: none supplied.",
      ].join("\n\n"),
  },
  notes: {
    system:
      "You are a meeting notes summarizer. " +
      NO_INVENTION +
      " Never invent owners or deadlines: if the notes do not state an owner write 'Unassigned', if they do not state a deadline write 'No deadline given'. " +
      "Structure the output under exactly these four headings, each on its own line, in this order:\n" +
      "Key discussion points\nDecisions made\nAction items\nOpen questions or risks\n" +
      "Use '- ' bullets under each heading. Each action item must use the format: " +
      "Owner (or Unassigned): task — deadline (or No deadline given). " +
      "If a section has no content from the notes, write '- None recorded.'",
    user: (d: { notes: string }) => `Raw meeting notes:\n\n${d.notes}`,
  },
  tasks: {
    system:
      "You are a pragmatic task planner. " +
      NO_INVENTION +
      " Never invent deadlines that were not provided. " +
      "Structure the output under exactly these three headings, each on its own line, in this order:\n" +
      "Priority order\nTime-blocked plan\nWhat to defer or delegate\n" +
      "Under 'Priority order' give a numbered list, most urgent and important first, each item one line followed by a short ' — ' reasoning clause. " +
      "Under 'Time-blocked plan' build blocks that match the requested schedule type: for Daily use clock blocks '- HH:MM-HH:MM: task' fitting strictly within the stated time available; " +
      "for Weekly group blocks by day as '- Monday: task (duration)' across the stated time available. " +
      "Under 'What to defer or delegate' give '- ' bullets with a one-line rationale each; if nothing should be deferred, say so plainly.",
    user: (d: { tasks: string; scheduleType: string; timeAvailable: string }) =>
      `Schedule type: ${d.scheduleType}\nTime available: ${d.timeAvailable}\n\nTask list:\n${d.tasks}`,
  },
  research: {
    system:
      "You are a careful research assistant for busy professionals. " +
      NO_INVENTION +
      " Never fabricate statistics, studies, quotes or sources. If you are uncertain about a fact, state the uncertainty explicitly " +
      "(for example 'this is uncertain — verify before relying on it') rather than presenting it confidently. " +
      "Structure the output under exactly these three headings, each on its own line, in this order:\n" +
      "Summary\nKey insights\nRecommendations\n" +
      "Under 'Summary' write 3-5 plain-language sentences with no bullets. " +
      "Under 'Key insights' and 'Recommendations' use '- ' bullets, each one line.",
    user: (d: { input: string }) => `Topic, question or source text:\n\n${d.input}`,
  },
};
