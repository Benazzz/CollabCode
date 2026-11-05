import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isConfigured } from '@/config/env'

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    enabled: isConfigured,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('templates').select('*').order('id')
      if (error) throw error
      return data
    },
  })
}
export async function provisionRepository(projectId: string, providerToken: string) {
  const { data, error } = await supabase.functions.invoke('provision-github', {
    body: { projectId, providerToken },
  })
  if (error) {
    if ('context' in error && error.context instanceof Response) {
      const body = await error.context.json().catch(() => null)
      if (body?.error) throw new Error(body.error)
    }
    throw error
  }
  if (data?.error) throw new Error(data.error)
  return data as { url: string; issues: number }
}
