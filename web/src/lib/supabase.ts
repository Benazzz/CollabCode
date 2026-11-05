import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'
import type { Database } from '@/types/database'

// Provider credentials are used in memory for one provisioning session, never persisted.
let githubCredential: { userId: string; token: string } | null = null
export function getGithubProviderToken(userId?: string) {
  return githubCredential && githubCredential.userId === userId ? githubCredential.token : null
}
export function clearGithubProviderToken() {
  githubCredential = null
}
const storage = {
  getItem: (key: string) => localStorage.getItem(key),
  removeItem: (key: string) => localStorage.removeItem(key),
  setItem(key: string, value: string) {
    try {
      const session = JSON.parse(value)
      if (session.provider_token && session.user?.id)
        githubCredential = { userId: session.user.id, token: session.provider_token }
      delete session.provider_token
      delete session.provider_refresh_token
      localStorage.setItem(key, JSON.stringify(session))
    } catch {
      localStorage.setItem(key, value)
    }
  },
}

export const supabase = createClient<Database>(
  env.supabaseUrl || 'https://not-configured.supabase.co',
  env.supabaseKey || 'not-configured',
  { auth: { flowType: 'pkce', storage, detectSessionInUrl: true } },
)
