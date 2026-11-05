import { createClient } from 'npm:@supabase/supabase-js@2.119.0'
import { starterFiles } from './templates.ts'

type Repository = {
  full_name: string
  html_url: string
  default_branch: string
  description: string | null
  owner: { id: number; login: string }
  is_template?: boolean
}
type Issue = { number: number; html_url: string; body: string | null; pull_request?: unknown }

const origins = (
  Deno.env.get('ALLOWED_ORIGINS') ||
  'http://localhost:5173,http://127.0.0.1:5173,https://collab-code-rho-ten.vercel.app'
)
  .split(',')
  .map((s) => s.trim())
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin')
  const cors = {
    'Access-Control-Allow-Origin': origin && origins.includes(origin) ? origin : origins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  if (origin && !origins.includes(origin))
    return json({ error: 'This app origin is not allowed.' }, 403)
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405)

  let release: (() => Promise<void>) | undefined
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer '))
      throw new HttpError(401, 'Sign in to connect GitHub.')
    const url = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!url || !anonKey || !serviceKey)
      throw new HttpError(503, 'The GitHub service is not configured.')
    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const {
      data: { user },
      error: authError,
    } = await caller.auth.getUser(authorization.slice(7))
    if (authError || !user) throw new HttpError(401, 'Your session expired. Please sign in again.')
    const raw = await request.text()
    if (raw.length > 12000) throw new HttpError(413, 'Request too large.')
    let body: { projectId?: unknown; providerToken?: unknown }
    try {
      body = JSON.parse(raw)
    } catch {
      throw new HttpError(400, 'Send valid JSON.')
    }
    const { projectId, providerToken } = body
    if (
      typeof projectId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)
    )
      throw new HttpError(400, 'A valid project is required.')
    if (
      typeof providerToken !== 'string' ||
      providerToken.length < 20 ||
      providerToken.length > 2048
    )
      throw new HttpError(400, 'Reconnect GitHub to authorize repository creation.')
    const { data: project, error: projectError } = await caller
      .from('projects')
      .select('id,owner_id,title,description,template_id,github_repo_name,github_repo_url')
      .eq('id', projectId)
      .single()
    if (projectError || !project) throw new HttpError(404, 'Project not found.')
    if (project.owner_id !== user.id)
      throw new HttpError(403, 'Only the project owner can create its repository.')
    if (!project.template_id) throw new HttpError(400, 'This project has no technology template.')
    const { data: template, error: templateError } = await caller
      .from('templates')
      .select('*')
      .eq('id', project.template_id)
      .single()
    if (templateError || !template)
      throw new HttpError(400, 'The selected template is unavailable.')

    async function github<T>(
      path: string,
      method = 'GET',
      payload?: unknown,
      allowNotFound = false,
    ): Promise<T | null> {
      const response = await fetch('https://api.github.com' + path, {
        method,
        headers: {
          Authorization: 'Bearer ' + providerToken,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2026-03-10',
        },
        body: payload === undefined ? undefined : JSON.stringify(payload),
        signal: AbortSignal.timeout(20_000),
      })
      if (allowNotFound && response.status === 404) return null
      if (!response.ok) {
        // Do not echo GitHub response bodies: they can contain credential or request details.
        const explanation =
          response.status === 401
            ? 'Reconnect GitHub; its authorization expired.'
            : response.status === 403
              ? 'GitHub denied this action. Check repository permissions or wait for its rate limit to reset.'
              : response.status === 422
                ? 'GitHub could not complete this step. The repository may already exist or have changed; retry without deleting it.'
                : 'GitHub is temporarily unavailable. Your project is safe; try again.'
        throw new HttpError(502, explanation)
      }
      return (await response.json()) as T
    }

    const githubUser = (await github<{ id: number; login: string }>('/user'))!
    const identity = user.identities?.find((item) => item.provider === 'github')
    const identityId =
      identity?.identity_data?.provider_id ?? identity?.identity_data?.sub ?? identity?.id
    if (!identity || String(identityId) !== String(githubUser.id))
      throw new HttpError(
        403,
        'Use the GitHub account linked to your signed-in CollabCode account.',
      )

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const leaseId = crypto.randomUUID()
    const { data: claimed, error: claimError } = await admin.rpc('claim_github_provisioning', {
      p_project_id: projectId,
      p_lease_id: leaseId,
    })
    if (claimError)
      throw new HttpError(500, 'Could not reserve repository setup. Please try again.')
    if (!claimed)
      throw new HttpError(
        409,
        'Repository setup is already running. Wait a few minutes before trying again.',
      )
    release = async () => {
      await admin
        .from('github_provisioning')
        .update({ locked_until: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('lease_id', leaseId)
    }
    // The immutable ID keeps retries stable even if the project title changes.
    const name = 'collabcode-' + project.id
    const fullName = project.github_repo_name || githubUser.login + '/' + name
    if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(fullName))
      throw new HttpError(400, 'Invalid repository reference.')
    if (fullName.split('/')[0].toLowerCase() !== githubUser.login.toLowerCase())
      throw new HttpError(403, 'This repository belongs to a different GitHub account.')
    const marker = 'CollabCode project ' + project.id
    let repository = await github<Repository>('/repos/' + fullName, 'GET', undefined, true)
    if (repository && !project.github_repo_name && !repository.description?.includes(marker))
      throw new HttpError(
        409,
        'A repository with this name already exists and is not linked to this project.',
      )
    if (!repository) {
      if (project.github_repo_name)
        throw new HttpError(
          409,
          'The linked repository was removed or renamed on GitHub. Restore its original name to resume; no replacement was created.',
        )
      const description = marker + ' · ' + project.title
      if (template.github_template_repo) {
        if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(template.github_template_repo))
          throw new HttpError(400, 'Invalid template reference.')
        const source = await github<Repository>('/repos/' + template.github_template_repo)
        if (!source?.is_template)
          throw new HttpError(400, 'The configured GitHub repository must be marked as a template.')
        repository = await github<Repository>(
          '/repos/' + template.github_template_repo + '/generate',
          'POST',
          {
            owner: githubUser.login,
            name,
            description,
            private: false,
            include_all_branches: false,
          },
        )
      } else {
        if (!['react-ts', 'react-supabase', 'dotnet-react'].includes(template.slug))
          throw new HttpError(400, 'This template needs a GitHub template repository.')
        repository = await github<Repository>('/user/repos', 'POST', {
          name,
          description,
          private: false,
          auto_init: true,
          has_issues: true,
        })
      }
    }
    if (!repository || repository.owner.id !== githubUser.id)
      throw new HttpError(403, 'Repository ownership could not be verified.')
    const { data: linked, error: linkError } = await admin
      .from('projects')
      .update({ github_repo_name: repository.full_name, github_repo_url: repository.html_url })
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .select('id')
      .single()
    if (linkError || !linked)
      throw new HttpError(
        500,
        'Repository created, but linking needs another try. Do not delete the repository; retry here.',
      )

    if (!template.github_template_repo) {
      const base = '/repos/' + repository.full_name
      const existingMarker = await github<{ content: string }>(
        base + '/contents/.collabcode.json',
        'GET',
        undefined,
        true,
      )
      if (!existingMarker) {
        const root = await github<{ name: string }[]>(base + '/contents')
        if (!Array.isArray(root) || root.some((item) => item.name !== 'README.md'))
          throw new HttpError(
            409,
            'This repository already contains work. Starter files were not written over it.',
          )
        const branch = encodeURIComponent(repository.default_branch)
        const ref = (await github<{ object: { sha: string } }>(base + '/git/ref/heads/' + branch))!
        const commit = (await github<{ tree: { sha: string }; parents: { sha: string }[] }>(
          base + '/git/commits/' + ref.object.sha,
        ))!
        if (commit.parents.length)
          throw new HttpError(
            409,
            'This repository has been edited since creation. Starter files were not written over your work.',
          )
        const files = starterFiles(template.slug, project.id, project.title)
        const tree = (await github<{ sha: string }>(base + '/git/trees', 'POST', {
          base_tree: commit.tree.sha,
          tree: Object.entries(files).map(([path, content]) => ({
            path,
            mode: '100644',
            type: 'blob',
            content,
          })),
        }))!
        const next = (await github<{ sha: string }>(base + '/git/commits', 'POST', {
          message: 'Set up the CollabCode project foundation',
          tree: tree.sha,
          parents: [ref.object.sha],
        }))!
        await github(base + '/git/refs/heads/' + branch, 'PATCH', { sha: next.sha, force: false })
      } else {
        let parsed: { projectId?: string }
        try {
          parsed = JSON.parse(atob(existingMarker.content.replace(/\s/g, '')))
        } catch {
          throw new HttpError(409, 'The repository marker is invalid. No files were changed.')
        }
        if (parsed.projectId !== projectId)
          throw new HttpError(409, 'This repository was initialized for a different project.')
      }
    }

    const { data: tasks, error: taskError } = await admin
      .from('tasks')
      .select('id,title,description,github_issue_number,template_task_id')
      .eq('project_id', projectId)
      .not('template_task_id', 'is', null)
      .order('position')
    if (taskError) throw new HttpError(500, 'Repository ready; starter Issues need another try.')
    const pending = (tasks || []).filter((task) => !task.github_issue_number)
    const existingIssues: Issue[] = []
    if (pending.length) {
      let complete = false
      for (let page = 1; page <= 10; page++) {
        const issues = (await github<Issue[]>(
          '/repos/' + repository.full_name + '/issues?state=all&per_page=100&page=' + page,
        ))!
        existingIssues.push(...issues.filter((issue) => !issue.pull_request))
        if (issues.length < 100) {
          complete = true
          break
        }
      }
      if (!complete)
        throw new HttpError(
          409,
          'This repository has too many Issues to safely match starter tasks. No duplicate Issues were created.',
        )
    }
    for (const task of pending) {
      const issueMarker = '<!-- collabcode-task:' + task.id + ' -->'
      let issue = existingIssues.find((item) => item.body?.includes(issueMarker))
      if (!issue)
        issue = (await github<Issue>('/repos/' + repository.full_name + '/issues', 'POST', {
          title: task.title,
          body: task.description + '\n\n' + issueMarker,
        }))!
      const { data: saved, error: saveError } = await admin
        .from('tasks')
        .update({ github_issue_number: issue.number, github_issue_url: issue.html_url })
        .eq('id', task.id)
        .eq('project_id', projectId)
        .select('id')
      if (saveError || !saved?.length)
        throw new HttpError(
          500,
          'An Issue was created, but its task link needs another try. Existing Issues will be reused.',
        )
    }
    await admin
      .from('github_provisioning')
      .update({ completed_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('lease_id', leaseId)
    return json({ url: repository.html_url, issues: tasks?.length || 0 })
  } catch (error) {
    return json(
      {
        error:
          error instanceof HttpError
            ? error.message
            : 'Repository setup was interrupted. Your project is saved; please try again.',
      },
      error instanceof HttpError ? error.status : 500,
    )
  } finally {
    if (release)
      await release().catch(() => {
        /* Expiring lease permits safe recovery. Never log credentials. */
      })
  }
})
