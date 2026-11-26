# OliviaOS skill

## Install

Tell your AI:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/botsarefuture/oliviaos-skill/refs/heads/main/INSTALL.md
```

Or in a terminal:

```bash
npx skills add botsarefuture/oliviaos-skill
```

Then try:

- "Load the OliviaOS rules and tell me what is waiting for me."
- "What runs on moso-prod, and how do visitors reach it?"
- "Draft the intro for my report; ask me for anything that needs my exact words."

A [Claude skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills) that makes an AI agent work the OliviaOS way:
load the operating rules, check the live infrastructure map before touching anything, report finished work, and ask
questions without stopping (permission by default, exact-words flag for research).

It expects an OliviaOS MCP server (tools `rules_get`, `infra_get`, `infra_observed`, `infra_upsert`, `report_work`,
`ask_olivia`, `my_answers`). Without that server it still describes the working style.


## Contents

- `skills/oliviaos/SKILL.md` — the skill.
- `INSTALL.md` — step-by-step install written for an AI agent to follow.

No private details live here: hosts, addresses and credentials stay in OliviaOS itself.
