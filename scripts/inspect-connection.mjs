// Read-only configuration inspection. Prints no keys, tokens, or user information.
import { readFileSync } from 'node:fs'
const env = Object.fromEntries(
  readFileSync(new URL('../web/.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^VITE_SUPABASE_(URL|PUBLISHABLE_KEY)=/.test(line))
    .map((line) => {
      const index = line.indexOf('=')
      return [
        line.slice(0, index),
        line
          .slice(index + 1)
          .trim()
          .replace(/^['"]|['"]$/g, ''),
      ]
    }),
)
const base = env.VITE_SUPABASE_URL
const headers = { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY }
const settings = await fetch(`${base}/auth/v1/settings`, {
  headers,
  signal: AbortSignal.timeout(15000),
})
const auth = await settings.json()
console.log(
  JSON.stringify({
    authStatus: settings.status,
    emailEnabled: auth.external?.email,
    githubEnabled: auth.external?.github,
    signupDisabled: auth.disable_signup,
  }),
)
const technologies = await fetch(`${base}/rest/v1/technologies?select=id,name`, {
  headers,
  signal: AbortSignal.timeout(15000),
})
const catalog = await technologies.json()
console.log(
  JSON.stringify({
    catalogStatus: technologies.status,
    technologyCount: Array.isArray(catalog) ? catalog.length : null,
  }),
)
const tasks = await fetch(`${base}/rest/v1/tasks?select=id&limit=1`, {
  headers,
  signal: AbortSignal.timeout(15000),
})
console.log(JSON.stringify({ anonymousTaskStatus: tasks.status }))
const edge = await fetch(`${base}/functions/v1/provision-github`, {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: '{}',
  signal: AbortSignal.timeout(15000),
})
console.log(JSON.stringify({ unauthenticatedProvisioningStatus: edge.status }))
