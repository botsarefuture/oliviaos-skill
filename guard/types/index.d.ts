declare module 'claude-code' {
  interface PluginState {
    'oliviaos-guard': {
      logged: Shaped<number>
      blocked: Shaped<number>
      sent: Shaped<number>
      pending: Shaped<{ title: string; summary: string; what: string; project: string }[]>
    }
  }
}
export type Count = number
