import { Plus } from 'lucide-react'
import { Link } from 'react-router'
import { useUserProjects } from '@/features/projects/api/projects'
import { ProjectCard } from '@/features/projects/components/project-card'
import { OutgoingRequests } from '@/features/teams/components/requests-panel'
import { EmptyState, ErrorNotice, Loading, PageHeading } from '@/components/ui/feedback'
import { useAuth } from '@/hooks/use-auth'

export default function WorkspaceRoute() {
  const { session } = useAuth()
  const projects = useUserProjects(session?.user.id)
  const mine = projects.data || []
  return (
    <>
      <PageHeading
        eyebrow="YOUR IDEAS, TAKING SHAPE"
        title="A little space to build."
        action={
          <Link to="/projects/new" className="button primary">
            <Plus size={17} />
            New project
          </Link>
        }
      >
        The teams you’re part of, and the next steps you’ll take together.
      </PageHeading>
      <ErrorNotice error={projects.error} retry={() => void projects.refetch()} />
      {projects.isLoading ? (
        <Loading />
      ) : mine.length ? (
        <div className="project-grid workspace-grid">
          {mine.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        !projects.error && (
          <EmptyState
            title="Your next chapter is waiting."
            action={
              <Link to="/projects" className="button secondary">
                Explore projects
              </Link>
            }
          >
            Create a project of your own or introduce yourself to a team that inspires you.
          </EmptyState>
        )
      )}
      <OutgoingRequests />
    </>
  )
}
