import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isConfigured } from '@/config/env'

export function useTechnologies() {
  return useQuery({
    queryKey: ['technologies'],
    enabled: isConfigured,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('technologies').select('*').order('name')
      if (error) throw error
      return data
    },
  })
}
