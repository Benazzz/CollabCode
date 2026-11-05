import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { GitFork as Github, ArrowUpRight, Check, RefreshCw } from 'lucide-react'
import { provisionRepository } from '@/features/github/api/github'
import { ErrorNotice } from '@/components/ui/feedback'
import { githubUrl } from '@/utils/format'
import type { Project } from '@/types/domain'

export function GithubPanel({
  project,
  owner,
  providerToken,
  onConnect,
  onChange,
}: {
  project: Project
  owner: boolean
  providerToken: string | null
  onConnect: () => Promise<void>
  onChange: () => void
}) {
  const [error, setError] = useState<unknown>(null)
  const [connecting, setConnecting] = useState(false)
  const mutation = useMutation({
    mutationFn: () => provisionRepository(project.id, providerToken!),
    onSuccess: onChange,
  })
  const url = githubUrl(project.github_repo_url)
  return (
    <div className="github-panel">
      <div className="section-heading">
        <h3>
          <Github size={19} />A home for your code
        </h3>
      </div>
      {url ? (
        <a className="repo-link" href={url} target="_blank" rel="noreferrer">
          {project.github_repo_name}
          <ArrowUpRight size={16} />
        </a>
      ) : (
        <p>
          {project.template_id
            ? 'Turn your chosen template into a GitHub repository, with the first Issues ready to pick up.'
            : 'This project started with a blank canvas. Share code links in the project description as your idea develops.'}
        </p>
      )}
      <ErrorNotice error={error || mutation.error} />
      {mutation.isSuccess && (
        <div className="notice success" role="status">
          <Check size={15} />
          Repository and starter Issues are ready.
        </div>
      )}
      {owner && project.template_id && (
        <>
          {providerToken ? (
            <button
              className="button secondary small"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {url ? <RefreshCw size={15} /> : <Github size={15} />}
              {mutation.isPending
                ? 'Preparing your repository…'
                : url
                  ? 'Finish / sync starter Issues'
                  : 'Create public repository'}
            </button>
          ) : (
            <button
              className="button secondary small"
              disabled={connecting}
              onClick={async () => {
                setConnecting(true)
                try {
                  await onConnect()
                } catch (e) {
                  setError(e)
                  setConnecting(false)
                }
              }}
            >
              <Github size={16} />
              {connecting ? 'Connecting…' : 'Connect GitHub'}
            </button>
          )}
          <p className="field-hint">
            {providerToken
              ? 'Creates a public repository in your account. Existing repositories are never deleted.'
              : 'Use the GitHub account linked to your CollabCode account. Reconnect after a page reload to grant access for this session.'}
          </p>
        </>
      )}
    </div>
  )
}
