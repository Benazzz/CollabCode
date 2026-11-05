import { createContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabase, clearGithubProviderToken, getGithubProviderToken } from '@/lib/supabase'
import { isConfigured } from '@/config/env'

export const AuthContext = createContext<{
  session: Session | null
  loading: boolean
  providerToken: string | null
}>({ session: null, loading: true, providerToken: null })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isConfigured)
  const [providerToken, setProviderToken] = useState<string | null>(null)
  const currentUser = useRef<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isConfigured) return
    let active = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return
      if (currentUser.current !== (next?.user.id ?? null)) {
        queryClient.clear()
        setProviderToken(null)
      }
      currentUser.current = next?.user.id ?? null
      setSession(next)
      const token = next?.provider_token || getGithubProviderToken(next?.user.id)
      if (token) setProviderToken(token)
      if (!next) {
        setProviderToken(null)
        clearGithubProviderToken()
      }
      setLoading(false)
    })
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) {
          setSession(data.session)
          setProviderToken(
            data.session?.provider_token || getGithubProviderToken(data.session?.user.id),
          )
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [queryClient])

  return (
    <AuthContext.Provider value={{ session, loading, providerToken }}>
      {children}
    </AuthContext.Provider>
  )
}
