import { supabase } from '@/lib/supabase'

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}
export async function signInWithGithub(next = '/workspace') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      scopes: 'read:user user:email public_repo',
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })
  if (error) throw error
}
// Gives the signed-in user GitHub access without switching accounts.
// A GitHub identity that is not linked yet is added to the current account.
export async function connectGithub(next: string) {
  const { data, error: identitiesError } = await supabase.auth.getUserIdentities()
  if (identitiesError) throw identitiesError
  if (data.identities.some((identity) => identity.provider === 'github')) {
    return signInWithGithub(next)
  }
  const { error } = await supabase.auth.linkIdentity({
    provider: 'github',
    options: {
      scopes: 'read:user user:email public_repo',
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  })
  if (error) throw error
}
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
