# CollabCode

**Good things are built together.** CollabCode helps developers find projects and teammates, share skills, organize work, and start a GitHub repository from a technology template.

Created by **Benas Subačius** and **Gustas Čemerka**. The interface is in English, with Japanese-inspired paper, indigo, sage, and vermilion colors.

- [GitHub repository](https://github.com/Benazzz/CollabCode)
- [Supabase project](https://supabase.com/dashboard/project/amydquqvhsobvmqmkfce)
- [Existing Vercel site](https://collab-code-rho-ten.vercel.app/) — frontend changes in this checkout have **not** been deployed by this implementation.
- [Detailed architecture and diagrams](docs/architecture.md)
- [Instructions for AI contributors](AGENTS.md)
- [Configuration and deployment](docs/setup.md)

## What you can do

| Area           | Behavior                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discover       | Search project titles, descriptions, and technologies; filter by stack, status, or beginner friendliness; match projects to your profile skills.                    |
| Authentication | Register and sign in with email/password, confirm email, sign out, or use GitHub OAuth after provider configuration.                                                |
| Projects       | Create, edit, and delete your projects; describe the idea, stack, required skills, experience level, and status.                                                    |
| Profiles       | Edit your public profile and skills; search people by name, technology, and availability.                                                                           |
| Teams          | Send an introduction, track its status, accept/reject applicants, change member roles, remove a teammate, or leave a team.                                          |
| Tasks          | Create/edit/delete tasks, assign teammates, set deadlines, move tasks through To do / In progress / Done, and see shared progress.                                  |
| Realtime       | Refresh boards, project progress, membership, and requests when database events arrive; a 30-second refresh also recovers from disconnects.                         |
| GitHub         | Use React + TypeScript, React + Supabase, or ASP.NET + React starters; create a public repository and linked starter Issues through an authenticated Edge Function. |

All displayed community records come from Supabase. The two inspiration cards are explicitly ideas to start from, not fictional community projects. No demonstration accounts or projects were inserted into the live database.

When signed in, use **Log out** in the top-right header or beneath your profile in the navigation sidebar. Both controls show a pending state while signing out and return you to project discovery on success.

## Run locally

Use Node.js 22.12+ or 24 and npm. The frontend is in **`web/`**.

```powershell
cd web
npm ci
Copy-Item .env.example .env.local
# Fill in your public Supabase URL and publishable key in .env.local.
npm run dev
```

If `.env.local` already exists, preserve it instead of copying over it. The existing checkout has been configured from the two public `VITE_SUPABASE_*` values in the original root `.env`; that root file was preserved and is now ignored by Git.

Open the URL printed by Vite, normally `http://localhost:5173`. For the local preview started during development, use `http://127.0.0.1:5173` while its server is running. Missing environment configuration produces a setup screen instead of a blank page.

```dotenv
VITE_SUPABASE_URL=https://amydquqvhsobvmqmkfce.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Only public configuration belongs in `VITE_*`. GitHub client secrets, database passwords, and Supabase service-role keys never belong in frontend environment variables.

### Commands

Run frontend commands from `web/`:

| Command             | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | Start the Vite development server.                           |
| `npm run build`     | Type-check with TypeScript and produce `web/dist/`.          |
| `npm run typecheck` | Check TypeScript without bundling.                           |
| `npm run preview`   | Serve the production build locally.                          |
| `npm run lint`      | Optional ESLint checks, including architecture boundaries.   |
| `npm run format`    | Format frontend code, Edge Functions, and architecture docs. |

No automated test suite was added, as requested. Build/type checks and read-only database/configuration checks are separate from automated application tests.

## Architecture: what goes where

The organization follows [Bulletproof React’s React/Vite structure](https://github.com/alan2207/bulletproof-react/tree/master/apps/react-vite/src) and its [dependency guidance](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md). We use its feature-oriented approach without copying its demonstration backend or adding unused folders and libraries.

```text
CollabCode/
├── AGENTS.md                   Rules and context for AI contributors
├── README.md                   Starting point for humans
├── docs/
│   ├── architecture.md         Relationships, permissions, flows, diagram changes
│   └── setup.md                OAuth, Supabase, Vercel, operational limits
├── scripts/
│   ├── inspect-connection.mjs  Read-only live configuration inspection
│   └── pin-dependencies.mjs    Align package versions with the lockfile
├── supabase/
│   ├── config.toml            Local stack and Edge Function configuration
│   ├── migrations/            Reproducible schema, policies, functions, catalogs
│   ├── seed.sql               Intentionally no fictional community data
│   └── functions/provision-github/
│       ├── index.ts           Authenticated repository/Issue provisioning
│       ├── templates.ts       Reviewed, deterministic starter source files
│       └── deno.json          Deno configuration and pinned dependency
└── web/
    ├── public/                Files served directly (brand.svg, retained starter assets)
    ├── index.html             HTML shell and social/search metadata
    ├── vercel.json            SPA route fallback and response headers
    ├── eslint-architecture.js Import-direction and feature-boundary rule
    ├── package*.json          Pinned dependencies and npm lockfile
    └── src/
        ├── main.tsx           Mount React once
        ├── app/
        │   ├── app.tsx        Assemble providers and router
        │   ├── provider.tsx   Error boundary, QueryClient, session provider
        │   ├── router.tsx     Lazy routes, protected routes, layout composition
        │   └── routes/        Pages that compose independent features
        ├── assets/            Bundled artwork (garden.svg)
        ├── components/
        │   ├── layouts/       Reusable application shell
        │   └── ui/            Avatar, dialogs, tags, loading/error/empty states
        ├── config/            Environment configuration and route paths
        ├── features/
        │   ├── auth/          Sign-in/sign-up/OAuth API and auth form
        │   ├── projects/      Project API, cards, create/edit form
        │   ├── profiles/      Public profiles, profile API and editing form
        │   ├── teams/         Memberships, join requests, request status
        │   ├── tasks/         Task API, Kanban board and editor
        │   └── github/        Templates, Edge invocation, repository panel
        ├── hooks/             Shared session hook
        ├── lib/               Supabase/Query clients, auth context, skill catalog
        ├── types/             Generated database types and shared domain contracts
        ├── utils/             Pure formatting and safe GitHub URL helpers
        └── index.css          Design tokens, components, responsive styling
```

`src/App.tsx` is a compatibility re-export of `app/app.tsx`; the old starter entry was retained. It is not where new application logic should go. There is no `testing/` or global state-store folder because this version does not need them.

### Import rules

**Shared code → features → app** describes availability: app can use features and shared modules; features can use shared modules and their own files; shared modules cannot import feature or app code. A feature must not import a sibling feature. Use direct file imports through the `@/` alias, without feature-wide barrel files.

For example, `app/routes/project.tsx` combines the project, team, task, and GitHub features. It passes membership data and callbacks into them. `features/tasks` does not reach into `features/teams`. The shared auth context lives in `lib/auth.tsx`, so every feature can obtain the session without importing the auth feature. ESLint enforces these boundaries for alias and relative imports.

### Data and state

- Supabase is the source of truth. Feature `api/` files contain queries and mutations; components use TanStack Query to load and refresh server data.
- Local React state handles filters, dialogs, selected tags, and form feedback. Route/search parameters handle navigation and project tabs.
- `types/database.ts` is generated from the hosted schema. `types/domain.ts` adds shared joined-result shapes and status labels.
- Database transactions handle project creation, template tasks, profile skill updates, and join acceptance. Client UI visibility is never the authorization boundary.
- The CSS variables at the start of `index.css` define the palette; the same stylesheet holds responsive layouts and reduced-motion rules. The illustration is local SVG, with no image-generation dependency.

## Supabase data and permissions

| Table                  | Responsibility                                                                 |
| ---------------------- | ------------------------------------------------------------------------------ |
| `profiles`             | Public developer information; identity key references `auth.users`.            |
| `technologies`         | Shared catalog of languages, frameworks, tools, and skills.                    |
| `profile_technologies` | Technologies associated with a developer.                                      |
| `projects`             | Public idea, owner, template, status, repository link, and aggregate progress. |
| `project_technologies` | Project stack and skills marked as required.                                   |
| `project_members`      | Membership and owner/maintainer/member role.                                   |
| `join_requests`        | Private introductions and their review status.                                 |
| `tasks`                | Team-only Kanban work, assignment, deadlines, and GitHub Issue links.          |
| `templates`            | Approved starter choices; optional external GitHub template reference.         |
| `template_tasks`       | Initial work copied into new template-based projects.                          |
| `github_provisioning`  | Service-only lease to serialize repository setup; no credentials.              |

Guests can read projects, public profiles, membership, and catalogs. A signed-in developer can edit their own profile, create a project, and submit an introduction. All team members can manage tasks. Only owners can edit/delete projects, review requests, or change another member’s role. Maintainer is a team designation with the same task permissions as a member in this MVP. Owners cannot remove/demote themselves. Non-owners can leave; their tasks remain and become unassigned.

The diagram’s `github_connections.access_token` was intentionally replaced with **no database token storage**. A GitHub OAuth provider token is held in memory for the current browser session, stripped before Supabase session persistence, sent over HTTPS to the Edge Function only when requested, and never logged. The server verifies it belongs to the GitHub identity linked to the authenticated project owner. Reconnecting after a reload is intentional.

See [architecture.md](docs/architecture.md) for diagrams, invariants, and implementation details.

## Current setup and verification

The database migrations and `provision-github` Edge Function have been applied to project `amydquqvhsobvmqmkfce`. The migrations include 18 technologies, 3 templates, and 9 template tasks. The hosted security advisor returned no findings after the permissions follow-up.

Read-only checks confirmed public catalog access, blocked anonymous task access, and blocked unauthenticated provisioning. The TypeScript/production build passed. Runtime dependencies returned no npm audit findings at the time of inspection. No test accounts, repositories, or Issues were created for verification.

**Email and GitHub authentication are enabled**, confirmed through the public Auth settings endpoint after the provider was configured. The [setup steps](docs/setup.md#github-oauth) document callback and redirect configuration for future environments. A real-account GitHub login and repository creation have not been exercised end to end.

Visual browser inspection could not be completed: the in-app browser host was unavailable, and native Chrome access timed out. Desktop/mobile layout rules are implemented, but their visual verification remains open.

## Scope and next steps

This is a focused collaborative-project MVP. Discovery searches the 200 most recent projects/profiles; your workspace and profile projects use a separate membership query. Before scaling beyond that, add paginated server-side discovery. There is no chat, notification system, ownership transfer, or bidirectional GitHub synchronization. Starter Issue links are created, but subsequent status changes stay in CollabCode. Joining a CollabCode team does not automatically grant GitHub repository permissions.

The academic brief’s presentation/report, MagicDraw source, Google Trends research, Lighthouse measurements, and submission ZIP/PDF are separate deliverables; this repository includes source, architecture documentation, and reproducible deployment scripts, not invented analysis results.
