# Paste this into your AI

Copy everything in the box below and paste it into Claude Code (or any coding agent that can run shell commands).

```text
Install the OliviaOS skill for me.

1. Clone https://github.com/botsarefuture/oliviaos-skill into a temporary directory.
2. Copy its folder skills/oliviaos to ~/.claude/skills/oliviaos (create ~/.claude/skills if needed; if an oliviaos
   skill is already there, replace it), then delete the temporary clone.
3. Check that ~/.claude/skills/oliviaos/SKILL.md exists and show me its first lines.
4. Ask me for my OliviaOS MCP URL and agent token (I create the token in OliviaOS → Agents → Access).
   When I give them, add the server for all my projects with:
   claude mcp add --transport http --scope user oliviaos <URL> --header "Authorization: Bearer <TOKEN>"
   (if a server named oliviaos already exists, remove it first with: claude mcp remove oliviaos).
   Never print the token back to me or write it anywhere else.
5. Tell me to start a new session so the skill and the server load, and that the first thing the agent
   should do there is call rules_get.
```

For claude.ai or the Claude app: download this repo as a zip, zip the `skills/oliviaos` folder on its own, and upload
it under Settings → Capabilities → Skills; then add OliviaOS as a custom connector (URL from OliviaOS → Agents →
Access, sign in once).
