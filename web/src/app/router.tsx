import { lazy, Suspense, useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router'
import { AppShell } from '@/components/layouts/app-shell'
import { ErrorNotice, Loading, NotFound } from '@/components/ui/feedback'
import { useAuth } from '@/hooks/use-auth'
import { useProfile } from '@/features/profiles/api/profiles'
import { signOut } from '@/features/auth/api/auth'
import { isConfigured } from '@/config/env'

const Explore = lazy(() => import('@/app/routes/explore'))
const People = lazy(() => import('@/app/routes/people'))
const Profile = lazy(() => import('@/app/routes/profile'))
const Settings = lazy(() =>
  import('@/app/routes/profile').then((m) => ({ default: m.ProfileSettingsRoute })),
)
const Project = lazy(() => import('@/app/routes/project'))
const CreateProject = lazy(() => import('@/app/routes/create-project'))
const Workspace = lazy(() => import('@/app/routes/workspace'))
const Auth = lazy(() => import('@/app/routes/auth'))
const Callback = lazy(() =>
  import('@/app/routes/auth').then((m) => ({ default: m.AuthCallbackRoute })),
)

function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!session)
    return (
      <Navigate
        to={`/auth/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  return <Outlet />
}
function Layout() {
  const { session } = useAuth()
  const profile = useProfile(session?.user.id)
  const [error, setError] = useState<unknown>(null)
  const [signingOut, setSigningOut] = useState(false)
  const navigate = useNavigate()
  return (
    <>
      <ErrorNotice error={error} />
      <AppShell
        profile={profile.data}
        signedIn={Boolean(session)}
        signingOut={signingOut}
        onSignOut={() => {
          if (signingOut) return
          setError(null)
          setSigningOut(true)
          void signOut()
            .then(() => navigate('/projects', { replace: true }))
            .catch(setError)
            .finally(() => setSigningOut(false))
        }}
      />
    </>
  )
}
function PageEffects() {
  const location = useLocation()
  useEffect(() => {
    const title = location.pathname.startsWith('/people')
      ? 'Find your people'
      : location.pathname.startsWith('/workspace')
        ? 'My workspace'
        : location.pathname.startsWith('/settings')
          ? 'Your profile'
          : location.pathname.startsWith('/auth')
            ? 'Welcome'
            : location.pathname === '/projects/new'
              ? 'Plant an idea'
              : 'Build something together'
    document.title = `${title} · CollabCode`
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])
  return null
}
export function AppRouter() {
  if (!isConfigured)
    return (
      <main className="setup-screen">
        <span className="note-seal">始</span>
        <h1>A little setup, then we build.</h1>
        <p>
          Add the two public Supabase settings from <code>web/.env.example</code> to{' '}
          <code>web/.env.local</code>, then restart the development server.
        </p>
      </main>
    )
  return (
    <BrowserRouter>
      <PageEffects />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Explore />} />
            <Route path="projects" element={<Explore />} />
            <Route path="projects/:id" element={<Project />} />
            <Route path="people" element={<People />} />
            <Route path="people/:id" element={<Profile />} />
            <Route path="auth/login" element={<Auth />} />
            <Route path="auth/register" element={<Auth />} />
            <Route path="auth/callback" element={<Callback />} />
            <Route element={<ProtectedRoute />}>
              <Route path="projects/new" element={<CreateProject />} />
              <Route path="workspace" element={<Workspace />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
