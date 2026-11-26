# oliviaos-guard

Turns the OliviaOS Rule (`~/.oliviaos/RULES.md`) from text into hooks, so no session has to remember it.

- **HARD STOPS denied**: live `/var/lib/pve-cluster/` access, `pkill -f` over SSH, daytime DB dumps on prod (08–23 Helsinki), prod reboots without `OLIVIAOS_HARD_RESTART=1`.
- **Auto-log**: successful state-changing Bash commands (remote systemctl/docker/qm/rm…, git push, rsync, scp, deploys) go to `~/.oliviaos/decisions.md` via `~/.oliviaos/scripts/log`, class `auto-logged`, secrets redacted.
- **Carry-forward**: every `Agent` and `start_session` brief gets the OliviaOS rule + caveman + model-tiering line if missing.
- **Status line**: `OliviaOS · N logged · N sent · M blocked · night`.
- **Autonomy, always**: a system-prompt section tells every session to decide reversible work itself. A question to Olivia (AskUserQuestion, blocking `ask_olivia`) that asks permission is refused unless it starts with `IRREVERSIBLE+LIVE:` and says why no backup is possible. Blocking `ask_olivia` with a `default_action` is turned non-blocking.
- **Night guard, 23:00–08:00 Helsinki**: AskUserQuestion, PushNotification and blocking `ask_olivia` are refused. Proactive file sends go quietly. A night section in the system prompt says: decide yourself, contain only (stop, pause, roll back), hold real decisions for the ~10:00 report.
