import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isConfigured } from '@/config/env'
import type { Database } from '@/types/database'
import type { Profile } from '@/types/domain'

const selection = '*,profile_technologies(technology_id,technologies(*))' as const
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    enabled: isConfigured,
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select(selection)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return data
    },
  })
}
export function useProfile(id?: string) {
  return useQuery({
    queryKey: ['profiles', id],
    enabled: isConfigured && Boolean(id),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select(selection)
        .eq('id', id!)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}
export async function saveProfile(values: Database['public']['Functions']['save_profile']['Args']) {
  const { error } = await supabase.rpc('save_profile', values)
  if (error) throw error
}
