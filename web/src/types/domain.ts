import type { Tables, Enums } from '@/types/database'

export type Profile = Tables<'profiles'> & {
  profile_technologies: { technology_id: number; technologies: Tables<'technologies'> | null }[]
}
export type Member = Tables<'project_members'> & { profiles: Tables<'profiles'> | null }
export type Project = Tables<'projects'> & {
  owner: Tables<'profiles'> | null
  project_technologies: {
    technology_id: number
    is_required: boolean
    technologies: Tables<'technologies'> | null
  }[]
  project_members: Member[]
}
export type Task = Tables<'tasks'>
export type ProjectStatus = Enums<'project_status'>
export type TaskStatus = Enums<'task_status'>
export const projectStatusLabels: Record<ProjectStatus, string> = {
  recruiting: 'Looking for teammates',
  in_progress: 'In progress',
  completed: 'Completed',
}
export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}
