import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

export function useRequests(projectId?: string) {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['requests', projectId, session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      let query = supabase
        .from('join_requests')
        .select('*,profiles(*),projects(id,title)')
        .order('created_at', { ascending: false })
      if (projectId) query = query.eq('project_id', projectId)
      else query = query.eq('profile_id', session!.user.id)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
export async function requestToJoin(projectId: string, profileId: string, message: string) {
  const { error } = await supabase
    .from('join_requests')
    .insert({ project_id: projectId, profile_id: profileId, message })
  if (error?.code === '23505') throw new Error('You already have a request for this project.')
  if (error) throw error
}
export async function reviewRequest(id: string, status: 'accepted' | 'rejected') {
  const { data, error } = await supabase
    .from('join_requests')
    .update({ status })
    .eq('id', id)
    .select('id')
  if (error) throw error
  if (!data.length) throw new Error('This request is no longer available.')
}
export async function withdrawRequest(id: string) {
  const { data, error } = await supabase.from('join_requests').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('This request can no longer be withdrawn.')
}
export async function updateMember(
  projectId: string,
  profileId: string,
  role: 'maintainer' | 'member',
) {
  const { data, error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('project_id', projectId)
    .eq('profile_id', profileId)
    .select('profile_id')
  if (error) throw error
  if (!data.length) throw new Error('You cannot change this membership.')
}
export async function removeMember(projectId: string, profileId: string) {
  const { data, error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('profile_id', profileId)
    .select('profile_id')
  if (error) throw error
  if (!data.length) throw new Error('You cannot remove this membership.')
}
