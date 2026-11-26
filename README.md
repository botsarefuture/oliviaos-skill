# OliviaOS

One address: **`https://os-mcp.luova.club`**. It serves both the OliviaOS tools (rules, live infrastructure map, agent
inbox, job hunt and calendar) and the OliviaOS **skill** (how to work for Olivia), using
[Skills over MCP](https://modelcontextprotocol.io/extensions/skills/overview).

## Connect

Tell your AI:

```text
Fetch and execute the appropriate instructions to set me up for OliviaOS from https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/setup.md
```

Or by hand:

| Where you use it | Do this | The skill |
|---|---|---|
| claude.ai, the Claude app, Claude Code signed in with a Claude account | claude.ai → add a **custom connector** named `OliviaOS` with the address → **Connect** | comes with the connector |
| Claude Code with an API key | `claude mcp add --transport http --scope user oliviaos https://os-mcp.luova.club`, then `/mcp` → oliviaos → **Authenticate** | install it, below |
| Codex, Cursor, OpenCode, other agents | add the address as a remote MCP server ([setup.md](setup.md)) | install it, below |

Sign in once with the OliviaOS password or an agent token (OliviaOS → Agents → Access).

**Where the connector does not deliver the skill** (yet, per Claude Code's docs): Claude Code cloud sessions, `claude -p`, the Agent SDK,
claude.ai connectors inside the desktop app's Code tab, API-key Claude Code and most other agents. The tools work there.
For the skill:

```bash
npx -y skills add botsarefuture/oliviaos-skill --yes --global
```

Skills over MCP is in beta and needs Claude Code 2.1.331 or later
([where Claude Code supports it](https://code.claude.com/docs/en/mcp#use-skills-from-mcp-servers)).

## The guard (Claude Code)

`oliviaos-guard` is a second plugin that enforces the OliviaOS rules in every Claude Code session: it blocks the hard
stops, logs and reports every state change and every block to the OliviaOS inbox, keeps agents from asking permission
for reversible work, and holds questions and notifications at night (23:00–08:00 Helsinki). It reads the rules live from
the connector's `rules_get`. Install it next to the connector:

```bash
claude plugin marketplace add botsarefuture/oliviaos-skill
claude plugin install oliviaos-guard@oliviaos
```

For a repository's cloud sessions, add to its `.claude/settings.json`:
`{ "extraKnownMarketplaces": { "oliviaos": { "source": { "source": "github", "repo": "botsarefuture/oliviaos-skill" } } }, "enabledPlugins": { "oliviaos-guard@oliviaos": true } }`

**Exactly one OliviaOS connection per app.** If there is an old or duplicate entry, remove it; never renew it:

```text
Fetch and execute the instructions to clean up my old OliviaOS setups from https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/cleanup.md
```

## Contents

- `skills/oliviaos/SKILL.md`: the skill (the same file the server serves).
- `setup.md`, `cleanup.md`: instructions for AI agents.
- `.claude-plugin/`: Claude Code marketplace. Plugin `oliviaos` is the skill only (no MCP server, so it cannot create a
  second connection). Plugin `oliviaos-guard` ([guard/](guard/)) enforces the OliviaOS rules in Claude Code.

No credentials live here: the server signs you in, and hosts, logins and keys stay in OliviaOS itself.
