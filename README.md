# OliviaOS skill

## Install

Tell your AI:

```text
Fetch and execute the appropriate instructions to set me up for OliviaOS from https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/setup.md
```

Or by hand, once, on your Claude account (skill + connector together, works everywhere you're signed in, updates
itself): claude.ai → **Plugins** → **Add** → **Add marketplace** → **Add from a repository** →
`botsarefuture/oliviaos-skill` → open **Oliviaos** → **Add** → **Connect**.

Claude Code with an API key instead of a Claude account:

```bash
claude plugin marketplace add botsarefuture/oliviaos-skill
claude plugin install oliviaos@oliviaos
```

Then sign in once (`/mcp` → oliviaos) and try:

- "Load the OliviaOS rules and tell me what is waiting for me."
- "What runs on moso-prod, and how do visitors reach it?"
- "Draft the intro for my report; ask me for anything that needs my exact words."

## Clean up old setups

Already had OliviaOS set up before the plugin? Tell your AI:

```text
Fetch and execute the instructions to clean up my old OliviaOS setups from https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/cleanup.md
```

It keeps the plugin, removes older server entries and loose skill copies only after the plugin is signed in, and never
touches `~/.oliviaos` or backups.

A [Claude skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills) that makes an AI agent work the OliviaOS way:
load the operating rules, check the live infrastructure map before touching anything, report finished work, and ask
questions without stopping (permission by default, exact-words flag for research).

It expects an OliviaOS MCP server (tools `rules_get`, `infra_get`, `infra_observed`, `infra_upsert`, `report_work`,
`ask_olivia`, `my_answers`). Without that server it still describes the working style.


## Contents

- `skills/oliviaos/SKILL.md` — the skill.
- `setup.md` — setup instructions for AI agents, one section per kind of agent.
- `cleanup.md` — removes pre-plugin OliviaOS setups safely.
- `.claude-plugin/` + `.mcp.json` — Claude Code plugin: the skill plus the OliviaOS MCP server (OAuth sign-in).

No credentials live here: the MCP server signs you in with your OliviaOS password, and hosts, logins and keys stay in OliviaOS itself.
