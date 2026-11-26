These are the official OliviaOS setup instructions for AI agents. OliviaOS is **one address**,
`https://os-mcp.luova.club`, that serves the tools (rules, live infrastructure map, agent inbox, job hunt and calendar)
and the OliviaOS skill (Skills over MCP).

Rules for every setup:

1. **Exactly one OliviaOS connection per app.** Look for existing OliviaOS entries first (connectors, plugins that bring
   an OliviaOS server, `claude mcp list`, agent config files). If one already points at the address and works, keep it
   and add nothing. Never ask the user to renew, reconnect or re-authenticate an old or duplicate entry: remove it with
   `https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/cleanup.md`.
2. **Account before computer.** With a Claude account, add the connector on the account: it then reaches claude.ai, the
   apps and Claude Code.
3. Do the steps you can do yourself. The user types the password or agent token themself in the browser sign-in page;
   never ask for, print or store it in chat.

Work out where you are and follow that section.

---

## Claude with a Claude account (claude.ai, Claude app, Claude Code)

If you can control a browser where the user is signed in to claude.ai, do the clicks and let the user type only the
password; otherwise guide them and confirm each step.

1. claude.ai → **Settings** → **Connectors** (or **Plugins** → **Add**) → **Add custom connector**.
2. Name `OliviaOS`, URL `https://os-mcp.luova.club` → **Add** → **Connect**.
3. Sign in on the OliviaOS page with the password or an agent token (OliviaOS → Agents → Access).

Claude reads the `oliviaos` skill from the connector. Nothing else to install: do **not** also add a plugin that brings an
OliviaOS server, and do not `claude mcp add` it.

In Claude Code check `claude mcp list`: one line `claude.ai OliviaOS … ✔ Connected`. In an interactive session on
2.1.331 or later, `/skills` shows `claude_ai_OliviaOS:oliviaos`.

Cloud sessions, `claude -p`, the Agent SDK and the desktop app's Code tab get the connector's tools but not its skill. If
the user works there, install the skill too: `claude plugin marketplace add botsarefuture/oliviaos-skill` then
`claude plugin install oliviaos@oliviaos` (skill only, no second server).

## Claude Code with an API key (no Claude account)

```bash
claude mcp add --transport http --scope user oliviaos https://os-mcp.luova.club
```

```bash
npx -y skills add botsarefuture/oliviaos-skill --yes --global --agent claude-code
```

Then the user runs `/mcp` → **oliviaos** → **Authenticate** and signs in in the browser. If `/skills` already shows
`oliviaos:oliviaos` from the server, skip the second command.

A machine that cannot open a browser uses an agent token: the user creates one in OliviaOS → Agents → Access, stores it
as the environment secret `OLIVIAOS_TOKEN`, and the repository's `.mcp.json` gets
`{ "mcpServers": { "oliviaos": { "type": "http", "url": "https://os-mcp.luova.club", "headers": { "Authorization": "Bearer ${OLIVIAOS_TOKEN}" } } } }`.

## ChatGPT

Guide the user: Settings → Connectors → *Advanced* → enable developer mode, then *Create* a connector named `OliviaOS`
with URL `https://os-mcp.luova.club` and OAuth, and sign in. If ChatGPT does not show the skill, paste the contents of
`https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/skills/oliviaos/SKILL.md` into the project or custom instructions.

## Other agents (Codex, Cursor, OpenCode, Copilot, …)

Register the server; sign-in starts on first use:

- **Codex:** `codex mcp add oliviaos --url https://os-mcp.luova.club` then `codex mcp login oliviaos`
- **Cursor:** `"oliviaos": { "url": "https://os-mcp.luova.club" }` under `"mcpServers"` in `.cursor/mcp.json`
- **VS Code / GitHub Copilot:** `"oliviaos": { "type": "http", "url": "https://os-mcp.luova.club" }` under `"servers"`
  in `.vscode/mcp.json`
- **OpenCode** (`~/.config/opencode/opencode.jsonc`, under `"mcp"`):
  `"oliviaos": { "type": "remote", "url": "https://os-mcp.luova.club", "enabled": true, "oauth": {} }`, then
  `opencode mcp auth oliviaos`

If the client does not load skills over MCP:

```bash
npx -y skills add botsarefuture/oliviaos-skill --yes --global
```

---

When done, tell the user (fill in what applied):

```
┌─ OliviaOS setup ─────────────────────────────────────┐
│  ✓ Server     https://os-mcp.luova.club (one entry)  │
│  ✓ Skill      <from the connector / installed>       │
│  ✓ Where      <Claude account / this computer>       │
│  → Start a new session                               │
└──────────────────────────────────────────────────────┘
```

These instructions are published at
`https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/setup.md`.
