# CollabCode — instructions for AI contributors

## Read this first

This is a developer collaboration platform by Benas Subačius and Gustas Čemerka. It connects public project/people discovery with private team task management and optional GitHub starter repositories. The user supplied deployment, ER, and use-case diagrams and requested the Bulletproof React React/Vite architecture. The UI language is **English**.

Read `README.md`, `docs/architecture.md`, and the relevant source before changing behavior. The real frontend is `web/`, not the repository root. Supabase lives in `supabase/`. Do not replace this with another framework or a generic single-file dashboard.

## User constraints and existing work

- Make source changes locally. Do not push, publish the frontend, or change hosting unless requested.
- The user authorized required changes in the existing CollabCode Supabase project (`amydquqvhsobvmqmkfce`). This does not authorize creating paid projects or services.
- Ask before deleting important files, user data, repositories, or other important resources. Preserve unrelated/uncommitted work. Never run a blanket reset or database wipe.
- No automated tests were requested. Do not add a test framework or spend work building a test suite without a new request. Run the production build for relevant code changes and focused non-destructive verification. Run lint when requested; do not claim unperformed checks.
- Avoid manufacturing live demo users, projects, team members, or activity. Catalog/reference data is intentional; inspiration cards are labeled as ideas.
- Do not log or print credentials, copy service-role keys into client code, or commit `.env*` files except `.env.example`.

## Architecture boundaries

Keep dependency availability in one direction: **shared → features → app**.

1. `src/app` composes pages, routes, providers, and features.
2. `src/features/<name>` owns that feature's API access and UI. It may import shared code and files from the same feature only.
3. `components`, `config`, `hooks`, `lib`, `types`, `utils`, and `assets` are shared. They cannot import `features` or `app`.
4. Do not import between sibling features. Compose them in an app route and pass data/callbacks via typed props.
5. Use direct `@/…` file imports. Avoid feature barrel exports and speculative layers.
6. Add feature subfolders only when they contain real code. No empty `stores/`, `testing/`, or elaborate abstractions for future work.

`web/eslint-architecture.js` enforces alias and relative import boundaries. Keep the rule when extending ESLint. `src/App.tsx` is a retained compatibility re-export; composition belongs in `app/app.tsx`.

### Where to work

| Change                                       | Location                                          |
| -------------------------------------------- | ------------------------------------------------- |
| Navigation, auth guard, route metadata       | `web/src/app/router.tsx`                          |
| Page combining multiple domains              | `web/src/app/routes/`                             |
| Sign-in, registration, OAuth starts          | `web/src/features/auth/`                          |
| Project CRUD, cards, forms                   | `web/src/features/projects/`                      |
| Profile CRUD and profile editing             | `web/src/features/profiles/`                      |
| Requests, review, members and roles          | `web/src/features/teams/`                         |
| Kanban, task editor, task API                | `web/src/features/tasks/`                         |
| GitHub template query / invocation UI        | `web/src/features/github/`                        |
| Persistent schema and authorization          | `supabase/migrations/`                            |
| Privileged GitHub orchestration              | `supabase/functions/provision-github/`            |
| Generated Postgres contracts                 | `web/src/types/database.ts`                       |
| Shared joined shapes                         | `web/src/types/domain.ts`                         |
| Session lifetime and provider token handling | `web/src/lib/auth.tsx`, `web/src/lib/supabase.ts` |
| Theme, layout, responsive rules              | `web/src/index.css`                               |

## Frontend conventions

Use React + TypeScript, React Router, TanStack Query, Supabase JS, and the existing plain CSS design system. Packages are pinned; retain the npm lockfile. Prefer native form constraints, semantic HTML, explicit mutation errors, disabled pending actions, and empty/loading states over extra dependencies.

Queries/mutations belong in feature `api/` modules. Auth/session and static technology catalogs are shared infrastructure. Do not query Supabase independently from arbitrary presentational components. Keep query keys user-scoped when reading private data, and clear the query cache on account changes. Keep each realtime subscription's cleanup and recovery refresh.

Pass callbacks to update other features; do not introduce sibling imports to invalidate another feature's cache. User-facing forms must not display internal implementation details unless that information helps the user make a choice. Keep dates and task assignments understandable. Deletion controls require a confirmation dialog describing scope.

Maintain the warm paper / indigo / sage / vermilion palette, restrained serif hero titles, whitespace, visible focus rings, keyboard access, and mobile navigation. The `garden.svg` artwork is code-native. Respect reduced motion. Google Fonts have local system fallbacks; the app must remain usable without font downloads.

## Database invariants

- Every application table has RLS. Exposed tables also need explicit GRANTs; RLS alone does not expose them.
- Guests read public discovery/profile/catalog/membership data, never task bodies or private introductions.
- `projects.owner_id` is canonical and immutable to clients. The owner membership is created in the same transaction and cannot be demoted or removed by clients.
- `save_project` and `save_profile` are SECURITY INVOKER RPCs. Their writes remain subject to the caller's RLS and column privileges.
- Project creation triggers copy approved template tasks. Do not replace this with multiple browser writes.
- Join acceptance runs in a database trigger within the request update transaction. It must leave membership and request status consistent under concurrent reviews.
- Task assignments must reference membership in the same project. Removing a member clears the assignment without deleting their tasks.
- Public `tasks_total` / `tasks_done` use private trigger-maintained counters. Do not expose private task rows to show progress.
- Member and maintainer can manage tasks; owner additionally manages project settings and membership. Do not silently give maintainers owner powers.
- `github_provisioning` is a service-role-only lease table. Never grant ordinary clients access.
- Security-definer helpers belong in the unexposed `private` schema, with fixed search paths and no public EXECUTE privileges. Never authorize using editable `user_metadata`.
- Client grants restrict mutable columns. Do not reintroduce blanket table UPDATE or INSERT privileges that bypass immutable ownership, task project IDs, or repository metadata.

Inspect live tables, policies, migrations, and relevant advisories before changing schema. Create a local migration with the installed Supabase CLI's `migration new` command; inspect `--help` because this checkout pins CLI v3. Remote writes need an explicit target. Keep local migration names/versions matched with hosted migration history. Do not edit already-applied migration contents to represent a new change.

After schema changes, regenerate `types/database.ts`, verify the relevant queries/invariants, and check Supabase advisories. Document every intentional change from the supplied diagrams. Do not use SQL to access server files or OS commands.

## GitHub security and lifecycle

There is intentionally no `github_connections.access_token` table. Provider tokens are held in memory only, removed before writing Supabase sessions to localStorage, and never logged. Reauthentication after a page reload is deliberate. Public GitHub usernames are display information, not trusted identities.

The Edge Function must verify the bearer token through Supabase Auth, check project ownership, retrieve `/user` with the GitHub token, and compare it to the caller's linked GitHub identity before any external mutation. Keep this validation even though deployment uses `verify_jwt = false`: application-level validation supports the project's current JWT signing configuration. Disabling both checks would make it public and is forbidden.

Only database-approved template IDs can be provisioned. Built-in starter content is deterministic. External template references must come from the protected template catalog and must have `is_template = true` on GitHub. Never accept arbitrary repository URLs or executable templates from a browser request.

Keep the provisioning lease, deterministic repository identity, immediate repository-link persistence, marker-based retry recovery, non-forced Git ref updates, and starter-Issue markers. Do not retry by deleting a repository, overwriting existing work, or creating duplicate Issues. GitHub statuses do not synchronize bidirectionally in this version; do not imply otherwise.

Runtime service credentials come from Supabase's Edge environment. Optional `ALLOWED_ORIGINS` is a comma-separated origin allowlist. OAuth Client ID/Secret belong in Supabase provider settings, never in the repo or chat.

## Validation and handoff

From `web/`, run `npm run build` after relevant changes. `npm run typecheck` is available independently. `npm run lint` is optional when requested. No tests were added by the initial implementation. For live read-only checks, run `node scripts/inspect-connection.mjs` from the root; it prints status codes/provider flags, never keys. Review `git diff --check` and the final change list.

Update README and architecture/setup docs when behavior, schema, routes, permissions, configuration, or limitations change. State what was verified and what remains configuration-dependent. Do not claim a browser check, OAuth login, repository creation, mobile audit, or deployment succeeded unless it actually did.

At initial handoff: schema and Edge Function were deployed; email and GitHub auth were confirmed enabled through the public Auth settings endpoint after the user configured GitHub OAuth; no real-account GitHub login or provisioning was exercised. Browser preview access was unavailable. Recheck these facts when continuing rather than assuming they remain current.
