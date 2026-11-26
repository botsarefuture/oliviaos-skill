These are the official OliviaOS cleanup instructions for AI agents. They remove OliviaOS setups from before the
plugin (older MCP server entries, loose copies of the skill) so only the current plugin and connector remain.

Do the steps yourself by running the commands. Never ask for, print or handle a token. Work in this order and stop
where a step says stop.

## 1. Make sure the new setup works first

Run `claude mcp list` (Claude Code). The plugin's server `plugin:oliviaos:oliviaos` must show **Connected**.

If it is missing, set it up first by following
`https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/setup.md`. If it shows "Needs
authentication", stop and tell the user to run `/mcp`, choose **oliviaos** and sign in with their OliviaOS password,
then run this cleanup again. Never remove an old server while the new one is not connected: the old one may be the
only working access.

## 2. Find the old pieces (look, don't change yet)

Collect everything below that exists:

- **Old MCP servers:** in `claude mcp list`, any server whose name contains `oliviaos`, does **not** start with
  `plugin:`, and whose URL is **not** on `os-mcp.luova.club` (old setups used a home-network or tailnet address with
  `/mcp`). A server on `https://os-mcp.luova.club` is current: keep it. Note each old one's scope with
  `claude mcp get <name>` (user, local or project).
- **Loose skill copies** (the plugin already ships the skill): `~/.claude/skills/oliviaos`,
  `~/.agents/skills/oliviaos`, and `.claude/skills/oliviaos` in the current project. Note whether each is a symlink.
- **Other agents' configs** (Codex `~/.codex/config.toml`, Cursor `.cursor/mcp.json`, VS Code `.vscode/mcp.json`,
  OpenCode `~/.config/opencode/opencode.jsonc`): any `oliviaos` MCP entry whose URL is not on
  `os-mcp.luova.club`.

Show the user the list in one short message, then continue (no need to wait for a reply unless the list contains
something not described here).

## 3. Remove them

- Old MCP server: `claude mcp remove <name> -s <scope>` for each one found.
- Skill copy that is a **symlink**: remove only the link (`rm <path>`), never the folder it points to.
- Skill copy that is a **folder**: move it to the trash instead of deleting it (macOS: `mv <path> ~/.Trash/`;
  Linux: `mv <path> <path>.removed-$(date +%Y%m%d)`). For `~/.agents/skills/oliviaos` you can instead run
  `npx -y skills@latest remove oliviaos -g -y`.
- Other agents' configs: delete only the old `oliviaos` entry, keep the rest of the file, and back the file up first
  (`cp <file> <file>.bak-$(date +%Y%m%d)`).

## Never remove

- The plugin `oliviaos@oliviaos`, its marketplace `oliviaos`, and its server `plugin:oliviaos:oliviaos`.
- Anything named `oliviaos-guard` (a safety mod that enforces the OliviaOS rules).
- `~/.oliviaos/` or anything inside it (rules, decision log, backups, keys). Backups are never deleted.
- Certificates or settings such as `NODE_EXTRA_CA_CERTS`, and a repository's own `.mcp.json` when you are inside the
  oliviaos-skill repository itself.

## 4. Things only the user can do

Tell the user, briefly:

- In OliviaOS → Agents → Access, revoke agent tokens that the removed servers used and that nothing else needs.
- In claude.ai → Settings → Connectors, keep one OliviaOS connector; remove duplicates. If the one kept does not show
  `rules_get` and `infra_get`, disconnect and reconnect it.

Then check `claude mcp list` once more and report:

```
┌─ OliviaOS cleanup ───────────────────────────────────┐
│  ✓ Kept     plugin oliviaos (connected)              │
│  ✓ Removed  <old servers, skill copies>              │
│  → Revoke unused tokens in OliviaOS → Agents → Access │
└──────────────────────────────────────────────────────┘
```

These instructions are published at
`https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/cleanup.md`.
