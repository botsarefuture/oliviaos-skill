import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

// OliviaOS guard: turns ~/.oliviaos/RULES.md from text into hooks.
// 1. Bash HARD STOPS are denied with the reason and what to do instead.
// 2. State-changing Bash commands that succeed are auto-logged to
//    ~/.oliviaos/decisions.md (secrets redacted, class "auto-logged").
// 3. Agent / start_session briefs get the OliviaOS carry-forward line.
// 2b. Each auto-logged change is also sent to OliviaOS (report_work), one
//     report per command; unsent ones queue and go with the next send.
// 4. Every block is logged and reported too (class "blocked"), so Olivia sees
//    what the guard stopped and why.
// 5. Rules come live from the OliviaOS skill's MCP (rules_get), falling back
//    to ~/.oliviaos/RULES.md, and go into every session's system prompt.
// 6. Status line: "OliviaOS · N logged · N sent · M blocked · night".
// Blocks stay to what the rules need: a read-only look, a safe pattern or
// Olivia being awake lets the command or question through.

const logged = atom({ plugin: 'oliviaos-guard', key: 'logged' } as const, 0, { shape: 'n-1' })
type Report = { title: string; summary: string; what: string; project: string; cls?: string; revert?: string }
const pending = atom({ plugin: 'oliviaos-guard', key: 'pending' } as const, [] as Report[], { shape: 'reports-1' })
const sent = atom({ plugin: 'oliviaos-guard', key: 'sent' } as const, 0, { shape: 'n-1' })
const blocked = atom({ plugin: 'oliviaos-guard', key: 'blocked' } as const, 0, { shape: 'n-1' })

export const CARRY =
  'Follow the OliviaOS Rule in `~/.oliviaos/RULES.md` — decide by reversibility × reach, ' +
  'make irreversible things reversible then do them, ask only for irreversible+Live. ' +
  'Log state changes via `~/.oliviaos/scripts/log`. Use caveman voice. Follow model tiering.'

const PROD = /\b(moso-prod|lc-main|lc-db|lc-email|ax41|xeon|prod)\b/i
const SSH = /\bssh\b/
const PVE_TOUCH = /\b(sqlite3|cp|mv|rm|rsync|tar|dd|tee|truncate|vi|vim|nano)\b|sed\s+-i|>\s*\/var\/lib\/pve-cluster/

// ---------- helpers (exported for tests) ----------

export function helsinkiHour(now: Date = new Date()): number {
  try {
    const h = now.toLocaleString('en-GB', { timeZone: 'Europe/Helsinki', hour: '2-digit', hour12: false })
    const n = parseInt(h, 10)
    if (!Number.isNaN(n)) return n % 24
  } catch {}
  // Fallback: EET/EEST approximation (UTC+2 Nov–Mar, UTC+3 Apr–Oct).
  const m = now.getUTCMonth()
  const off = m >= 3 && m <= 9 ? 3 : 2
  return (now.getUTCHours() + off) % 24
}

export const isNight = (hour: number) => hour >= 23 || hour < 8

/** Returns a deny reason when the command hits a HARD STOP, else undefined. */
export function hardStop(cmd: string, hour: number): string | undefined {
  // Reading is fine (ls, cat, stat, grep). Opening the db or writing into the folder is what locked pmxcfs.
  if (/\/var\/lib\/pve-cluster\//.test(cmd) && SSH.test(cmd) && PVE_TOUCH.test(cmd))
    return 'HARD STOP: never open or write /var/lib/pve-cluster/*.db live (2026-11-20 sqlite lock caused a cluster outage). Reading the folder (ls, stat) is fine. Use Proxmox tooling (vzdump, pvesh, qm config) instead.'

  // pkill -f over SSH matches the remote shell that carries the pattern, so it kills its own session.
  // A bracketed pattern ('[n]ode') cannot match itself and is safe.
  const pk = /\bpkill\s+(?:-\S+\s+)*?-\S*f\S*\s+(?:-\S+\s+)*['"]?([^\s'";&|]+)/.exec(cmd)
  const pat = pk?.[1] ?? ''
  if (SSH.test(cmd) && pat && !/\[[^\]]+\]/.test(pat))
    return `HARD STOP: \`pkill -f ${pat}\` over SSH also matches the remote shell running it and kills your own session. Use a bracketed pattern that cannot match itself (pkill -f '[${pat.slice(0, 1)}]${pat.slice(1)}'), a PID from pgrep -a, or systemctl stop <unit>.`

  if (SSH.test(cmd) && PROD.test(cmd) && /\b(mongodump|pg_dump|pg_dumpall|mysqldump)\b/.test(cmd) && !isNight(hour))
    return `HARD STOP: no daytime DB dumps on production (it took the site down). It is ${hour}:00 Helsinki. Run it 23:00–08:00, or dump from a replica/snapshot.`

  if (
    SSH.test(cmd) && PROD.test(cmd) &&
    /\b(reboot|shutdown\s+-r|systemctl\s+reboot|qm\s+reboot|qm\s+reset|pct\s+reboot)\b/.test(cmd) &&
    !/OLIVIAOS_HARD_RESTART=1/.test(cmd)
  )
    return 'PROD UPTIME: reboot is the last resort. Try reload/graceful restart first. If the box is truly wedged, log why with ~/.oliviaos/scripts/log, then rerun with `OLIVIAOS_HARD_RESTART=1` in the command.'

  return undefined
}

const REMOTE_CHANGE =
  /\b(systemctl\s+(restart|reload|stop|start|enable|disable|daemon-reload)|docker(\s+compose|-compose)?\s+(up|down|restart|rm|stop|run|pull)|qm\s+(set|resize|start|stop|shutdown|create|destroy|migrate|snapshot|rollback)|pct\s+(set|start|stop|create|destroy|snapshot|rollback)|rm\s|mv\s|sed\s+-i|tee\s|apt(-get)?\s+(install|remove|purge|upgrade)|useradd|userdel|usermod|chmod|chown|crontab|ufw|iptables|nft\s|zfs\s+(create|destroy|snapshot|rollback|set)|kill\s)/
const LOCAL_CHANGE =
  /(^|[;&|]\s*)(git(\s+-C\s+\S+)?\s+push|rsync\s|scp\s|systemctl\s+(restart|reload|stop|start|enable|disable)|docker\s+compose\s+(up|down|restart)|qm\s|pct\s|wrangler\s+deploy|gh\s+pr\s+merge)/

/** True when a Bash command changes state somewhere that the decision log should know about. */
export function isStateChange(cmd: string): boolean {
  if (/\.oliviaos\/scripts\/log\b/.test(cmd)) return false // already logging itself
  if (SSH.test(cmd) && REMOTE_CHANGE.test(cmd)) return true
  return LOCAL_CHANGE.test(cmd)
}

/** Strips secrets before anything reaches the log. */
export function redact(s: string): string {
  return s
    .replace(/(authorization:\s*bearer\s+)\S+/gi, '$1[REDACTED]')
    .replace(/(bearer\s+)[A-Za-z0-9._~+/=-]{8,}/gi, '$1[REDACTED]')
    .replace(/\b([A-Z0-9_]*(TOKEN|SECRET|PASSWORD|PASSWD|PASS|KEY|APIKEY|API_KEY|AUTH)[A-Z0-9_]*)=("[^"]*"|'[^']*'|\S+)/gi, '$1=[REDACTED]')
    .replace(/([?&](token|key|secret|password|pass|auth|sig)=)[^&\s'"]+/gi, '$1[REDACTED]')
    .replace(/(-p|--password[= ])\S+/g, '$1[REDACTED]')
    .replace(/\b(ghp|gho|ghs|github_pat|sk|xox[abp]|glpat|cf)[-_][A-Za-z0-9_-]{10,}\b/g, '[REDACTED]')
    .replace(/:\/\/([^:/@\s]+):[^@\s]+@/g, '://$1:[REDACTED]@')
    .replace(/\b[a-f0-9]{32,}\b/gi, '[REDACTED-HEX]')
    .replace(/[A-Za-z0-9+_-]{32,}={0,2}/g, t => (/[0-9]/.test(t) && /[A-Z]/.test(t) && /[a-z]/.test(t) ? '[REDACTED-KEY]' : t))
}

export function withCarry(prompt: string): string {
  return /RULES\.md|OliviaOS Rule/.test(prompt) ? prompt : `${prompt}\n\n${CARRY}`
}


// ---------- night + autonomy ----------

export const AUTONOMY =
  'OliviaOS autonomy (enforced by the oliviaos-guard mod): think for yourself and act. ' +
  'Decide by reversibility × reach. Reversible → do it, report after. Irreversible → first make it reversible ' +
  '(backup to ~/.oliviaos/backups, snapshot, second way in), then do it. Only irreversible + Live (real people, money, ' +
  'production data, auth) with no possible backup is a question for Olivia. "It is risky" is not a reason to ask. ' +
  'Never end with "want me to…?" / "should I…?" for reversible work: just do it. A pending question never idles you: ' +
  'use ask_olivia with a default_action and carry on. To ask anyway, start the question with "IRREVERSIBLE+LIVE:" ' +
  'and say why no backup or fallback is possible.'

export const NIGHT =
  'It is night in Helsinki (23:00–08:00). Olivia is asleep and must not be woken or asked for approval ' +
  '(tired = yes to everything = no real check). AskUserQuestion, PushNotification and blocking ask_olivia are ' +
  'refused until 08:00. Decide everything yourself by the OliviaOS Rule. For irreversible + Live work do only ' +
  'immediate reversible containment (stop, pause, roll back) and hold the real decision for the ~10:00 report: ' +
  'put it in report_work and a non-blocking ask_olivia with your default_action. Rather the site down overnight ' +
  'than Olivia woken.'

const ASKS_PERMISSION =
  /\b(should i|shall i|want me to|ok to|okay to|can i go ahead|go ahead and|ok if i|is it ok|mind if i|would you like me to|do you want me to|shall we|should we)\b/i
const LABEL = /IRREVERSIBLE\+LIVE/

/** Deny reason for a question to Olivia, or undefined to let it through. */
export function questionVerdict(texts: string[], night: boolean, awake = false): string | undefined {
  const all = texts.join(' \n ')
  const asks = ASKS_PERMISSION.test(all) || LABEL.test(all)
  // At night a factual question while Olivia is chatting wakes nobody; approvals still wait (tired = yes).
  if (night && !(awake && !asks))
    return 'NIGHT GUARD: Olivia is asleep (23:00–08:00 Helsinki). Do not ask her. Decide yourself by the OliviaOS Rule: reversible → do it; irreversible + Live → only containment (stop, pause, roll back) and hold it for the ~10:00 report via report_work and a non-blocking ask_olivia with a default_action.'
  if (!night && ASKS_PERMISSION.test(all) && !LABEL.test(all))
    return 'AUTONOMY: this asks Olivia for permission. Under the OliviaOS Rule you decide reversible work yourself: do it and report after. If it truly is irreversible + Live with no backup or fallback possible, ask again with the question starting "IRREVERSIBLE+LIVE:" and why no backup is possible. Otherwise use ask_olivia with a default_action and carry on.'
  return undefined
}

// ---------- hooks ----------

let cwd = ''
let lastPromptAt = 0
let liveRules = ''
let rulesFromMcp = false
let rulesTriedAt = 0
const AWAKE_MS = 20 * 60 * 1000
const awakeNow = () => Date.now() - lastPromptAt < AWAKE_MS

/** Live rules: OliviaOS rules_get first, then ~/.oliviaos/RULES.md. */
async function loadRules($: EngineInterface): Promise<string> {
  rulesTriedAt = Date.now()
  for (const name of await serversWith($, 'rules_get')) {
    try {
      // connect() waits for a server that is still starting, so the first prompt gets the live rules.
      const c: any = await $.mcp.connect(name)
      const server = c?.server ?? name
      const res = await $.mcp.call(server, 'rules_get', {})
      if (!res.isError) {
        const text = res.content.map((c: any) => (c.type === 'text' ? c.text : '')).join('')
        let rules = text
        try { rules = JSON.parse(text).rules ?? text } catch {}
        if (rules.length > 200) { rulesFromMcp = true; return rules }
      }
    } catch {}
  }
  try {
    const home = (await $.env.get('HOME')) ?? ''
    return await $.fs.read(`${home}/.oliviaos/RULES.md`)
  } catch {}
  return ''
}

/** Writes one entry to decisions.md and queues it for OliviaOS. */
async function record($: EngineInterface, r: { title: string; what: string; cls: string; revert: string; summary: string }) {
  try {
    const home = (await $.env.get('HOME')) ?? ''
    await $.process.run([`${home}/.oliviaos/scripts/log`, r.title, r.cls, '', r.revert], { timeoutMs: 5000 })
  } catch {}
  const project = cwd.split('/').filter(Boolean).pop() ?? ''
  await update($, pending, q => [...q, { title: r.title.slice(0, 200), summary: r.summary, what: r.what, project, cls: r.cls, revert: r.revert }])
  try { await flush($) } catch {}
}

async function refuse($: EngineInterface, why: string, what: string) {
  await update($, blocked, n => n + 1)
  const w = redact(what).replace(/\s+/g, ' ').slice(0, 300)
  await record($, {
    title: `[blocked] ${w}`,
    what: w,
    cls: 'blocked',
    revert: 'nothing ran',
    summary: `oliviaos-guard blocked this (secrets redacted). Nothing ran.\n\nWhat: ${w}\n\nWhy: ${why}`,
  })
  await refresh($)
  return { deny: `oliviaos-guard: ${why}` }
}

async function refresh($: EngineInterface) {
  const n = await read($, logged)
  const b = await read($, blocked)
  const s = await read($, sent)
  const q = (await read($, pending)).length
  const night = isNight(helsinkiHour()) ? ' · night' : ''
  const queued = q > 0 ? ` (${q} queued)` : ''
  $.ui.status(`OliviaOS · ${n} logged · ${s} sent${queued} · ${b} blocked${night}`)
}

export function reportArgs(r: Report) {
  return {
    title: r.title,
    summary: r.summary,
    decisions: [{ what: r.what, class: r.cls ?? 'auto-logged', revert: r.revert ?? 'see command; the agent adds a proper entry if this mattered' }],
    session: 'oliviaos-guard',
    place: 'mac',
    project: r.project,
  }
}

// The OliviaOS MCP server's name depends on how it was added: the plugin, claude.ai connector, or a plain entry.
const SERVERS = ['plugin:oliviaos:oliviaos', 'claude.ai oliviaos', 'oliviaos']

/** Every connected server that has the tool, by the tool list (mcp__<server>__<tool>), then the known names. */
async function serversWith($: EngineInterface, tool: string): Promise<string[]> {
  const found: string[] = []
  try {
    for (const t of await $.tool.list()) {
      const m = /^mcp__(.+)__([^_].*)$/.exec(t.name)
      if (m && m[2] === tool && m[1]) found.push(m[1])
    }
  } catch {}
  return [...new Set([...found, ...SERVERS])]
}

/** Sends every queued report to OliviaOS; keeps the ones that fail. */
async function flush($: EngineInterface) {
  const queue = await read($, pending)
  const left: Report[] = []
  for (const r of queue) {
    let ok = false
    for (const server of await serversWith($, 'report_work')) {
      try {
        const res = await $.mcp.call(server, 'report_work', reportArgs(r))
        if (!res.isError) { ok = true; break }
        $.ui.log(`oliviaos-guard: report_work via ${server} failed: ${JSON.stringify(res.content).slice(0, 300)}`, { to: 'debug' })
      } catch (err) {
        $.ui.log(`oliviaos-guard: report_work via ${server} threw: ${String(err).slice(0, 300)}`, { to: 'debug' })
      }
    }
    if (ok) { await update($, sent, n => n + 1); $.ui.log('oliviaos-guard: report_work sent', { to: 'debug' }) }
    else left.push(r)
  }
  await update($, pending, () => left.slice(-200))
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    lastPromptAt = Date.now()
    return next(e)
  }).catch(($, e, next) => next(e))

  on('session.start', async ($, e, next) => {
    cwd = e.cwd ?? ''
    const started = await next(e)
    await refresh($)
    void loadRules($).then(r => { liveRules = r }).catch(() => {})
    return started
  })

  // 1 + 2: Bash guard and auto-log.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const cmd = e.command
    const stop = hardStop(cmd, helsinkiHour())
    if (stop) return refuse($, stop, cmd)

    const ran = await next(e)
    if (ran.deny === undefined && ran.isError !== true && isStateChange(cmd)) {
      try {
        const what = redact(e.description ? `${e.description}: ${cmd}` : cmd).replace(/\s+/g, ' ').slice(0, 300)
        await update($, logged, n => n + 1)
        await record($, {
          title: `[auto] ${what}`,
          what,
          cls: 'auto-logged',
          revert: 'see command; the agent adds a proper entry if this mattered',
          summary: `oliviaos-guard auto-logged a state-changing command that succeeded (secrets redacted). Also in ~/.oliviaos/decisions.md.\n\n${what}`,
        })
        await refresh($)
      } catch {
        // Never break a tool call over logging.
      }
    }
    return ran
  }).catch(($, e, next) => (next.called ? next(e) : { deny: 'oliviaos-guard: its guard failed; retry the command.' }))

  // 3: carry the rule into subagent and session briefs.
  on('tool.call', async ($, e: any, next) => {
    const isBrief = e.tool === 'Agent' || e.tool === 'mcp__ccd_session__start_session'
    if (typeof e.tool === 'string' && /oliviaos.*__ask_olivia$/.test(e.tool) && e.blocking === true) {
      const why = questionVerdict([String(e.question ?? '')], isNight(helsinkiHour()))
      if (why) {
        if (!e.default_action) return refuse($, `${why} Re-send ask_olivia with blocking false and a default_action.`, `ask_olivia (blocking): ${e.question ?? ''}`)
        return next({ ...e, blocking: false })
      }
    }
    if (isBrief && typeof e.prompt === 'string' && e.prompt.length > 0) {
      return next({ ...e, prompt: withCarry(e.prompt) })
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  // 5: autonomy always, night rules 23–08 Helsinki, in the system prompt.
  on('prompt.compose', async ($, e, next) => {
    if (!rulesFromMcp) {
      const t = await loadRules($)
      if (t) liveRules = t
    }
    const r = await next(e)
    // The MCP server often connects after session.start: retry for the live rules, at most every 10 s.
    if (!rulesFromMcp && Date.now() - rulesTriedAt > 10_000) void loadRules($).then(t => { if (t) liveRules = t }).catch(() => {})
    const extra = [{ id: 'oliviaos-guard:autonomy', text: AUTONOMY, scope: 'session' as const }]
    if (liveRules) extra.push({ id: 'oliviaos-guard:rules', text: `# OliviaOS rules (live, from the OliviaOS skill's rules_get)\n\n${liveRules}`, scope: 'session' as const })
    if (isNight(helsinkiHour())) extra.push({ id: 'oliviaos-guard:night', text: awakeNow() ? `${NIGHT} Olivia is chatting right now, so a plain factual question is fine; approvals still wait for the morning.` : NIGHT, scope: 'session' as const })
    return { ...r, sections: [...r.sections, ...extra] }
  }).catch(($, e, next) => next(e))

  // 6: questions, pings and wake-ups.
  on('tool.call', { tool: 'AskUserQuestion' }, async ($, e, next) => {
    const texts = (e.questions ?? []).map(q => q.question ?? '')
    const why = questionVerdict(texts, isNight(helsinkiHour()), awakeNow())
    return why ? refuse($, why, `AskUserQuestion: ${texts.join(' | ')}`) : next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'PushNotification' }, async ($, e, next) =>
    isNight(helsinkiHour()) && !awakeNow()
      ? refuse($, 'NIGHT GUARD: no phone notifications 23:00–08:00 Helsinki. Put it in report_work for the ~10:00 report. Contain the problem yourself (stop, pause, roll back).', `PushNotification: ${e.message ?? ''}`)
      : next(e),
  ).catch(($, e, next) => next(e))

  on('tool.call', { tool: 'SendUserFile' }, async ($, e, next) =>
    isNight(helsinkiHour()) && !awakeNow() && e.status === 'proactive' ? next({ ...e, status: 'normal' }) : next(e),
  ).catch(($, e, next) => next(e))
}
