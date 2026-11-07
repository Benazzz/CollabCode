import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  Code2,
  FolderGit2,
  LayoutDashboard,
  ListTodo,
  Mail,
  Settings2,
  Trash2,
  Users,
} from 'lucide-react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { deleteProject, saveProject, useProject } from '@/features/projects/api/projects'
import { ProjectForm } from '@/features/projects/components/project-form'
import { TeamPanel } from '@/features/teams/components/team-panel'
import { JoinProject, RequestsPanel } from '@/features/teams/components/requests-panel'
import { TaskBoard } from '@/features/tasks/components/task-board'
import { GithubPanel } from '@/features/github/components/github-panel'
import { signInWithGithub } from '@/features/auth/api/auth'
import { useTechnologies } from '@/lib/catalog'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Avatar } from '@/components/ui/avatar'
import { ErrorNotice, Loading, NotFound } from '@/components/ui/feedback'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { projectStatusLabels } from '@/types/domain'

export default function ProjectRoute() {
  const { id = '' } = useParams()
  const project = useProject(id)
  const technologies = useTechnologies()
  const { session, providerToken } = useAuth()
  const client = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saved, setSaved] = useState(false)
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['projects'] })
    void client.invalidateQueries({ queryKey: ['tasks', id] })
    void client.invalidateQueries({ queryKey: ['requests'] })
  }
  const mutation = useMutation({
    mutationFn: saveProject,
    onSuccess: () => {
      refresh()
      setSaved(true)
    },
  })
  useEffect(() => {
    const invalidate = () => {
      void client.invalidateQueries({ queryKey: ['projects'] })
      void client.invalidateQueries({ queryKey: ['tasks', id] })
      void client.invalidateQueries({ queryKey: ['requests', id] })
    }
    const channel = supabase
      .channel(`project:${id}:${session?.user.id || 'guest'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${id}` },
        invalidate,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_members', filter: `project_id=eq.${id}` },
        invalidate,
      )
    if (session)
      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${id}` },
          invalidate,
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'join_requests', filter: `project_id=eq.${id}` },
          invalidate,
        )
    channel.subscribe()
    // DELETE events may omit filter columns. Polling also recovers from a disconnected socket.
    const timer = window.setInterval(invalidate, 30_000)
    return () => {
      void supabase.removeChannel(channel)
      window.clearInterval(timer)
    }
  }, [id, session?.user.id, client])
  if (project.isLoading) return <Loading />
  if (project.error)
    return <ErrorNotice error={project.error} retry={() => void project.refetch()} />
  if (!project.data) return <NotFound />
  const data = project.data
  const owner = data.owner_id === session?.user.id
  const member = data.project_members.some((m) => m.profile_id === session?.user.id)
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    ...(member ? [{ id: 'tasks', label: 'Task board', icon: ListTodo }] : []),
    { id: 'team', label: 'The team', icon: Users },
    ...(owner
      ? [
          { id: 'requests', label: 'Join requests', icon: Mail },
          { id: 'settings', label: 'Settings', icon: Settings2 },
        ]
      : []),
  ]
  const tab = tabs.some((t) => t.id === params.get('tab')) ? params.get('tab')! : 'overview'
  const progress = data.tasks_total ? Math.round((data.tasks_done / data.tasks_total) * 100) : 0
  const githubError = (location.state as { githubError?: string } | null)?.githubError
  return (
    <>
      <Link to="/projects" className="back-link">
        <ArrowLeft size={15} />
        Back to the possibilities
      </Link>
      <header className={`project-hero theme-${data.cover_theme}`}>
        <div className="project-glyph large">
          <FolderGit2 size={33} strokeWidth={1.5} />
        </div>
        <div className="project-hero-copy">
          <div className="project-header-meta">
            <span className="eyebrow">{data.category}</span>
            <span className={`status-badge status-${data.status}`}>
              <span />
              {projectStatusLabels[data.status]}
            </span>
          </div>
          <h1>{data.title}</h1>
          <p>{data.summary || data.description.slice(0, 180)}</p>
          <div className="project-owner">
            <Link to={`/people/${data.owner_id}`}>
              <Avatar name={data.owner?.full_name} url={data.owner?.avatar_url} size="sm" />
              <span>
                Started by <strong>{data.owner?.full_name || 'a curious developer'}</strong>
              </span>
            </Link>
            <span>
              <CalendarDays size={14} />
              {new Date(data.created_at).toLocaleDateString('en', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
        {member && (
          <span className="member-indicator">
            <span className="status-dot" />
            Your team
          </span>
        )}
      </header>
      {githubError && (
        <div className="notice" role="status">
          Your project was saved. GitHub setup needs another try: {githubError}
        </div>
      )}
      <nav className="project-tabs" aria-label="Project sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? 'active' : ''}
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => setParams(item.id === 'overview' ? {} : { tab: item.id })}
          >
            <item.icon size={16} />
            {item.label}
            {item.id === 'team' && <span>{data.project_members.length}</span>}
          </button>
        ))}
      </nav>
      {tab === 'overview' && (
        <div className="project-overview">
          <div>
            <section className="panel">
              <div className="eyebrow">THE IDEA</div>
              <h2>What we’re building</h2>
              <p className="prose project-description">{data.description}</p>
              <div className="project-facts">
                <div>
                  <Code2 size={18} />
                  <span>
                    Experience<strong>{data.experience_level}</strong>
                  </span>
                </div>
                <div>
                  <Users size={18} />
                  <span>
                    The team
                    <strong>
                      {data.project_members.length}{' '}
                      {data.project_members.length === 1 ? 'builder' : 'builders'}
                    </strong>
                  </span>
                </div>
              </div>
              <h3>Built with</h3>
              <div className="tags">
                {data.project_technologies.map((tech) => (
                  <span className="tag" key={tech.technology_id}>
                    {tech.technologies?.name}
                  </span>
                ))}
                {!data.project_technologies.length && (
                  <span className="muted">The tools are still taking shape.</span>
                )}
              </div>
              {data.project_technologies.some((t) => t.is_required) && (
                <>
                  <h3>We could use your perspective in</h3>
                  <div className="tags">
                    {data.project_technologies
                      .filter((t) => t.is_required)
                      .map((t) => (
                        <span className="tag required" key={t.technology_id}>
                          {t.technologies?.name}
                        </span>
                      ))}
                  </div>
                </>
              )}
            </section>
            <GithubPanel
              project={data}
              owner={owner}
              providerToken={providerToken}
              onConnect={() => signInWithGithub(`/projects/${id}`)}
              onChange={refresh}
              autoCreate={params.get('setup') === 'github'}
            />
          </div>
          <aside>
            <div className="progress-panel">
              <div className="eyebrow">ONE STEP AT A TIME</div>
              <h3>Every little bit counts.</h3>
              <div className="progress-number">
                {progress}
                <span>%</span>
              </div>
              <progress max={100} value={progress} aria-label="Project completion" />
              <p>
                {data.tasks_done} completed · {data.tasks_total} total tasks
              </p>
              {member && (
                <button className="text-button" onClick={() => setParams({ tab: 'tasks' })}>
                  Make the next step <ArrowLeft className="arrow-forward" size={15} />
                </button>
              )}
            </div>
            {!member && <JoinProject projectId={id} recruiting={data.status === 'recruiting'} />}
            {member && (
              <div className="team-note">
                <span className="note-seal">共</span>
                <h3>You’re part of this.</h3>
                <p>
                  Bring your questions, share your progress, and keep making things a little better.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}
      {tab === 'tasks' && member && (
        <TaskBoard projectId={id} members={data.project_members} onChange={refresh} />
      )}
      {tab === 'team' && (
        <TeamPanel
          members={data.project_members}
          projectId={id}
          owner={owner}
          userId={session?.user.id}
          onChange={refresh}
        />
      )}
      {tab === 'requests' && owner && <RequestsPanel projectId={id} onChange={refresh} />}
      {tab === 'settings' && owner && (
        <div className="narrow-page">
          <ErrorNotice error={technologies.error} />
          {saved && (
            <div className="notice success" role="status">
              Your project is up to date.
            </div>
          )}
          {technologies.isLoading ? (
            <Loading />
          ) : (
            <ProjectForm
              project={data}
              technologies={technologies.data || []}
              busy={mutation.isPending}
              error={mutation.error}
              onSubmit={(values) => {
                setSaved(false)
                mutation.mutate(values)
              }}
            />
          )}
          <section className="danger-zone">
            <div>
              <h3>Close this chapter</h3>
              <p>
                Delete the project, requests, memberships, and tasks from CollabCode. Your GitHub
                repository stays on GitHub.
              </p>
            </div>
            <button className="button danger-quiet" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={16} />
              Delete project
            </button>
          </section>
        </div>
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete “${data.title}”?`}
          description="This permanently removes this project and its team data from CollabCode. It cannot be undone. Your GitHub repository and Issues are not deleted."
          label="Delete project permanently"
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteProject(id)
            refresh()
            navigate('/workspace', { replace: true })
          }}
        />
      )}
    </>
  )
}
