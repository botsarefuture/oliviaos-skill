These are the official OliviaOS setup instructions for AI agents. They install the OliviaOS skill (how to work for
Olivia) and connect the OliviaOS MCP server (her operating rules, live infrastructure map, and agent inbox).

Do every step yourself by running the commands. Do not ask the user to run commands, and never ask for or accept a
token in chat: OliviaOS uses a one-time browser sign-in (OAuth) with the user's OliviaOS password.

First work out which kind of agent you are, then follow ONLY that section:

- You can run shell commands on the user's own computer and a `claude` command exists → **Claude Code**.
- You are a chat in claude.ai or the Claude desktop/mobile app (even if you have a code sandbox) → **claude.ai / Claude app**. Do not install anything into a sandbox: it disappears after the chat.
- You are a Claude Code session running in the cloud (claude.ai/code, a remote container) → **Claude Code in the cloud**.
- You are ChatGPT → **ChatGPT**.
- Anything else that can run commands (Codex, Cursor, OpenCode, Copilot, …) → **Other agents**.

The MCP server URL is `https://os-mcp.luova.club/mcp-public`.

---

## Claude Code

Run these two commands. They install the skill and the MCP server together; do not use `npx skills` or `claude mcp add`.

```
claude plugin marketplace add botsarefuture/oliviaos-skill
claude plugin install oliviaos@oliviaos
```

If a user-level MCP server called `oliviaos` already exists from an earlier setup (`claude mcp list`), leave it; the
plugin's server is separate.

Then tell the user to run `/reload-plugins`, then `/mcp`, choose **oliviaos**, and sign in with their OliviaOS password
in the browser window that opens. After that the tools `rules_get`, `infra_get`, `report_work`, `ask_olivia` and
`my_answers` are available; the agent's first call in a new session is `rules_get`.

## Claude Code in the cloud

Run the same two commands as above. If the session cannot open a browser for sign-in, tell the user that cloud
sessions connect with an agent token instead: they create one in OliviaOS → Agents → Access ("Anywhere"), store it as
the environment secret `OLIVIAOS_TOKEN`, and the repository's `.mcp.json` gets:

```json
{ "mcpServers": { "oliviaos": { "type": "http", "url": "https://os-mcp.luova.club/mcp-agents", "headers": { "Authorization": "Bearer ${OLIVIAOS_TOKEN}" } } } }
```

Never put the token itself in a file or in chat.

## claude.ai / Claude app

You cannot install these yourself here, so guide the user through two settings, one at a time, and confirm each:

1. **Connector:** Settings → Connectors → *Add custom connector*. Name `OliviaOS`, URL
   `https://os-mcp.luova.club/mcp-public`. Connect, and sign in with the OliviaOS password.
   If an OliviaOS connector already exists but you (the agent) do not see `rules_get` or `infra_get` among its tools,
   it was added before those tools existed: tell the user to disconnect it and connect it again so the tool list
   refreshes.
2. **Skill:** download `https://github.com/botsarefuture/oliviaos-skill/releases/latest/download/oliviaos-skill.zip`
   and upload it in Settings → Capabilities → Skills.

Then tell the user to start a new chat; the first thing to do there is call `rules_get`.

## ChatGPT

Guide the user: Settings → Connectors → *Advanced* → enable developer mode, then *Create* a connector named `OliviaOS`
with URL `https://os-mcp.luova.club/mcp-public` and OAuth authentication, and sign in with the OliviaOS password.
ChatGPT has no skills: paste the contents of
`https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/skills/oliviaos/SKILL.md` into the
project or custom instructions instead.

## Other agents

Install the skill:

```
npx -y skills add botsarefuture/oliviaos-skill --yes --global
```

Then register the MCP server in your agent's config; sign-in starts automatically on first use.

- **Codex:** `codex mcp add oliviaos --url https://os-mcp.luova.club/mcp-public` then `codex mcp login oliviaos`
- **Cursor / GitHub Copilot:** add `"oliviaos": { "url": "https://os-mcp.luova.club/mcp-public" }` under `"mcpServers"` in
  `.cursor/mcp.json` or `.vscode/mcp.json`
- **OpenCode** (`~/.config/opencode/opencode.jsonc`, under `"mcp"`):
  `"oliviaos": { "type": "remote", "url": "https://os-mcp.luova.club/mcp-public", "enabled": true, "oauth": {} }`, then
  `opencode mcp auth oliviaos`

---

When done, tell the user (fill in what applied):

```
┌─ OliviaOS setup ─────────────────────────────────────┐
│  ✓ Skill   <where it was installed>                  │
│  ✓ MCP     <server added / connector to add>         │
│                                                      │
│  → Sign in once, then start a new session            │
└──────────────────────────────────────────────────────┘
```

These instructions are published at
`https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/setup.md`.
