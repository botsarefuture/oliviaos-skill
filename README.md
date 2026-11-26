# OliviaOS skill

**Paste this one line into your AI** (Claude Code or any agent that can run commands):

```text
Install the OliviaOS skill: clone https://github.com/botsarefuture/oliviaos-skill to a temp dir, copy its skills/oliviaos folder to ~/.claude/skills/oliviaos (replace if present), delete the clone, then ask me for my OliviaOS MCP URL and token and run: claude mcp add --transport http --scope user oliviaos <URL> --header "Authorization: Bearer <TOKEN>" (remove an existing oliviaos server first; never echo the token).
```

A [Claude skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills) that makes an AI agent work the OliviaOS way:
load the operating rules, check the live infrastructure map before touching anything, report finished work, and ask
questions without stopping (permission by default, exact-words flag for research).

It expects an OliviaOS MCP server (tools `rules_get`, `infra_get`, `infra_observed`, `infra_upsert`, `report_work`,
`ask_olivia`, `my_answers`). Without that server it still describes the working style.

## Install

Quickest: paste [INSTALL_PROMPT.md](INSTALL_PROMPT.md) into your AI and it installs everything.

By hand:

Claude Code (all your projects):

```bash
git clone https://github.com/botsarefuture/oliviaos-skill.git
mkdir -p ~/.claude/skills && cp -r oliviaos-skill/skills/oliviaos ~/.claude/skills/
```

claude.ai / Claude app: zip the `skills/oliviaos` folder and upload it under Settings → Capabilities → Skills.

## Contents

- `skills/oliviaos/SKILL.md` — the skill.

No private details live here: hosts, addresses and credentials stay in OliviaOS itself.
