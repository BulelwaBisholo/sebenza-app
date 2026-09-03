import { ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const POINTS = [
  "This tool generates drafts, not final answers — always review output before sending, sharing, or acting on it.",
  "AI can miss context you didn't type in, and can sound confident while being wrong. It will not invent names, dates, or deadlines you didn't provide — but double-check anything time-sensitive.",
  "Like all AI tools, responses can reflect bias present in training data. If an output feels off for your audience or context, trust your judgement over the draft.",
  "Nothing you type into Sebenza is stored or reused once you close this page.",
];

export function ResponsibleAiDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <ShieldCheck className="size-4" />
          Responsible AI
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Using this tool responsibly</DialogTitle>
          <DialogDescription className="sr-only">
            Guidance on reviewing AI-generated output from Sebenza.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-3.5 text-sm leading-relaxed text-foreground">
          {POINTS.map((p) => (
            <li key={p} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
