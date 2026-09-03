import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarClock,
  ClipboardList,
  Mail,
  Menu,
  MessagesSquare,
  Search,
} from "lucide-react";
import { useState } from "react";

import { ChatPanel } from "@/components/deskwork/ChatPanel";
import { OutputPanel } from "@/components/deskwork/OutputPanel";
import { ResponsibleAiDialog } from "@/components/deskwork/ResponsibleAiDialog";
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
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  generateEmail,
  planTasks,
  researchTopic,
  summarizeNotes,
} from "@/lib/deskwork.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sebenza — AI assistant for emails, meetings & planning" },
      {
        name: "description",
        content:
          "Five focused AI desk tools: write emails, summarize meeting notes, plan tasks, research topics and chat with a workplace assistant.",
      },
      { property: "og:title", content: "Sebenza — AI workplace productivity assistant" },
      {
        property: "og:description",
        content:
          "Emails, meeting summaries, task plans, research and chat — AI drafts you review before you send.",
      },
    ],
  }),
  component: Deskwork,
});

type ToolId = "email" | "notes" | "tasks" | "research" | "chat";

const TOOLS: {
  id: ToolId;
  label: string;
  icon: typeof Mail;
  description: string;
}[] = [
  {
    id: "email",
    label: "Email generator",
    icon: Mail,
    description: "Describe the situation and get a send-ready draft in the tone you choose.",
  },
  {
    id: "notes",
    label: "Meeting notes",
    icon: ClipboardList,
    description: "Turn raw notes into decisions, action items and open questions.",
  },
  {
    id: "tasks",
    label: "Task planner",
    icon: CalendarClock,
    description: "Prioritise your list and block it into the time you actually have.",
  },
  {
    id: "research",
    label: "Research assistant",
    icon: Search,
    description: "Summarise a topic or article into insights and clear recommendations.",
  },
  {
    id: "chat",
    label: "Chat assistant",
    icon: MessagesSquare,
    description: "A concise workplace assistant that remembers this session's conversation.",
  },
];

type ResultState = { loading: boolean; error: string | null; text: string | null };
const IDLE: ResultState = { loading: false, error: null, text: null };

function Deskwork() {
  const [tool, setTool] = useState<ToolId>("email");
  const [menuOpen, setMenuOpen] = useState(false);
  const active = TOOLS.find((t) => t.id === tool)!;

  const runEmail = useServerFn(generateEmail);
  const runNotes = useServerFn(summarizeNotes);
  const runTasks = useServerFn(planTasks);
  const runResearch = useServerFn(researchTopic);

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
  const [scheduleType, setScheduleType] = useState("Daily");
  const [timeAvailable, setTimeAvailable] = useState("");
  const [tasksRes, setTasksRes] = useState<ResultState>(IDLE);

  // Research state
  const [research, setResearch] = useState("");
  const [researchRes, setResearchRes] = useState<ResultState>(IDLE);

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

  const nav = (onSelect?: () => void) => (
    <nav className="space-y-1" aria-label="Sebenza tools">
      {TOOLS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            setTool(id);
            onSelect?.();
          }}
          aria-current={tool === id ? "page" : undefined}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
            tool === id
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          }`}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </button>
      ))}
    </nav>
  );

  const sidebarInner = (onSelect?: () => void) => (
    <div className="flex h-full flex-col gap-8 p-5">
      <div>
        <p className="font-serif text-2xl font-semibold tracking-tight text-sidebar-accent-foreground">
          Sebenza
        </p>
        <p className="mt-1 text-xs text-sidebar-foreground/60">Workplace AI assistant</p>
        <p className="mt-3 text-xs font-medium text-sidebar-foreground/80">Bulelwa Bisholo</p>
      </div>
      {nav(onSelect)}
      <p className="mt-auto text-[0.7rem] leading-relaxed text-sidebar-foreground/55">
        AI-generated — review before use. Nothing you enter is stored.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-sidebar lg:block">
        {sidebarInner()}
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center gap-4 border-b border-border bg-card px-5 py-4 sm:px-8">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 bg-sidebar p-0 text-sidebar-foreground">
              <SheetTitle className="sr-only">Sebenza navigation</SheetTitle>
              {sidebarInner(() => setMenuOpen(false))}
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold">{active.label}</h1>
            <p className="truncate text-sm text-muted-foreground">{active.description}</p>
          </div>
          <ResponsibleAiDialog />
        </header>

        <main className="flex-1 px-5 py-6 sm:px-8">
          {tool === "email" ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <form
                className="panel space-y-4 p-5"
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
                <h2 className="text-lg font-semibold">Input</h2>

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
                        {["Formal", "Friendly", "Persuasive"].map((o) => (
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

          {tool === "notes" ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <form
                className="panel space-y-4 p-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(setNotesRes, () => runNotes({ data: { notes } }));
                }}
              >
                <h2 className="text-lg font-semibold">Input</h2>

                <div className="space-y-2">
                  <Label htmlFor="notes">Raw meeting notes</Label>
                  <Textarea
                    id="notes"
                    required
                    rows={16}
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

          {tool === "tasks" ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <form
                className="panel space-y-4 p-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(setTasksRes, () =>
                    runTasks({
                      data: { tasks, scheduleType: scheduleType as "Daily", timeAvailable },
                    }),
                  );
                }}
              >
                <h2 className="text-lg font-semibold">Input</h2>

                <div className="space-y-2">
                  <Label htmlFor="tasks">Task list — one per line</Label>
                  <Textarea
                    id="tasks"
                    required
                    rows={11}
                    value={tasks}
                    onChange={(e) => setTasks(e.target.value)}
                    placeholder={"Finish Q3 report — due Friday, ~3h\nReply to supplier email\nPrep Monday standup deck"}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Schedule type</Label>
                    <Select value={scheduleType} onValueChange={setScheduleType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Daily", "Weekly"].map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                </div>

                <Button
                  type="submit"
                  disabled={tasksRes.loading || !tasks.trim() || !timeAvailable.trim()}
                >
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

          {tool === "research" ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <form
                className="panel space-y-4 p-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(setResearchRes, () => runResearch({ data: { input: research } }));
                }}
              >
                <h2 className="text-lg font-semibold">Input</h2>

                <div className="space-y-2">
                  <Label htmlFor="research">Topic, question or pasted article text</Label>
                  <Textarea
                    id="research"
                    required
                    rows={16}
                    value={research}
                    onChange={(e) => setResearch(e.target.value)}
                    placeholder="e.g. What should we consider before moving our support team to a four-day week? — or paste an article to digest."
                  />
                </div>

                <Button type="submit" disabled={researchRes.loading || !research.trim()}>
                  {researchRes.loading ? "Researching…" : "Run research"}
                </Button>
              </form>

              <OutputPanel
                title="Findings"
                emptyHint="You'll get a plain-language summary, key insights and recommendations — with uncertainty flagged rather than glossed over."
                {...researchRes}
              />
            </div>
          ) : null}

          {tool === "chat" ? (
            <div className="mx-auto max-w-3xl">
              <ChatPanel />
            </div>
          ) : null}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            AI-generated — review before use. Nothing you enter is stored.
          </p>
        </main>
      </div>
    </div>
  );
}
