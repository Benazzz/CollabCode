import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { TagPicker } from '@/components/ui/tag-picker'
import { ErrorNotice } from '@/components/ui/feedback'
import type { Tables, Database } from '@/types/database'
import { projectStatusLabels, type Project, type ProjectStatus } from '@/types/domain'

export function ProjectForm({
  project,
  technologies,
  templatePicker,
  onSubmit,
  busy,
  error,
}: {
  project?: Project
  technologies: Tables<'technologies'>[]
  templatePicker?: ReactNode
  onSubmit: (values: Database['public']['Functions']['save_project']['Args']) => void
  busy: boolean
  error: unknown
}) {
  const [techIds, setTechIds] = useState(
    project?.project_technologies.map((t) => t.technology_id) || [],
  )
  const [requiredIds, setRequiredIds] = useState(
    project?.project_technologies.filter((t) => t.is_required).map((t) => t.technology_id) || [],
  )
  const [theme, setTheme] = useState(project?.cover_theme || 'indigo')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    onSubmit({
      p_title: String(data.get('title')).trim(),
      p_summary: String(data.get('summary')).trim(),
      p_description: String(data.get('description')).trim(),
      p_category: String(data.get('category')),
      p_experience_level: String(data.get('experience')),
      p_cover_theme: theme,
      p_technology_ids: techIds,
      p_required_ids: requiredIds,
      p_status: String(data.get('status') || 'recruiting') as ProjectStatus,
      ...(project ? { p_project_id: project.id } : {}),
    })
  }
  return (
    <form className="form-panel" onSubmit={submit}>
      <div className="section-kicker">
        01 <span>THE IDEA</span>
      </div>
      <label>
        Project name
        <input
          name="title"
          placeholder="Give your idea a name"
          minLength={3}
          maxLength={100}
          required
          defaultValue={project?.title}
        />
      </label>
      <label>
        The short version
        <input
          name="summary"
          placeholder="What are you building, in one sentence?"
          maxLength={180}
          required
          defaultValue={project?.summary}
        />
      </label>
      <label>
        Tell the story
        <textarea
          name="description"
          rows={6}
          placeholder="What problem will it solve? Who is it for? What would you like to build together?"
          minLength={20}
          maxLength={12000}
          required
          defaultValue={project?.description}
        />
      </label>
      <div className="form-grid">
        <label>
          Category
          <select name="category" defaultValue={project?.category || 'Web app'}>
            {['Web app', 'Developer tool', 'Mobile app', 'Open source', 'Other'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Experience level
          <select name="experience" defaultValue={project?.experience_level || 'All levels'}>
            {['All levels', 'Beginner friendly', 'Intermediate', 'Advanced'].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      {project && (
        <label>
          Project status
          <select name="status" defaultValue={project.status}>
            {Object.entries(projectStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="section-kicker">
        02 <span>THE TOOLS & THE TEAM</span>
      </div>
      <TagPicker
        label="Built with"
        options={technologies}
        selected={techIds}
        onChange={setTechIds}
      />
      <TagPicker
        label="Looking for teammates who know"
        options={technologies}
        selected={requiredIds}
        onChange={setRequiredIds}
      />
      <p className="field-hint">
        Developers with these skills will see your project under “For your skills”.
      </p>
      {templatePicker}
      <div className="section-kicker">
        03 <span>A LITTLE PERSONALITY</span>
      </div>
      <fieldset className="theme-picker">
        <legend>Project color</legend>
        {['indigo', 'sage', 'clay', 'sand'].map((value) => (
          <button
            type="button"
            key={value}
            className={`theme-swatch ${value} ${theme === value ? 'selected' : ''}`}
            aria-label={value}
            aria-pressed={theme === value}
            onClick={() => setTheme(value)}
          />
        ))}
      </fieldset>
      <ErrorNotice error={error} />
      <div className="form-actions">
        <p>
          {project
            ? 'Changes are visible to your community.'
            : 'Every great project starts somewhere.'}
        </p>
        <button className="button primary" disabled={busy}>
          {busy ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}
          {busy ? 'Saving…' : project ? 'Save changes' : 'Create project'}
        </button>
      </div>
    </form>
  )
}
