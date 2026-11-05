import { Navigate, useLocation, useSearchParams } from 'react-router'
import { AuthForm } from '@/features/auth/components/auth-form'
import { useAuth } from '@/hooks/use-auth'
import { Loading, ErrorNotice } from '@/components/ui/feedback'
import garden from '@/assets/garden.svg'

export default function AuthRoute() {
  const location = useLocation()
  return (
    <section className="auth-layout">
      <AuthForm key={location.pathname} register={location.pathname === '/auth/register'} />
      <div className="auth-art">
        <img src={garden} alt="A quiet mountain garden" />
        <blockquote>
          Great things grow
          <br />
          from shared beginnings.
        </blockquote>
        <span>一緒に · TOGETHER</span>
      </div>
    </section>
  )
}
export function AuthCallbackRoute() {
  const { session, loading } = useAuth()
  const [params] = useSearchParams()
  const raw = params.get('next') || '/workspace'
  const next =
    raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('\\') && !raw.startsWith('/auth')
      ? raw
      : '/workspace'
  if (loading) return <Loading label="Finishing your sign-in…" />
  if (session) return <Navigate to={next} replace />
  return (
    <div className="narrow-page">
      <ErrorNotice
        error={
          new Error(
            params.get('error_description') ||
              'The sign-in link expired or could not be completed. Please sign in again.',
          )
        }
      />
      <AuthForm />
    </div>
  )
}
