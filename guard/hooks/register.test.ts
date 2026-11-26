import { expect, test } from 'claude-code/testing'
import { hardStop, isStateChange, redact, withCarry, CARRY, reportArgs, questionVerdict as qv, isNight } from './register'

const DAY = 14
const NIGHT = 2

test('hard stops deny the dangerous, allow the ordinary', async () => {
  expect(hardStop(`ssh root@10.0.0.1 'sqlite3 /var/lib/pve-cluster/config.db .backup x'`, DAY)).toMatch(/pve-cluster/)
  expect(hardStop('ls /var/lib', DAY)).toBe(undefined)
  expect(hardStop(`ssh h 'ls -la /var/lib/pve-cluster/'`, DAY)).toBe(undefined)
  expect(hardStop(`ssh h 'cp /var/lib/pve-cluster/config.db /tmp/'`, DAY)).toMatch(/HARD STOP/)
  expect(hardStop(`ssh h "pkill -f '[n]ode server'"`, DAY)).toBe(undefined)
  expect(hardStop(`ssh h 'pkill -f node'`, DAY)).toMatch(/\[n\]ode/)
  expect(hardStop('pkill -f node', DAY)).toBe(undefined)
  expect(hardStop(`ssh host 'pkill -f sshd'`, DAY)).toMatch(/pkill -f/)
  expect(hardStop(`ssh moso-prod 'mongodump --out /tmp/x'`, DAY)).toMatch(/daytime DB dumps/)
  expect(hardStop(`ssh moso-prod 'mongodump --out /tmp/x'`, NIGHT)).toBe(undefined)
  expect(hardStop(`ssh lc-main reboot`, DAY)).toMatch(/last resort/)
  expect(hardStop(`ssh lc-main 'OLIVIAOS_HARD_RESTART=1 reboot'`, DAY)).toBe(undefined)
  expect(hardStop(`ssh homelab-dev reboot`, DAY)).toBe(undefined)
})

test('only state changes get logged', async () => {
  expect(isStateChange('ssh host uptime')).toBe(false)
  expect(isStateChange('ssh lc-main systemctl status nginx')).toBe(false)
  expect(isStateChange(`ssh lc-main 'systemctl reload nginx'`)).toBe(true)
  expect(isStateChange('git push origin main')).toBe(true)
  expect(isStateChange('cd x && git push')).toBe(true)
  expect(isStateChange('git status')).toBe(false)
  expect(isStateChange('git -C /x push -q origin main')).toBe(true)
  expect(isStateChange('rm -rf node_modules')).toBe(false)
  expect(isStateChange(`~/.oliviaos/scripts/log "x" "y"`)).toBe(false)
})

test('secrets never reach the log', async () => {
  const tok = '0123456789abcdef'.repeat(4)
  expect(redact(`curl -H "Authorization: Bearer ${tok}" https://x`)).not.toContain(tok)
  expect(redact(`TOKEN=${tok} ./deploy`)).not.toContain(tok)
  expect(redact(`echo ${tok}`)).not.toContain(tok)
  expect(redact('MONGO_PASSWORD=hunter2 run')).not.toContain('hunter2')
  expect(redact('mongodb://admin:s3cret@db:27028')).not.toContain('s3cret')
  expect(redact('https://x/api?token=abc123def&x=1')).not.toContain('abc123def')
  const path = '/Users/someone/Library/Application Support/Claude/scratch-workspaces/x'
  expect(redact(`rsync ${path} host:`)).toContain('someone/Library/Application')
})

test('briefs carry the rule once', async () => {
  expect(withCarry('Fix the bug.')).toContain(CARRY)
  const has = 'Follow the OliviaOS Rule in ~/.oliviaos/RULES.md. Fix it.'
  expect(withCarry(has)).toBe(has)
})

test('the Bash hook refuses a hard stop', async ($, on) => {
  on('tool.call', () => ({ result: {} }))
  const r: any = await $.tool.call({ tool: 'Bash', command: `ssh h 'pkill -f sshd'` } as any)
  expect(JSON.stringify(r)).toMatch(/HARD STOP/)
})

test('Agent briefs get the carry-forward line', async ($, on) => {
  let seen = ''
  on('tool.call', (_, e: any) => { seen = e.prompt; return { result: {} } })
  await $.tool.call({ tool: 'Agent', description: 'x', prompt: 'Fix the bug.' } as any)
  expect(seen).toContain(CARRY)
})

test('pve path in a local grep is not a hard stop', async () => {
  expect(hardStop('grep -n /var/lib/pve-cluster/ ~/.oliviaos/RULES.md', 14)).toBe(undefined)
})

test('report_work args fit the OliviaOS schema', async () => {
  const a = reportArgs({ title: 't', summary: 's', what: 'w', project: 'p' })
  expect(a.place).toBe('mac')
  expect(a.decisions[0]?.class).toBe('auto-logged')
})

test('a state change is logged and sent to OliviaOS', async ($, on) => {
  const calls: any[] = []
  on('tool.call', () => ({ result: {} }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  on('env.get', () => ({ value: '/Users/x' }))
  on('mcp.call', (_, e: any) => { calls.push(e); return { value: { content: [], isError: false } } })
  await $.tool.call({ tool: 'Bash', command: 'git push origin main', description: 'push' } as any)
  expect(JSON.stringify(calls)).toMatch(/report_work/)
})

test('night: every question is refused; day: only permission-asking ones', async () => {
  expect(qv(['Which database is the source of truth?'], true)).toMatch(/NIGHT GUARD/)
  expect(qv(['Which database is the source of truth?'], true, true)).toBe(undefined)
  expect(qv(['Should I restart nginx?'], true, true)).toMatch(/NIGHT GUARD/)
  expect(qv(['Which approach do you want?'], false)).toBe(undefined)
  expect(qv(['Which database is the source of truth?'], false)).toBe(undefined)
  expect(qv(['Should I restart nginx?'], false)).toMatch(/AUTONOMY/)
  expect(qv(['Want me to build it?'], false)).toMatch(/AUTONOMY/)
  expect(qv(['IRREVERSIBLE+LIVE: delete prod users table? No export possible.'], false)).toBe(undefined)
  expect(qv(['IRREVERSIBLE+LIVE: delete prod users table?'], true)).toMatch(/NIGHT GUARD/)
})

test('isNight boundaries', async () => {
  expect(isNight(22)).toBe(false)
  expect(isNight(23)).toBe(true)
  expect(isNight(3)).toBe(true)
  expect(isNight(8)).toBe(false)
})

test('a permission question is refused in the day, a factual one goes through', async ($, on) => {
  on('tool.call', () => ({ result: { ok: true } }))
  const ask = (q: string) => $.tool.call({ tool: 'AskUserQuestion', questions: [{ question: q, header: 'x', multiSelect: false, options: [{ label: 'a', description: '' }, { label: 'b', description: '' }] }] } as any)
  const night = isNight(new Date().getHours())
  const r1: any = await ask('Should I restart nginx?')
  expect(JSON.stringify(r1)).toMatch(night ? /NIGHT|AUTONOMY/ : /AUTONOMY/)
})

test('a block is logged and reported', async ($, on) => {
  const calls: any[] = []
  const runs: any[] = []
  on('tool.call', () => ({ result: {} }))
  on('process.run', (_: any, e: any) => { runs.push(e); return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } } })
  on('env.get', () => ({ value: '/Users/x' }))
  on('mcp.call', (_, e: any) => { calls.push(e); return { value: { content: [], isError: false } } })
  await $.tool.call({ tool: 'Bash', command: "ssh h 'pk" + "ill -f sshd'" } as any)
  expect(JSON.stringify(calls)).toMatch(/blocked/)
  expect(JSON.stringify(runs)).toMatch(/blocked/)
})
