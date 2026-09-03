# Sebenza AI Assitance

Build a web app called "Deskwork" — an AI-powered workplace productivity assistant with three tools, each on its own tab:

1. SMART EMAIL GENERATOR

Inputs: what the email is about (textarea), recipient type (dropdown: Client / Manager / Team / External partner), tone (dropdown: Formal / Persuasive / Informal), optional key points (textarea).

Output: a complete email with a "Subject:" line, greeting, body (120-180 words), and "[Your name]" sign-off. Match tone precisely. Never invent facts/dates not provided — use bracketed placeholders instead.

2. MEETING NOTES SUMMARIZER

Input: raw meeting notes (large textarea).

Output structured under exactly these headings: "Key discussion points", "Decisions made", "Action items" (format: Owner (or Unassigned): task — deadline (or No deadline given)), "Open questions or risks". Never invent owners or deadlines not stated in the notes.

3. TASK PLANNER

Inputs: task list, one per line, optionally with deadline/effort (textarea), and time available (text field).

Output under: "Priority order" (numbered, most urgent/important first, one-line reasoning each), "Time-blocked plan", "What to defer or delegate". Never invent deadlines not provided.

Design direction: clean professional workplace tool, not a marketing site. Warm paper/off-white background, deep teal accent color, serif headings paired with a clean sans-serif body font. Folder-tab style navigation for the three tools since they're distinct documents. Include a visible note: "AI-generated — review before use. Nothing you enter is stored."

Connect to Claude (Anthropic API) via a secure backend function so the API key is never exposed client-side.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sebenza-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/692d4c8f-c992-427b-8e09-655b19026874).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
