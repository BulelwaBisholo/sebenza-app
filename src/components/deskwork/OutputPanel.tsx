import { Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  emptyHint: string;
  loading: boolean;
  error: string | null;
  text: string | null;
};

export function OutputPanel({ title, emptyHint, loading, error, text }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="panel flex h-full min-h-[24rem] flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h3 className="text-base font-semibold">{title}</h3>
        {text ? (
          <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        ) : null}
      </header>

      <div className="flex-1 px-5 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Working on it…
          </div>
        ) : error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : text ? (
          <div className="output-sheet text-[0.95rem] text-foreground">{text}</div>
        ) : (
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{emptyHint}</p>
        )}
      </div>
    </section>
  );
}
