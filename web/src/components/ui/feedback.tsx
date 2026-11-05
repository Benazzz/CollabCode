import { AlertCircle, ArrowRight, LoaderCircle, Sprout } from 'lucide-react'
import { Link } from 'react-router'
import { errorMessage } from '@/utils/format'
import type { ReactNode } from 'react'

export function Loading({ label = 'Getting things ready…' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>{label}</span>
    </div>
  )
}

export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  if (!error) return null
  return (
    <div className="notice error" role="alert">
      <AlertCircle size={18} />
      <div>
        {errorMessage(error)}
        {retry && (
          <button className="text-button" onClick={retry}>
            Try again <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Sprout size={28} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  )
}

export function PageHeading({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow?: string
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action}
    </header>
  )
}

export function NotFound() {
  return (
    <EmptyState
      title="This path leads somewhere else."
      action={
        <Link className="button primary" to="/projects">
          Explore projects <ArrowRight size={16} />
        </Link>
      }
    >
      The page may have moved, or you may not have access to it.
    </EmptyState>
  )
}
