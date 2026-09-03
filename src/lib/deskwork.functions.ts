import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const EmailInput = z.object({
  topic: z.string().min(1).max(6000),
  recipient: z.enum(["Client", "Manager", "Team", "External partner"]),
  tone: z.enum(["Formal", "Friendly", "Persuasive"]),
  keyPoints: z.string().max(4000).optional(),
});

const NotesInput = z.object({
  notes: z.string().min(1).max(20000),
});

const TasksInput = z.object({
  tasks: z.string().min(1).max(8000),
  scheduleType: z.enum(["Daily", "Weekly"]),
  timeAvailable: z.string().min(1).max(200),
});

const ResearchInput = z.object({
  input: z.string().min(1).max(20000),
});

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
});

async function run(kind: "email" | "notes" | "tasks" | "research", data: unknown) {
  const { runPrompt, PROMPTS, AiError } = await import("./deskwork.server");
  const spec = PROMPTS[kind];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = await runPrompt(spec.system, (spec.user as any)(data));
    return { ok: true as const, text };
  } catch (err) {
    if (err instanceof AiError) return { ok: false as const, error: err.message };
    console.error(err);
    return { ok: false as const, error: "Something went wrong generating this. Please try again." };
  }
}

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => run("email", data));

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NotesInput.parse(input))
  .handler(async ({ data }) => run("notes", data));

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TasksInput.parse(input))
  .handler(async ({ data }) => run("tasks", data));

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ResearchInput.parse(input))
  .handler(async ({ data }) => run("research", data));

export const chatReply = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const { runChat, CHAT_SYSTEM, AiError } = await import("./deskwork.server");
    try {
      const text = await runChat(CHAT_SYSTEM, data.messages);
      return { ok: true as const, text };
    } catch (err) {
      if (err instanceof AiError) return { ok: false as const, error: err.message };
      console.error(err);
      return { ok: false as const, error: "Something went wrong. Please try again." };
    }
  });
