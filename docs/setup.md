# Setup and deployment

## Existing environment

| Service                | Configuration                                          |
| ---------------------- | ------------------------------------------------------ |
| Supabase               | `amydquqvhsobvmqmkfce`, EU West 1                      |
| Frontend               | React + TypeScript + Vite in `web/`                    |
| Existing frontend host | `https://collab-code-rho-ten.vercel.app`               |
| Supabase CLI           | Version 3, pinned as a frontend development dependency |
| Edge runtime           | Deno; Supabase JS version pinned in function source    |

The implementation applied the two tracked migrations and deployed `provision-github` to this Supabase project. Do not replay the initial migration manually against it. Local migration versions match the remote migration history.

## GitHub OAuth

Email and GitHub authentication are enabled in the hosted project, confirmed through the public Auth settings endpoint after the user configured the GitHub provider. The steps below document that configuration for future environments. Repository creation requires a GitHub identity linked to the same Supabase user who owns the project.

1. Open [GitHub OAuth Apps](https://github.com/settings/developers) and register an OAuth application for CollabCode.
2. Set the homepage URL to your app origin. For development, `http://localhost:5173` is sufficient.
3. Set the **authorization callback URL** to:

   ```text
   https://amydquqvhsobvmqmkfce.supabase.co/auth/v1/callback
   ```

4. In [Supabase Authentication → Sign In / Providers](https://supabase.com/dashboard/project/amydquqvhsobvmqmkfce/auth/providers), enable GitHub and enter the GitHub OAuth application's **Client ID** and **Client Secret**. Keep the secret there; do not add it to Vite or the repository.
5. In Supabase Authentication → URL Configuration, set the Site URL to the intended deployment and allow callback destinations:

   ```text
   http://localhost:5173/**
   http://127.0.0.1:5173/**
   https://collab-code-rho-ten.vercel.app/auth/callback**
   ```

6. Use the exact origin you allowed when opening the app. Sign in through GitHub, then create a template-based project or open an owned project's repository panel.

The browser requests `read:user`, `user:email`, and `public_repo`. Provisioning creates **public** repositories only. Public repository scope is broader than one repository; the GitHub consent screen explains that scope to the user. A production GitHub App with repository-specific installation permissions can replace this OAuth approach later.

If an email account and GitHub account do not resolve to the same linked Supabase identity, signing in as a different GitHub account will not grant access to an existing user's projects. The Edge Function rejects mismatched identities. Use the linked identity, or explicitly design an authenticated identity-linking workflow before adding that feature.

The provider token is deliberately not persisted. After reloading the browser, use **Connect GitHub** again before provisioning. Supabase login sessions are persisted separately; reconnecting GitHub does not mean the app has signed you out.

## Supabase migrations and types

Use the checked-in CLI, after `npm ci` in `web/`. These PowerShell examples run from the repository root. Read `--help` after upgrading the CLI; v3 uses explicit `--remote` targeting.

```powershell
.\web\node_modules\.bin\supabase.cmd login
.\web\node_modules\.bin\supabase.cmd link amydquqvhsobvmqmkfce
.\web\node_modules\.bin\supabase.cmd migration new descriptive_change_name
```

Inspect the existing schema and author a new additive migration. The initial migrations are already applied and should not be edited to introduce new changes. Before applying a future migration, review its remote target and dry run:

```powershell
.\web\node_modules\.bin\supabase.cmd db push --remote=amydquqvhsobvmqmkfce --dry-run
.\web\node_modules\.bin\supabase.cmd db push --remote=amydquqvhsobvmqmkfce
```

The second command asks for hosted-change confirmation. In an explicitly authorized deployment pipeline, `--yes` is available. Do not use `db reset` against the hosted project, and do not use pruning flags as routine deployment steps.

Generate current frontend contracts after schema changes. Use UTF-8 when saving CLI output in Windows PowerShell:

```powershell
$databaseTypes = .\web\node_modules\.bin\supabase.cmd gen types typescript --schema public --remote=amydquqvhsobvmqmkfce
if ($LASTEXITCODE -ne 0) { throw 'Type generation failed; existing types were preserved.' }
[IO.File]::WriteAllText((Join-Path (Get-Location) 'web/src/types/database.ts'), ($databaseTypes -join [Environment]::NewLine))
```

The Supabase connector's generated-types tool is also suitable. Do not hand-maintain database row types after adding columns.

## Edge Function

The source is `supabase/functions/provision-github/`. Deploy after reviewing changes:

```powershell
.\web\node_modules\.bin\supabase.cmd functions deploy provision-github --remote=amydquqvhsobvmqmkfce --use-api
```

`supabase/config.toml` declares `verify_jwt = false` for this function because it performs its own bearer validation with `auth.getUser` **before** any privileged operation. This is not an anonymous endpoint: unauthenticated POSTs return HTTP 401. Preserve the in-function validation.

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the Edge runtime. Never copy the service key into browser configuration. An optional `ALLOWED_ORIGINS` secret overrides the default comma-separated allowlist:

```text
http://localhost:5173,http://127.0.0.1:5173,https://collab-code-rho-ten.vercel.app
```

When adding a deployment domain, update the function allowlist and the Auth redirect allowlist. CORS does not replace authentication or ownership checks.

### Starter repositories

The three built-in templates create a repository and commit a deterministic starter structure without needing a separate template repository. The .NET option generates a .NET 10 minimal API plus a React frontend. The React + Supabase option contains an empty environment example; it never copies CollabCode's credentials into someone else's repository.

To use your own reviewed GitHub template instead, set `templates.github_template_repo` to `owner/repository` through trusted administration. Mark that repository as a GitHub template. Client roles cannot modify template catalog records. External templates are copied using GitHub's template API and are not overwritten with built-in starter files.

Starter tasks are added when the CollabCode project is created, even if GitHub is not configured. Provisioning later creates Issues for those existing tasks. A partial failure can be retried from the project overview. If GitHub says the repository is still being initialized, wait and retry. No recovery action automatically deletes repositories or Issues.

## Vercel

Frontend changes in this checkout were left local as requested. To publish them when ready:

1. Use the existing GitHub/Vercel project.
2. Set the Vercel **Root Directory** to `web` and framework preset to Vite.
3. Install with `npm ci`, build with `npm run build`, and use output directory `dist`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the relevant environments.
5. Deploy the reviewed commit, then configure its exact domain in Supabase Auth and Edge CORS.

`web/vercel.json` includes the SPA fallback and basic security headers. Do not commit `web/dist` or `.env.local`. Supabase's backend migration/function deployment is independent of a Vercel frontend deployment.

## Local Supabase, if needed

The current frontend points to the hosted Supabase project. A local stack is optional and requires the Supabase CLI's supported container runtime. Use `supabase start --help` before starting it, apply the tracked migrations to the local stack, and use the local API URL and public key in `web/.env.local`. The auth provider's local credentials and callback need separate configuration. No local reset or container setup was performed for this implementation.

## Verification and known limits

`npm run build` performs the requested code-level validation without adding a test suite. `node scripts/inspect-connection.mjs` from the root makes read-only checks and reports booleans/statuses only. It checks Auth provider availability, public technology access, anonymous task access, and unauthenticated provisioning. It does not sign up users or create data.

The latest checks returned catalog HTTP 200 with 18 technologies, anonymous tasks HTTP 401, unauthenticated provisioning HTTP 401, and both email and GitHub enabled. Supabase security advisories were empty after the follow-up migration. End-to-end authenticated workflows and GitHub creation still require a real signed-in user and browser review; they were not represented as completed tests.

The production dependency audit returned zero findings. The full audit reported 10 moderate development-tool findings inherited through ESLint's `minimatch` dependency ([advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)); npm's proposed fixes downgrade major tooling versions. No forced downgrade was applied. Review a compatible upstream tooling update separately; this dependency is not shipped in the browser bundle.

Before your presentation, manually walk through registration, email confirmation, profile skills, project creation, a second user's join request, owner review, task movement/assignment, and a template project's GitHub setup. Inspect desktop and mobile layouts, refresh a deep link after Vercel deployment, and collect actual Lighthouse/HTML validation results if required by the course. Do not report guessed scores.

Discovery currently loads the most recent 200 projects/profiles and filters them locally. Membership-based workspace/profile queries are separate. Add server pagination/search before using this as a large public directory. GitHub setup does not synchronize later task edits or grant repository collaborators. Repository/Issue creation has distributed failure cases: marker recovery and leases reduce duplicate creation, but manually edited/deleted markers or externally renamed repositories require explicit recovery.
