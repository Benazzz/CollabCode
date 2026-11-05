import { useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Compass,
  Search,
  SlidersHorizontal,
  Sprout,
  Users,
} from 'lucide-react'
import { Link } from 'react-router'
import { useProjects } from '@/features/projects/api/projects'
import { ProjectCard } from '@/features/projects/components/project-card'
import { useProfile } from '@/features/profiles/api/profiles'
import { useTechnologies } from '@/lib/catalog'
import { useAuth } from '@/hooks/use-auth'
import { ErrorNotice, EmptyState, Loading } from '@/components/ui/feedback'
import { paths } from '@/config/paths'
import garden from '@/assets/garden.svg'

export default function ExploreRoute() {
  const projects = useProjects()
  const technologies = useTechnologies()
  const { session } = useAuth()
  const profile = useProfile(session?.user.id)
  const [search, setSearch] = useState('')
  const [technology, setTechnology] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [tab, setTab] = useState('all')
  const skillIds = profile.data?.profile_technologies.map((item) => item.technology_id) || []
  const matching = useMemo(
    () =>
      (projects.data || [])
        .filter((project) => {
          const matchesText =
            `${project.title} ${project.summary} ${project.description} ${project.project_technologies.map((t) => t.technologies?.name).join(' ')}`
              .toLowerCase()
              .includes(search.toLowerCase())
          return (
            matchesText &&
            (!technology ||
              project.project_technologies.some((t) => t.technology_id === Number(technology))) &&
            (!status || project.status === status) &&
            (tab !== 'beginner' || project.experience_level === 'Beginner friendly') &&
            (tab !== 'match' ||
              project.project_technologies.some((t) => skillIds.includes(t.technology_id)))
          )
        })
        .sort((a, b) =>
          sort === 'active'
            ? b.project_members.length - a.project_members.length
            : sort === 'match'
              ? b.project_technologies.filter((t) => skillIds.includes(t.technology_id)).length -
                a.project_technologies.filter((t) => skillIds.includes(t.technology_id)).length
              : b.created_at.localeCompare(a.created_at),
        ),
    [projects.data, search, technology, status, tab, sort, skillIds],
  )
  return (
    <>
      <section className="explore-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span />A SPACE FOR SHARED AMBITION
          </span>
          <h1>
            Good things are
            <br />
            built <em>together.</em>
          </h1>
          <p>
            Find your people. Bring an idea to life.
            <br />
            Grow a little with every line of code.
          </p>
          <div className="hero-actions">
            <a href="#project-discovery" className="button dark">
              Find your next project <ArrowRight size={16} />
            </a>
            <span className="hero-footnote">Small teams. Real possibilities.</span>
          </div>
        </div>
        <div className="hero-art">
          <img
            src={garden}
            alt="A vermilion sun rising over indigo mountains and a quiet Japanese garden"
          />
          <span className="art-caption">
            一緒に作る <span>CREATE, TOGETHER.</span>
          </span>
        </div>
      </section>
      <div className="discovery-layout">
        <section id="project-discovery" className="discovery-main">
          <div className="section-heading">
            <div>
              <div className="eyebrow">FIND YOUR NEXT CHAPTER</div>
              <h2>
                Explore projects<span className="count-badge">{projects.data?.length || 0}</span>
              </h2>
            </div>
            <SlidersHorizontal size={19} className="muted" />
          </div>
          <div className="discovery-tabs" role="group" aria-label="Project discovery">
            <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>
              <Compass size={15} />
              All projects
            </button>
            <button className={tab === 'match' ? 'active' : ''} onClick={() => setTab('match')}>
              <Sprout size={15} />
              For your skills
            </button>
            <button
              className={tab === 'beginner' ? 'active' : ''}
              onClick={() => setTab('beginner')}
            >
              Beginner friendly
            </button>
          </div>
          <div className="filters">
            <label className="search-field">
              <Search size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="An idea, a technology, a possibility…"
                aria-label="Search projects"
              />
            </label>
            <select
              aria-label="Filter by technology"
              value={technology}
              onChange={(e) => setTechnology(e.target.value)}
            >
              <option value="">All technologies</option>
              {technologies.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="results-bar">
            <span>
              {matching.length} {matching.length === 1 ? 'project' : 'projects'} to discover
            </span>
            <div>
              <select
                aria-label="Filter project status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Any status</option>
                <option value="recruiting">Looking for teammates</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
              <select
                aria-label="Sort projects"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="active">Largest teams</option>
                <option value="match">Skill match</option>
              </select>
            </div>
          </div>
          <ErrorNotice
            error={projects.error || technologies.error}
            retry={() => {
              void projects.refetch()
              void technologies.refetch()
            }}
          />
          {projects.isLoading ? (
            <Loading />
          ) : matching.length ? (
            <div className="project-grid">
              {matching.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            !projects.error && (
              <EmptyState
                title={
                  tab === 'match' && !skillIds.length
                    ? 'Your skills are the starting point.'
                    : projects.data?.length
                      ? 'Your next project is still out there.'
                      : 'An open space. A fresh beginning.'
                }
                action={
                  <Link
                    className="button secondary"
                    to={tab === 'match' && !skillIds.length ? paths.settings : paths.createProject}
                  >
                    {tab === 'match' && !skillIds.length ? 'Add your skills' : 'Start a project'}
                    <ArrowUpRight size={16} />
                  </Link>
                }
              >
                {tab === 'match' && !skillIds.length
                  ? 'Add your technologies to your profile to find projects that fit you.'
                  : projects.data?.length
                    ? 'Try another technology or a broader search.'
                    : 'Be the first to share an idea and invite someone to build it with you.'}
              </EmptyState>
            )
          )}
          <div className="inspiration-heading">
            <h3>A seed of inspiration</h3>
            <span>Ideas to make your own</span>
          </div>
          <div className="inspiration-grid">
            <Link
              to="/projects/new?idea=A%20quieter%20habit%20tracker"
              className="idea-card idea-sage"
            >
              <span className="idea-art">
                <Sprout size={28} strokeWidth={1.25} />
              </span>
              <div>
                <small>START SMALL</small>
                <h4>A quieter habit tracker</h4>
                <p>Thoughtful tools for everyday growth.</p>
              </div>
              <ArrowUpRight size={19} />
            </Link>
            <Link
              to="/projects/new?idea=An%20open-source%20developer%20toolkit"
              className="idea-card idea-sand"
            >
              <span className="idea-art">
                <Code2 size={28} strokeWidth={1.25} />
              </span>
              <div>
                <small>BUILD IN THE OPEN</small>
                <h4>A developer’s little toolkit</h4>
                <p>Make someone’s next commit easier.</p>
              </div>
              <ArrowUpRight size={19} />
            </Link>
          </div>
        </section>
        <aside className="discovery-aside">
          <div className="community-card">
            <div className="eyebrow">BETTER, TOGETHER</div>
            <div className="community-illustration" aria-hidden="true">
              <span>+</span>
              <span>+</span>
              <span>+</span>
              <i />
            </div>
            <h3>
              Your next teammate
              <br />
              is out there.
            </h3>
            <p>
              Different skills. Fresh perspectives.
              <br />
              The same spark to make something.
            </p>
            <Link to={paths.people}>
              Meet the community <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="how-card">
            <span className="eyebrow">FROM IDEA TO SOMETHING REAL</span>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>Find your spark</strong>
                  <p>Explore an idea that feels like you.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Find your people</strong>
                  <p>A good team starts with a hello.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Make it happen</strong>
                  <p>One task, one commit at a time.</p>
                </div>
              </li>
            </ol>
          </div>
          <div className="quiet-note">
            <Users size={17} />
            <p>
              No perfect résumés needed.
              <br />
              <strong>Just curiosity and a little commitment.</strong>
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
