import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import { Code2, GitFork as Github, Sprout } from 'lucide-react'
import { ProjectForm } from '@/features/projects/components/project-form'
import { saveProject } from '@/features/projects/api/projects'
import { useTechnologies } from '@/lib/catalog'
import { useTemplates, provisionRepository } from '@/features/github/api/github'
import { useAuth } from '@/hooks/use-auth'
import { ErrorNotice, Loading, PageHeading } from '@/components/ui/feedback'
import type { Database } from '@/types/database'

export default function CreateProjectRoute() {
  const technologies = useTechnologies()
  const templates = useTemplates()
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [createRepository, setCreateRepository] = useState(false)
  const { providerToken } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const mutation = useMutation({
    mutationFn: async (values: Database['public']['Functions']['save_project']['Args']) => {
      const id = await saveProject({ ...values, p_template_id: templateId ?? undefined })
      let githubError = ''
      if (createRepository && providerToken && templateId) {
        try {
          await provisionRepository(id, providerToken)
        } catch (e) {
          githubError = e instanceof Error ? e.message : 'GitHub setup could not finish.'
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      navigate(`/projects/${id}`, { state: { created: true, githubError } })
    },
  })
  if (technologies.isLoading || templates.isLoading) return <Loading />
  if (technologies.error || templates.error)
    return (
      <ErrorNotice
        error={technologies.error || templates.error}
        retry={() => {
          void technologies.refetch()
          void templates.refetch()
        }}
      />
    )
  return (
    <>
      <PageHeading eyebrow="PLANT SOMETHING GOOD" title="Every project starts with an idea.">
        You don’t need it all figured out. Just a place to begin.
      </PageHeading>
      {params.get('idea') && (
        <div className="notice">
          Your spark: <strong>{params.get('idea')}</strong>. Make it your own below.
        </div>
      )}
      <div className="editor-layout">
        <ProjectForm
          technologies={technologies.data || []}
          onSubmit={(v) => mutation.mutate(v)}
          busy={mutation.isPending}
          error={mutation.error}
          templatePicker={
            <>
              <div className="section-kicker">
                OPTIONAL <span>A RUNNING START</span>
              </div>
              <fieldset className="template-picker">
                <legend>Start with a technology template</legend>
                <button
                  type="button"
                  className={`template-option ${templateId === null ? 'selected' : ''}`}
                  aria-pressed={templateId === null}
                  onClick={() => {
                    setTemplateId(null)
                    setCreateRepository(false)
                  }}
                >
                  <Sprout size={20} />
                  <span>
                    <strong>A blank canvas</strong>
                    <small>Your own tools, your own direction.</small>
                  </span>
                </button>
                {templates.data?.map((template) => (
                  <button
                    type="button"
                    key={template.id}
                    className={`template-option ${templateId === template.id ? 'selected' : ''}`}
                    aria-pressed={templateId === template.id}
                    onClick={() => {
                      setTemplateId(template.id)
                      setCreateRepository(Boolean(providerToken))
                    }}
                  >
                    <Code2 size={20} />
                    <span>
                      <strong>{template.name}</strong>
                      <small>{template.description}</small>
                    </span>
                  </button>
                ))}
              </fieldset>
              {templateId && (
                <div className="github-choice">
                  <Github size={20} />
                  <div>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={createRepository}
                        disabled={!providerToken}
                        onChange={(e) => setCreateRepository(e.target.checked)}
                      />
                      Create a public GitHub repository with starter Issues
                    </label>
                    <p className="field-hint">
                      {providerToken
                        ? 'A repository will be created in your GitHub account when you submit.'
                        : 'You can connect GitHub and create the repository from your project page. Starter tasks are added now.'}
                    </p>
                  </div>
                </div>
              )}
            </>
          }
        />
        <aside className="editor-aside">
          <div className="note-seal">始</div>
          <h3>
            Small beginnings.
            <br />
            Real possibilities.
          </h3>
          <p>A clear idea helps the right people find you.</p>
          <ul>
            <li>Describe the problem you care about.</li>
            <li>Share the skills you have and the ones you need.</li>
            <li>Keep the first milestone small.</li>
          </ul>
          <p className="field-hint">Your project is public. You choose who joins your team.</p>
        </aside>
      </div>
    </>
  )
}
