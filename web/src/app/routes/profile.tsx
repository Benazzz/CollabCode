import { GitFork as Github, MapPin, Pencil } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useProfile } from '@/features/profiles/api/profiles'
import { ProfileForm } from '@/features/profiles/components/profile-form'
import { useUserProjects } from '@/features/projects/api/projects'
import { ProjectCard } from '@/features/projects/components/project-card'
import { useTechnologies } from '@/lib/catalog'
import { useAuth } from '@/hooks/use-auth'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState, ErrorNotice, Loading, NotFound, PageHeading } from '@/components/ui/feedback'

export default function ProfileRoute() {
  const { id } = useParams()
  const { session } = useAuth()
  const profile = useProfile(id)
  const projects = useUserProjects(id)
  if (profile.isLoading) return <Loading />
  if (profile.error)
    return <ErrorNotice error={profile.error} retry={() => void profile.refetch()} />
  if (!profile.data) return <NotFound />
  const person = profile.data
  const work = projects.data || []
  return (
    <>
      <section className="profile-hero">
        <Avatar name={person.full_name} url={person.avatar_url} size="lg" />
        <div className="profile-intro">
          <div className="eyebrow">@{person.username}</div>
          <h1>{person.full_name || person.username}</h1>
          <p>{person.headline || 'A curious mind, ready to build.'}</p>
          <div className="profile-meta">
            {person.location && (
              <span>
                <MapPin size={15} />
                {person.location}
              </span>
            )}
            {person.github_username && (
              <a
                href={`https://github.com/${person.github_username}`}
                target="_blank"
                rel="noreferrer"
              >
                <Github size={15} />
                {person.github_username}
              </a>
            )}
            {person.available && (
              <span className="status-badge status-recruiting">
                <span />
                Open to projects
              </span>
            )}
          </div>
        </div>
        {session?.user.id === id && (
          <Link className="button secondary" to="/settings">
            <Pencil size={16} />
            Edit profile
          </Link>
        )}
      </section>
      <div className="profile-details">
        <section>
          <h2>A little about me</h2>
          <p className="prose">{person.bio || 'Still writing the first chapter.'}</p>
        </section>
        <section>
          <h2>Tools of the trade</h2>
          <div className="tags">
            {person.profile_technologies.length ? (
              person.profile_technologies.map((t) => (
                <span className="tag" key={t.technology_id}>
                  {t.technologies?.name}
                </span>
              ))
            ) : (
              <span className="muted">No skills added yet.</span>
            )}
          </div>
        </section>
      </div>
      <div className="section-heading">
        <h2>
          Building together <span className="count-badge">{work.length}</span>
        </h2>
      </div>
      <ErrorNotice error={projects.error} />
      {projects.isLoading ? (
        <Loading />
      ) : work.length ? (
        <div className="project-grid">
          {work.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <EmptyState title="The next chapter is unwritten.">
          Projects will appear here when this developer joins a team.
        </EmptyState>
      )}
    </>
  )
}
export function ProfileSettingsRoute() {
  const { session } = useAuth()
  const profile = useProfile(session?.user.id)
  const technologies = useTechnologies()
  if (profile.isLoading || technologies.isLoading) return <Loading />
  if (profile.error || technologies.error)
    return (
      <ErrorNotice
        error={profile.error || technologies.error}
        retry={() => {
          void profile.refetch()
          void technologies.refetch()
        }}
      />
    )
  if (!profile.data) return <NotFound />
  return (
    <>
      <PageHeading eyebrow="YOUR CORNER OF THE COMMUNITY" title="Let people know you.">
        A little about your skills, your interests, and what you’d like to build.
      </PageHeading>
      <div className="narrow-page">
        <ProfileForm profile={profile.data} technologies={technologies.data || []} />
      </div>
    </>
  )
}
