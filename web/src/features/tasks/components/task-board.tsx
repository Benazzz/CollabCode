import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Circle, CircleCheck, CircleDot, ExternalLink, Plus } from 'lucide-react'
import { useTasks, moveTask } from '@/features/tasks/api/tasks'
import { TaskEditor } from '@/features/tasks/components/task-editor'
import { Avatar } from '@/components/ui/avatar'
import { ErrorNotice, Loading } from '@/components/ui/feedback'
import { githubUrl } from '@/utils/format'
import { taskStatusLabels, type Member, type Task, type TaskStatus } from '@/types/domain'

const statuses: TaskStatus[] = ['todo', 'in_progress', 'done']
const statusIcons = { todo: Circle, in_progress: CircleDot, done: CircleCheck }
export function TaskBoard({
  projectId,
  members,
  onChange,
}: {
  projectId: string
  members: Member[]
  onChange: () => void
}) {
  const tasks = useTasks(projectId)
  const client = useQueryClient()
  const [editor, setEditor] = useState<Task | 'new' | null>(null)
  const [initialStatus, setInitialStatus] = useState<TaskStatus>('todo')
  const [dragging, setDragging] = useState<string | null>(null)
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['tasks', projectId] })
    onChange()
  }
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => moveTask(id, status),
    onSuccess: refresh,
  })
  if (tasks.isLoading) return <Loading label="Opening your team’s task board…" />
  return (
    <section>
      <div className="board-header">
        <div>
          <h2>A little progress, every day.</h2>
          <p>Drag tasks between columns, or use the status menu on any card.</p>
        </div>
        <button
          className="button primary small"
          onClick={() => {
            setInitialStatus('todo')
            setEditor('new')
          }}
        >
          <Plus size={16} />
          Add task
        </button>
      </div>
      <ErrorNotice error={tasks.error || mutation.error} retry={() => void tasks.refetch()} />
      <div className="kanban">
        {statuses.map((status) => {
          const Icon = statusIcons[status]
          const column = tasks.data?.filter((t) => t.status === status) || []
          return (
            <section
              key={status}
              className={`kanban-column column-${status} ${dragging ? 'drop-ready' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(event) => {
                event.preventDefault()
                const id = event.dataTransfer.getData('text/plain')
                if (tasks.data?.some((t) => t.id === id) && !mutation.isPending)
                  mutation.mutate({ id, status })
                setDragging(null)
              }}
            >
              <header>
                <h3>
                  <Icon size={17} />
                  {taskStatusLabels[status]}
                  <span>{column.length}</span>
                </h3>
                <button
                  className="icon-button"
                  aria-label={`Add a task to ${taskStatusLabels[status]}`}
                  onClick={() => {
                    setInitialStatus(status)
                    setEditor('new')
                  }}
                >
                  <Plus size={16} />
                </button>
              </header>
              <div className="kanban-tasks">
                {column.map((task) => {
                  const assignee = members.find((m) => m.profile_id === task.assignee_id)
                  const issueUrl = githubUrl(task.github_issue_url)
                  const overdue =
                    task.due_date &&
                    task.status !== 'done' &&
                    task.due_date < new Date().toLocaleDateString('en-CA')
                  return (
                    <article
                      key={task.id}
                      className="task-card"
                      draggable={!mutation.isPending}
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', task.id)
                        event.dataTransfer.effectAllowed = 'move'
                        setDragging(task.id)
                      }}
                      onDragEnd={() => setDragging(null)}
                    >
                      <button className="task-title" onClick={() => setEditor(task)}>
                        {task.title}
                      </button>
                      {task.description && <p>{task.description}</p>}
                      <div className="task-meta">
                        {task.due_date && (
                          <span className={overdue ? 'overdue' : ''}>
                            <CalendarDays size={13} />
                            {new Date(`${task.due_date}T12:00:00`).toLocaleDateString('en', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                        {issueUrl && (
                          <a
                            href={issueUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open GitHub Issue ${task.github_issue_number}`}
                          >
                            <ExternalLink size={12} />#{task.github_issue_number}
                          </a>
                        )}
                        <span className="task-assignee">
                          {assignee ? (
                            <Avatar
                              name={assignee.profiles?.full_name}
                              url={assignee.profiles?.avatar_url}
                              size="sm"
                            />
                          ) : (
                            'Unassigned'
                          )}
                        </span>
                      </div>
                      <select
                        aria-label={`Status of ${task.title}`}
                        value={task.status}
                        disabled={mutation.isPending}
                        onChange={(event) =>
                          mutation.mutate({ id: task.id, status: event.target.value as TaskStatus })
                        }
                      >
                        {statuses.map((value) => (
                          <option key={value} value={value}>
                            {taskStatusLabels[value]}
                          </option>
                        ))}
                      </select>
                    </article>
                  )
                })}
                {!column.length && (
                  <div className="empty-column">A little room for the next step.</div>
                )}
              </div>
            </section>
          )
        })}
      </div>
      {editor && (
        <TaskEditor
          task={editor === 'new' ? undefined : editor}
          initialStatus={initialStatus}
          projectId={projectId}
          members={members}
          onClose={() => setEditor(null)}
          onSaved={refresh}
        />
      )}
    </section>
  )
}
