# Installing the OliviaOS skill (instructions for the AI agent)

You are installing the OliviaOS skill for the person you are talking to. Do these steps in order and keep them informed briefly.

1. **Install the skill.** Run:

   ```bash
   npx -y skills@latest add botsarefuture/oliviaos-skill -g -y
   ```

   If `npx` is not available, install it by hand instead: clone `https://github.com/botsarefuture/oliviaos-skill` into a
   temporary directory, copy its `skills/oliviaos` folder to `~/.claude/skills/oliviaos` (replace an existing one), and
   delete the clone.

2. **Check it.** Confirm a `SKILL.md` for `oliviaos` now exists (under `~/.claude/skills/oliviaos` or
   `~/.agents/skills/oliviaos`) and show its first three lines.

3. **Connect OliviaOS.** Ask for two things: their OliviaOS MCP URL and an agent token (they create both in
   OliviaOS → Agents → Access). Then add the server for all their projects. For Claude Code:

   ```bash
   claude mcp remove oliviaos 2>/dev/null; claude mcp add --transport http --scope user oliviaos <URL> --header "Authorization: Bearer <TOKEN>"
   ```

   For another agent, add an HTTP MCP server named `oliviaos` with that URL and the header
   `Authorization: Bearer <TOKEN>` in its MCP settings. Never print the token back, never write it anywhere else, and
   never commit it.

4. **Finish.** Tell them to start a new session so the skill and server load, and that the agent's first step there is
   `rules_get`.

For claude.ai or the Claude app (no terminal): zip the `skills/oliviaos` folder, upload it under Settings →
Capabilities → Skills, and add OliviaOS as a custom connector with the sign-in URL from OliviaOS → Agents → Access.
