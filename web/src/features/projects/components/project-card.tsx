import { ArrowUpRight, GitBranch, Users } from 'lucide-react'
import { Link } from 'react-router'
import { Avatar } from '@/components/ui/avatar'
import { paths } from '@/config/paths'
import { relativeDate } from '@/utils/format'
import { projectStatusLabels, type Project } from '@/types/domain'

export function ProjectCard({ project }: { project: Project }) {
  const progress = project.tasks_total
    ? Math.round((project.tasks_done / project.tasks_total) * 100)
    : 0
  return (
    <article className={`project-card theme-${project.cover_theme}`}>
      <div className="project-card-top">
        <span className="project-glyph">
          <GitBranch size={24} strokeWidth={1.5} />
        </span>
        <span className={`status-badge status-${project.status}`}>
          <span />
          {projectStatusLabels[project.status]}
        </span>
      </div>
      <div className="card-category">
        {project.category} <span>·</span> {project.experience_level}
      </div>
      <h3>
        <Link to={paths.project(project.id)}>
          {project.title}
          <ArrowUpRight size={20} />
        </Link>
      </h3>
      <p className="card-description">{project.summary || project.description}</p>
      <div className="tags">
        {project.project_technologies.slice(0, 4).map((tech) => (
          <span className="tag" key={tech.technology_id}>
            {tech.technologies?.name}
          </span>
        ))}
        {project.project_technologies.length > 4 && (
          <span className="tag">+{project.project_technologies.length - 4}</span>
        )}
      </div>
      <div className="card-progress">
        <div>
          <span>
            {project.tasks_total
              ? `${project.tasks_done} of ${project.tasks_total} tasks`
              : 'A fresh beginning'}
          </span>
          <span>{progress}%</span>
        </div>
        <progress value={progress} max={100} aria-label={`${project.title} progress`} />
      </div>
      <div className="project-card-footer">
        <div className="avatar-stack">
          {project.project_members.slice(0, 3).map((member) => (
            <Avatar
              key={member.profile_id}
              name={member.profiles?.full_name}
              url={member.profiles?.avatar_url}
              size="sm"
            />
          ))}
          <span>
            <Users size={13} />
            {project.project_members.length}
          </span>
        </div>
        <span>{relativeDate(project.created_at)}</span>
      </div>
    </article>
  )
}
