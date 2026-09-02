import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, ClipboardList, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { OutputPanel } from "@/components/deskwork/OutputPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateEmail, planTasks, summarizeNotes } from "@/lib/deskwork.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deskwork — Email, meeting notes & task planning assistant" },
      {
        name: "description",
        content:
          "Three focused AI desk tools: write a polished email, summarize messy meeting notes, and turn a task list into a time-blocked plan.",
      },
      { property: "og:title", content: "Deskwork — Email, meeting notes & task planning assistant" },
      {
        property: "og:description",
        content:
          "Write emails, summarize meetings and plan your day. AI-generated drafts, nothing stored.",
      },
    ],
  }),
  component: Deskwork,
});

type TabId = "email" | "notes" | "tasks";

const TABS: { id: TabId; label: string; icon: typeof Mail }[] = [
  { id: "email", label: "Email Generator", icon: Mail },
  { id: "notes", label: "Meeting Notes", icon: ClipboardList },
  { id: "tasks", label: "Task Planner", icon: CalendarClock },
];

type ResultState = { loading: boolean; error: string | null; text: string | null };
const IDLE: ResultState = { loading: false, error: null, text: null };

function Deskwork() {
  const [tab, setTab] = useState<TabId>("email");

  const runEmail = useServerFn(generateEmail);
  const runNotes = useServerFn(summarizeNotes);
  const runTasks = useServerFn(planTasks);

  // Email state
  const [topic, setTopic] = useState("");
  const [recipient, setRecipient] = useState("Client");
  const [tone, setTone] = useState("Formal");
  const [keyPoints, setKeyPoints] = useState("");
  const [emailRes, setEmailRes] = useState<ResultState>(IDLE);

  // Notes state
  const [notes, setNotes] = useState("");
  const [notesRes, setNotesRes] = useState<ResultState>(IDLE);

  // Tasks state
  const [tasks, setTasks] = useState("");
  const [timeAvailable, setTimeAvailable] = useState("");
  const [tasksRes, setTasksRes] = useState<ResultState>(IDLE);

  async function submit(
    setter: (s: ResultState) => void,
    call: () => Promise<{ ok: boolean; text?: string; error?: string }>,
  ) {
    setter({ loading: true, error: null, text: null });
    try {
      const res = await call();
      if (res.ok && res.text) setter({ loading: false, error: null, text: res.text });
      else setter({ loading: false, error: res.error ?? "Something went wrong.", text: null });
    } catch {
      setter({ loading: false, error: "Could not reach the assistant. Please try again.", text: null });
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-paper-edge bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deskwork</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              An AI assistant for the everyday paperwork of work.
            </p>
          </div>
          <p className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-xs text-secondary-foreground">
            <ShieldCheck className="size-4 shrink-0" />
            AI-generated — review before use. Nothing you enter is stored.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-8">
        <nav className="flex gap-1 px-2" aria-label="Deskwork tools">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              data-active={tab === id}
              aria-current={tab === id ? "page" : undefined}
              className="folder-tab flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-muted-foreground data-[active=true]:text-primary"
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="paper-sheet rounded-md rounded-tl-none p-6">
          {tab === "email" ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(setEmailRes, () =>
                    runEmail({
                      data: {
                        topic,
                        recipient: recipient as "Client",
                        tone: tone as "Formal",
                        keyPoints: keyPoints || undefined,
                      },
                    }),
                  );
                }}
              >
                <div>
                  <h2 className="text-xl font-semibold">Smart email generator</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Describe the situation; get a send-ready draft with placeholders for anything
                    you haven&apos;t specified.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">What is the email about?</Label>
                  <Textarea
                    id="topic"
                    required
                    rows={5}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Following up on the unsigned service agreement and proposing a call this week."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Recipient type</Label>
                    <Select value={recipient} onValueChange={setRecipient}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Client", "Manager", "Team", "External partner"].map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Formal", "Persuasive", "Informal"].map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keypoints">Key points (optional)</Label>
                  <Textarea
                    id="keypoints"
                    rows={3}
                    value={keyPoints}
                    onChange={(e) => setKeyPoints(e.target.value)}
                    placeholder="One per line — anything that must appear in the email."
                  />
                </div>

                <Button type="submit" disabled={emailRes.loading || !topic.trim()}>
                  {emailRes.loading ? "Writing…" : "Write the email"}
                </Button>
              </form>

              <OutputPanel
                title="Draft email"
                emptyHint="Your draft will appear here with a subject line, greeting, a 120–180 word body and a sign-off."
                {...emailRes}
              />
            </div>
          ) : null}

          {tab === "notes" ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(setNotesRes, () => runNotes({ data: { notes } }));
                }}
              >
                <div>
                  <h2 className="text-xl font-semibold">Meeting notes summarizer</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Paste raw notes. Owners and deadlines are only ever taken from what you wrote.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Raw meeting notes</Label>
                  <Textarea
                    id="notes"
                    required
                    rows={18}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Paste everything — bullet fragments, half sentences, names, whatever you captured."
                  />
                </div>

                <Button type="submit" disabled={notesRes.loading || !notes.trim()}>
                  {notesRes.loading ? "Summarizing…" : "Summarize notes"}
                </Button>
              </form>

              <OutputPanel
                title="Summary"
                emptyHint="You'll get key discussion points, decisions made, action items and open questions or risks."
                {...notesRes}
              />
            </div>
          ) : null}

          {tab === "tasks" ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(setTasksRes, () => runTasks({ data: { tasks, timeAvailable } }));
                }}
              >
                <div>
                  <h2 className="text-xl font-semibold">Task planner</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    List what&apos;s on your plate and how long you have. Deadlines are never
                    invented.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tasks">Task list — one per line</Label>
                  <Textarea
                    id="tasks"
                    required
                    rows={12}
                    value={tasks}
                    onChange={(e) => setTasks(e.target.value)}
                    placeholder={"Finish Q3 report — due Friday, ~3h\nReply to supplier email\nPrep Monday standup deck"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time available</Label>
                  <Input
                    id="time"
                    required
                    value={timeAvailable}
                    onChange={(e) => setTimeAvailable(e.target.value)}
                    placeholder="e.g. 5 hours today, 09:00–14:00"
                  />
                </div>

                <Button type="submit" disabled={tasksRes.loading || !tasks.trim() || !timeAvailable.trim()}>
                  {tasksRes.loading ? "Planning…" : "Build my plan"}
                </Button>
              </form>

              <OutputPanel
                title="Your plan"
                emptyHint="You'll get a priority order with reasoning, a time-blocked plan, and what to defer or delegate."
                {...tasksRes}
              />
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          AI-generated — review before use. Nothing you enter is stored.
        </p>
      </main>
    </div>
  );
}
