import { useState, type FormEvent } from 'react'
import { ArrowRight, GitFork as Github, LoaderCircle } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { signIn, signInWithGithub, signUp } from '@/features/auth/api/auth'
import { ErrorNotice } from '@/components/ui/feedback'

export function AuthForm({ register = false }: { register?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const candidate = params.get('next') || '/workspace'
  const next =
    candidate.startsWith('/') &&
    !candidate.startsWith('//') &&
    !candidate.includes('\\') &&
    !candidate.startsWith('/auth')
      ? candidate
      : '/workspace'
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    try {
      if (register) {
        const data = await signUp(
          String(form.get('email')),
          String(form.get('password')),
          String(form.get('name')),
        )
        if (!data.session) {
          setMessage('Check your inbox to confirm your email. Then come back and sign in.')
          return
        }
      } else await signIn(String(form.get('email')), String(form.get('password')))
      navigate(next, { replace: true })
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="auth-card">
      <div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div>
      <h1>{register ? 'A place for your ideas.' : 'Good to see you again.'}</h1>
      <p>
        {register
          ? 'Join people who believe in building things together.'
          : 'Your people. Your projects. Your possibilities.'}
      </p>
      <button
        className="button github-button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await signInWithGithub(next)
          } catch (e) {
            setError(e)
            setBusy(false)
          }
        }}
      >
        <Github size={19} />
        Continue with GitHub
      </button>
      <div className="form-divider">
        <span>or with your email</span>
      </div>
      <form onSubmit={submit}>
        {register && (
          <label>
            Your name
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              placeholder="How should we call you?"
            />
          </label>
        )}
        <label>
          Email address
          <input
            name="email"
            autoComplete="email"
            type="email"
            required
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            required
            minLength={register ? 8 : 1}
            maxLength={128}
            placeholder={register ? 'At least 8 characters' : 'Your password'}
          />
        </label>
        <ErrorNotice error={error} />
        {message && (
          <div className="notice success" role="status">
            {message}
          </div>
        )}
        <button className="button primary full-width" disabled={busy}>
          {busy ? <LoaderCircle size={18} className="spin" /> : <ArrowRight size={18} />}
          {busy ? 'One moment…' : register ? 'Create your account' : 'Sign in'}
        </button>
      </form>
      <p className="auth-switch">
        {register ? 'Already part of the community?' : 'New around here?'}{' '}
        <Link
          to={`${register ? '/auth/login' : '/auth/register'}?next=${encodeURIComponent(next)}`}
        >
          {register ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
      <small className="auth-note">
        Your profile and projects are public. Team tasks stay with your team.
      </small>
    </div>
  )
}
