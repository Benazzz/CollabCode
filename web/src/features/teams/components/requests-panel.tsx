import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ArrowUpRight, Check, Send, X } from 'lucide-react'
import {
  requestToJoin,
  reviewRequest,
  useRequests,
  withdrawRequest,
} from '@/features/teams/api/teams'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState, ErrorNotice, Loading } from '@/components/ui/feedback'
import { useAuth } from '@/hooks/use-auth'
import { relativeDate } from '@/utils/format'

export function RequestsPanel({
  projectId,
  onChange,
}: {
  projectId: string
  onChange: () => void
}) {
  const requests = useRequests(projectId)
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) =>
      reviewRequest(id, status),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['requests'] })
      onChange()
    },
  })
  if (requests.isLoading) return <Loading />
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>A new perspective for your team</h2>
          <p>Meet the people who’d like to build with you.</p>
        </div>
      </div>
      <ErrorNotice error={requests.error || mutation.error} />
      {requests.data?.length ? (
        <div className="requests-list">
          {requests.data.map((request) => (
            <article className="request-card" key={request.id}>
              <div className="request-heading">
                <Link to={`/people/${request.profile_id}`} className="member-person">
                  <Avatar name={request.profiles?.full_name} url={request.profiles?.avatar_url} />
                  <div>
                    <strong>{request.profiles?.full_name}</strong>
                    <span>{relativeDate(request.created_at)}</span>
                  </div>
                </Link>
                <span className={`request-status ${request.status}`}>{request.status}</span>
              </div>
              <p className="prose">{request.message}</p>
              {request.status === 'pending' && (
                <div className="request-actions">
                  <button
                    className="button secondary small"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: request.id, status: 'rejected' })}
                  >
                    <X size={15} />
                    Decline
                  </button>
                  <button
                    className="button primary small"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: request.id, status: 'accepted' })}
                  >
                    <Check size={15} />
                    Welcome to the team
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        !requests.error && (
          <EmptyState title="The next hello is on its way.">
            Requests to join your project will appear here.
          </EmptyState>
        )
      )}
    </section>
  )
}

export function JoinProject({ projectId, recruiting }: { projectId: string; recruiting: boolean }) {
  const { session } = useAuth()
  const requests = useRequests(projectId)
  const client = useQueryClient()
  const [message, setMessage] = useState('')
  const mutation = useMutation({
    mutationFn: () => requestToJoin(projectId, session!.user.id, message.trim()),
    onSuccess: () => client.invalidateQueries({ queryKey: ['requests'] }),
  })
  const withdrawal = useMutation({
    mutationFn: withdrawRequest,
    onSuccess: () => client.invalidateQueries({ queryKey: ['requests'] }),
  })
  const request = requests.data?.find((r) => r.profile_id === session?.user.id)
  function submit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate()
  }
  return (
    <div className="join-card">
      <div className="eyebrow">BRING YOUR PERSPECTIVE</div>
      <h3>
        Something you’d like
        <br />
        to be part of?
      </h3>
      <ErrorNotice error={requests.error || mutation.error || withdrawal.error} />
      {!session ? (
        <>
          <p>Sign in to introduce yourself and ask to join the team.</p>
          <Link
            className="button primary"
            to={`/auth/login?next=${encodeURIComponent(`/projects/${projectId}`)}`}
          >
            Join the conversation <ArrowUpRight size={16} />
          </Link>
        </>
      ) : requests.isLoading ? (
        <Loading />
      ) : request ? (
        <>
          <div className={`notice ${request.status === 'accepted' ? 'success' : ''}`} role="status">
            Your request is {request.status}.
          </div>
          <p>
            {request.status === 'pending'
              ? 'Your introduction is with the project owner. You can follow its status in My workspace.'
              : request.status === 'rejected'
                ? 'This one wasn’t a fit this time. You can withdraw this request and send a new introduction.'
                : 'Your earlier request was accepted. If your membership has ended, clear it to introduce yourself again.'}
          </p>
          <button
            className="button secondary small"
            disabled={withdrawal.isPending}
            onClick={() => withdrawal.mutate(request.id)}
          >
            {request.status === 'accepted' ? 'Clear previous request' : 'Withdraw request'}
          </button>
        </>
      ) : !recruiting ? (
        <p>This project isn’t looking for new teammates right now. Check back another time.</p>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="join-message">
            A little introduction
            <textarea
              id="join-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              minLength={10}
              maxLength={2000}
              required
              rows={4}
              placeholder="What excites you about this project? What would you bring?"
            />
          </label>
          <button
            className="button primary full-width"
            disabled={mutation.isPending || Boolean(requests.error)}
          >
            <Send size={15} />
            {mutation.isPending ? 'Sending…' : 'Ask to join'}
          </button>
          <p className="field-hint">Only you and the project owner can read your introduction.</p>
        </form>
      )}
    </div>
  )
}

export function OutgoingRequests() {
  const requests = useRequests()
  if (requests.isLoading) return <Loading />
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Your introductions</h2>
      </div>
      <ErrorNotice error={requests.error} />
      {requests.data?.length ? (
        <div className="outgoing-list">
          {requests.data.map((request) => (
            <Link to={`/projects/${request.project_id}`} key={request.id}>
              <div>
                <strong>{request.projects?.title || 'Project'}</strong>
                <small>Sent {relativeDate(request.created_at).toLowerCase()}</small>
              </div>
              <span className={`request-status ${request.status}`}>{request.status}</span>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </div>
      ) : (
        !requests.error && (
          <p className="muted">
            When you ask to join a project, you can follow your introduction here.
          </p>
        )
      )}
    </section>
  )
}
