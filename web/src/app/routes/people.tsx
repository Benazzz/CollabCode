import { useState } from 'react'
import { ArrowUpRight, MapPin, Search } from 'lucide-react'
import { Link } from 'react-router'
import { useProfiles } from '@/features/profiles/api/profiles'
import { useTechnologies } from '@/lib/catalog'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState, ErrorNotice, Loading, PageHeading } from '@/components/ui/feedback'

export default function PeopleRoute() {
  const profiles = useProfiles()
  const technologies = useTechnologies()
  const [search, setSearch] = useState('')
  const [technology, setTechnology] = useState('')
  const [available, setAvailable] = useState(false)
  const people =
    profiles.data?.filter(
      (person) =>
        `${person.full_name} ${person.username} ${person.headline} ${person.profile_technologies.map((t) => t.technologies?.name).join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (!technology ||
          person.profile_technologies.some((t) => t.technology_id === Number(technology))) &&
        (!available || person.available),
    ) || []
  return (
    <>
      <PageHeading eyebrow="DIFFERENT SKILLS. SHARED CURIOSITY." title="Find your kind of people.">
        A great collaboration starts with someone who sees things a little differently.
      </PageHeading>
      <div className="people-filters filters">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Search people"
            placeholder="Search by name, skill, or curiosity…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter people by technology"
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
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
          Open to projects
        </label>
      </div>
      <ErrorNotice
        error={profiles.error || technologies.error}
        retry={() => {
          void profiles.refetch()
          void technologies.refetch()
        }}
      />
      {profiles.isLoading ? (
        <Loading />
      ) : people.length ? (
        <div className="people-grid">
          {people.map((person) => (
            <article key={person.id} className="person-card">
              <div className="person-top">
                <Avatar name={person.full_name} url={person.avatar_url} size="lg" />
                {person.available && (
                  <span className="status-badge status-recruiting">
                    <span />
                    Open to projects
                  </span>
                )}
              </div>
              <h2>
                <Link to={`/people/${person.id}`}>
                  {person.full_name || person.username}
                  <ArrowUpRight size={19} />
                </Link>
              </h2>
              <p className="person-headline">
                {person.headline || 'A curious mind, ready to build.'}
              </p>
              {person.location && (
                <span className="location">
                  <MapPin size={14} />
                  {person.location}
                </span>
              )}
              <p className="person-bio">
                {person.bio || 'Every collaboration starts with a hello.'}
              </p>
              <div className="tags">
                {person.profile_technologies.slice(0, 5).map((t) => (
                  <span className="tag" key={t.technology_id}>
                    {t.technologies?.name}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        !profiles.error && (
          <EmptyState
            title="There’s room for your perspective."
            action={
              <Link to="/settings" className="button secondary">
                Build your profile <ArrowUpRight size={16} />
              </Link>
            }
          >
            Try a broader search, or be one of the first people to introduce yourself.
          </EmptyState>
        )
      )}
    </>
  )
}
