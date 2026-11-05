import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Task, TaskStatus } from '@/types/domain'
import { useAuth } from '@/hooks/use-auth'

export function useTasks(projectId: string) {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['tasks', projectId, session?.user.id],
    enabled: Boolean(session),
    refetchInterval: 30_000,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('position')
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}
export type TaskInput = Pick<Task, 'title' | 'description' | 'assignee_id' | 'due_date' | 'status'>
export async function saveTask(projectId: string, values: TaskInput, id?: string) {
  const query = id
    ? supabase.from('tasks').update(values).eq('id', id).eq('project_id', projectId)
    : supabase.from('tasks').insert({ ...values, project_id: projectId })
  const { data, error } = await query.select('id')
  if (error) throw error
  if (!data.length) throw new Error('Task not found or permission denied.')
}
export async function moveTask(id: string, status: TaskStatus) {
  const { data, error } = await supabase.from('tasks').update({ status }).eq('id', id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('You no longer have access to this task.')
}
export async function deleteTask(id: string) {
  const { data, error } = await supabase.from('tasks').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('Task not found or permission denied.')
}
