import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isConfigured } from '@/config/env'
import type { Database } from '@/types/database'
import type { Project } from '@/types/domain'

const selectProject =
  '*, owner:profiles!projects_owner_id_fkey(*), project_technologies(technology_id,is_required,technologies(*)), project_members(*,profiles(*))' as const
export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
}

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    enabled: isConfigured,
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select(selectProject)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return data
    },
  })
}
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    enabled: isConfigured && Boolean(id),
    queryFn: async (): Promise<Project | null> => {
      const { data, error } = await supabase
        .from('projects')
        .select(selectProject)
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}
export function useUserProjects(userId?: string) {
  return useQuery({
    queryKey: ['projects', 'member', userId],
    enabled: isConfigured && Boolean(userId),
    queryFn: async (): Promise<Project[]> => {
      const membership = await supabase
        .from('project_members')
        .select('project_id')
        .eq('profile_id', userId!)
      if (membership.error) throw membership.error
      if (!membership.data.length) return []
      const { data, error } = await supabase
        .from('projects')
        .select(selectProject)
        .in(
          'id',
          membership.data.map((item) => item.project_id),
        )
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
export async function saveProject(values: Database['public']['Functions']['save_project']['Args']) {
  const { data, error } = await supabase.rpc('save_project', values)
  if (error) throw error
  return data
}
export async function deleteProject(id: string) {
  const { data, error } = await supabase.from('projects').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('Project not found or permission denied.')
}
