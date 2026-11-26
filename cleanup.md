These are the official OliviaOS cleanup instructions for AI agents. Goal: **one** OliviaOS connection per app,
pointing at `https://os-mcp.luova.club`, and one copy of the skill. Remove extras; never renew or re-authenticate them.

Do the steps yourself. Never ask for, print or handle a password or token. Work in this order and stop where a step says
stop.

## 1. Pick the one to keep, and make sure it works

- With a Claude account: the **custom connector** `OliviaOS` (in `claude mcp list`: `claude.ai OliviaOS`).
- Without one, or in another agent: that app's own server entry on `https://os-mcp.luova.club`.

It must be **Connected** (and offer `rules_get`). If it is missing or not connected, set it up with `https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/setup.md`
first and stop until the user has signed in. Never remove another entry while the kept one is not connected: it may be
the only working access.

## 2. Find the extras (look, don't change yet)

- **Plugins that bring a second server:** an `oliviaos` plugin installed on the Claude account (claude.ai → Plugins; it
  shows in Claude Code as `oliviaos@synced` and `plugin:oliviaos:oliviaos`), or a local `oliviaos@oliviaos` older than
  version 2.0.0.
- **Other MCP entries** named like `oliviaos` in `claude mcp list` or in Codex (`~/.codex/config.toml`), Cursor
  (`.cursor/mcp.json`), VS Code (`.vscode/mcp.json`) or OpenCode (`~/.config/opencode/opencode.jsonc`) configs,
  including old home-network or tailnet addresses.
- **Duplicate skill copies:** `~/.claude/skills/oliviaos`, `~/.agents/skills/oliviaos`, the project's
  `.claude/skills/oliviaos`, the `oliviaos` skill plugin, or an uploaded skill in claude.ai. A copy is a duplicate only
  where the connector already delivers the skill. **Keep one** where it does not (cloud sessions, `claude -p`, desktop
  app Code tab, API key, other agents).

Show the user the list in one short message with what you will keep. Removing a plugin from the account or a skill copy
that may still be the only one somewhere: wait for their yes. Everything else: continue.

## 3. Remove them

- Account plugin: claude.ai → Plugins → **oliviaos** → remove the plugin. Keep the marketplace if `oliviaos-guard` is
  installed from it.
- Old local plugin: `claude plugin update oliviaos@oliviaos` (2.0.0 has no server), or uninstall it.
- Old MCP server: `claude mcp remove <name> -s <scope>` (scope from `claude mcp get <name>`).
- Skill copy that is a **symlink**: remove only the link (`rm <path>`), never the folder it points to.
- Skill copy that is a **folder**: move it to the trash (macOS: `mv <path> ~/.Trash/`; Linux:
  `mv <path> <path>.removed-$(date +%Y%m%d)`).
- Other agents' configs: back the file up (`cp <file> <file>.bak-$(date +%Y%m%d)`), then delete only the extra entry.

## Never remove

- The kept connection from step 1.
- `oliviaos-guard` (a safety mod that enforces the OliviaOS rules) or the marketplace it was installed from.
- `~/.oliviaos/` or anything inside it (rules, decision log, backups, keys). Backups are never deleted.
- Certificates or settings such as `NODE_EXTRA_CA_CERTS`.

## 4. Report

Tell the user to revoke agent tokens (OliviaOS → Agents → Access) that only removed entries used, then check
`claude mcp list` once more and report:

```
┌─ OliviaOS cleanup ───────────────────────────────────┐
│  ✓ Kept     <the one connection>                     │
│  ✓ Removed  <extras>                                 │
│  → Revoke unused tokens in OliviaOS → Agents → Access │
└──────────────────────────────────────────────────────┘
```

These instructions are published at
`https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/cleanup.md`.
