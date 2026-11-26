These are the official OliviaOS setup instructions for AI agents. Everything comes as **one plugin**, `oliviaos`, from
the GitHub marketplace `botsarefuture/oliviaos-skill`. Adding it gives both parts at once:

- the **skill** (how to work for Olivia), and
- the **connector** to the OliviaOS MCP server `https://os-mcp.luova.club` (her rules, live infrastructure map, agent
  inbox). Sign-in is a one-time browser login with the OliviaOS password, or an agent token pasted instead of the
  password; agent tokens also work as `Authorization: Bearer`.

Rules for every setup:

1. **Account first.** If the user has a Claude account, both parts go on the **account** (claude.ai → Plugins), not on
   one computer. Then they work in claude.ai, the desktop and mobile apps, and Claude Code (terminal and cloud) wherever
   the user is signed in, and the plugin updates itself from GitHub.
2. **Exactly one OliviaOS connection per app.** Before adding anything, look for existing OliviaOS entries. Never ask the
   user to "renew", "reconnect" or re-authenticate an old or duplicate entry: remove it (see
   `https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/cleanup.md`) and keep the account one.
3. Do the steps you can do yourself. Never ask for, print or store a password or token in chat.

Work out where you are and follow that section.

---

## Any Claude (claude.ai, Claude app, Claude Code signed in with a Claude account)

One step in claude.ai, about a minute. If you can control a browser where the user is signed in to claude.ai, do the
clicks yourself and let the user type only the password; otherwise guide them and confirm each step.

claude.ai → **Plugins** → **Add** → **Add marketplace** → **Add from a repository** → `botsarefuture/oliviaos-skill`,
keep *Sync automatically* on → **Sync**. Open **Oliviaos** → **Add** → **Connect**, and sign in with the OliviaOS
password (or an agent token from OliviaOS → Agents → Access).

That is all: the skill and the connector are now on the account and reach claude.ai, the desktop and mobile apps, and
Claude Code (terminal and cloud) wherever the user is signed in, and they update themselves from GitHub.

In Claude Code, check with `claude mcp list` and `claude plugin list`: expect `claude.ai oliviaos … ✔ Connected` and the
plugin `oliviaos@synced`. Do **not** also install the plugin locally (`claude plugin install`) or add `oliviaos` with
`claude mcp add`; if an older local OliviaOS server or plugin exists, remove it with `cleanup.md`.

Known Claude Code issue (desktop app Code tab, anthropics/claude-code#105053): it may also list
`plugin:oliviaos:oliviaos` as "Needs authentication". That is the **same** server as `claude.ai oliviaos`, not an old
setup. Tell the user either to sign it in once (`/mcp` → `plugin:oliviaos:oliviaos` → **Authenticate**, same password
or token) or to disable it there; never present it as something to renew or as a second installation.

## Claude Code without a Claude account (API key login)

```
claude plugin marketplace add botsarefuture/oliviaos-skill
claude plugin install oliviaos@oliviaos
claude mcp add --transport http --scope user oliviaos https://os-mcp.luova.club
```

Then tell the user to run `/reload-plugins`, then `/mcp` → **oliviaos** → **Authenticate**, and sign in in the browser.
A cloud session that cannot open a browser uses an agent token instead: the user creates one in OliviaOS → Agents →
Access, stores it as the environment secret `OLIVIAOS_TOKEN`, and the repository's `.mcp.json` gets
`{ "mcpServers": { "oliviaos": { "type": "http", "url": "https://os-mcp.luova.club", "headers": { "Authorization": "Bearer ${OLIVIAOS_TOKEN}" } } } }`.

## ChatGPT

Guide the user: Settings → Connectors → *Advanced* → enable developer mode, then *Create* a connector named `OliviaOS`
with URL `https://os-mcp.luova.club` and OAuth, and sign in. ChatGPT has no skills: paste the contents of
`https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/skills/oliviaos/SKILL.md` into the
project or custom instructions.

## Other agents (Codex, Cursor, OpenCode, Copilot, …)

```
npx -y skills add botsarefuture/oliviaos-skill --yes --global
```

Then register the server; sign-in starts on first use:

- **Codex:** `codex mcp add oliviaos --url https://os-mcp.luova.club` then `codex mcp login oliviaos`
- **Cursor / GitHub Copilot:** `"oliviaos": { "url": "https://os-mcp.luova.club" }` under `"mcpServers"` in
  `.cursor/mcp.json` or `.vscode/mcp.json`
- **OpenCode** (`~/.config/opencode/opencode.jsonc`, under `"mcp"`):
  `"oliviaos": { "type": "remote", "url": "https://os-mcp.luova.club", "enabled": true, "oauth": {} }`, then
  `opencode mcp auth oliviaos`

---

When done, tell the user (fill in what applied):

```
┌─ OliviaOS setup ─────────────────────────────────────┐
│  ✓ Plugin     oliviaos (skill + connector)           │
│  ✓ Where      <Claude account / this computer>       │
│  ✓ One OliviaOS connection, no duplicates            │
│  → Start a new session                               │
└──────────────────────────────────────────────────────┘
```

These instructions are published at
`https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/setup.md`.
