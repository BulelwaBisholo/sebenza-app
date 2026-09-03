import { useServerFn } from "@tanstack/react-start";
import { Loader2, SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatReply } from "@/lib/deskwork.functions";

type Turn = { role: "user" | "assistant"; content: string };

export function ChatPanel() {
  const send = useServerFn(chatReply);
  const [messages, setMessages] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || loading) return;
    const next: Turn[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setError(null);
    setLoading(true);
    try {
      const res = await send({ data: { messages: next } });
      if (res.ok && res.text) setMessages([...next, { role: "assistant", content: res.text }]);
      else setError(res.error ?? "Something went wrong.");
    } catch {
      setError("Could not reach the assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel flex h-[70vh] min-h-[30rem] flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 && !loading ? (
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Ask anything work-related — drafting, planning, explaining, thinking something through.
            The conversation stays in this browser session only.
          </p>
        ) : null}

        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] whitespace-pre-wrap rounded-lg rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground"
                  : "max-w-[80%] whitespace-pre-wrap rounded-lg rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed text-secondary-foreground"
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Thinking…
          </div>
        ) : null}

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border px-4 py-3">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message Sebenza…"
          aria-label="Message"
        />
        <Button type="submit" disabled={loading || !draft.trim()} className="gap-1.5">
          <SendHorizonal className="size-4" />
          Send
        </Button>
      </form>
    </section>
  );
}
