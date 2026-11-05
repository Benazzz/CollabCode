import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Save, Trash2 } from 'lucide-react'
import { saveTask, deleteTask, type TaskInput } from '@/features/tasks/api/tasks'
import { ErrorNotice } from '@/components/ui/feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { taskStatusLabels, type Task, type Member, type TaskStatus } from '@/types/domain'

export function TaskEditor({
  task,
  projectId,
  members,
  onClose,
  onSaved,
  initialStatus = 'todo',
}: {
  task?: Task
  projectId: string
  members: Member[]
  onClose: () => void
  onSaved: () => void
  initialStatus?: TaskStatus
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const mutation = useMutation({
    mutationFn: (values: TaskInput) => saveTask(projectId, values, task?.id),
    onSuccess: () => {
      onSaved()
      onClose()
    },
  })
  useEffect(() => {
    ref.current?.showModal()
    return () => ref.current?.close()
  }, [])
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      title: String(form.get('title')).trim(),
      description: String(form.get('description')).trim(),
      status: String(form.get('status')) as TaskStatus,
      assignee_id: String(form.get('assignee')) || null,
      due_date: String(form.get('due')) || null,
    })
  }
  return (
    <dialog
      ref={ref}
      className="dialog task-dialog"
      onCancel={(event) => {
        if (mutation.isPending) event.preventDefault()
        else onClose()
      }}
    >
      <div className="dialog-header">
        <div>
          <div className="eyebrow">ONE STEP FORWARD</div>
          <h2>{task ? 'Shape the next step' : 'Something to work on'}</h2>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          disabled={mutation.isPending}
          aria-label="Close task editor"
        >
          <X size={20} />
        </button>
      </div>
      <form onSubmit={submit}>
        <label>
          Task title
          <input
            name="title"
            defaultValue={task?.title}
            required
            minLength={3}
            maxLength={160}
            placeholder="What needs to happen?"
          />
        </label>
        <label>
          Details
          <textarea
            name="description"
            rows={4}
            maxLength={6000}
            defaultValue={task?.description}
            placeholder="A little context goes a long way."
          />
        </label>
        <div className="form-grid">
          <label>
            Status
            <select name="status" defaultValue={task?.status || initialStatus}>
              {Object.entries(taskStatusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input type="date" name="due" defaultValue={task?.due_date || ''} />
          </label>
        </div>
        <label>
          Assigned to
          <select name="assignee" defaultValue={task?.assignee_id || ''}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.profile_id} value={m.profile_id}>
                {m.profiles?.full_name || m.profiles?.username}
              </option>
            ))}
          </select>
        </label>
        <ErrorNotice error={mutation.error} />
        <div className="form-actions">
          {task ? (
            <button
              type="button"
              className="button danger-quiet"
              disabled={mutation.isPending}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={16} />
              Delete task
            </button>
          ) : (
            <span />
          )}
          <button className="button primary" disabled={mutation.isPending}>
            <Save size={16} />
            {mutation.isPending ? 'Saving…' : 'Save task'}
          </button>
        </div>
      </form>
      {confirmDelete && task && (
        <ConfirmDialog
          title="Delete this task?"
          description="This removes the task from CollabCode. A linked GitHub Issue will remain on GitHub."
          label="Delete task"
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteTask(task.id)
            onSaved()
            onClose()
          }}
        />
      )}
    </dialog>
  )
}
