import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router'
import { LogOut, Trash2 } from 'lucide-react'
import { removeMember, updateMember } from '@/features/teams/api/teams'
import { Avatar } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorNotice } from '@/components/ui/feedback'
import type { Member } from '@/types/domain'

export function TeamPanel({
  members,
  projectId,
  owner,
  userId,
  onChange,
}: {
  members: Member[]
  projectId: string
  owner: boolean
  userId?: string
  onChange: () => void
}) {
  const [removing, setRemoving] = useState<Member | null>(null)
  const mutation = useMutation({
    mutationFn: ({ profileId, role }: { profileId: string; role: 'member' | 'maintainer' }) =>
      updateMember(projectId, profileId, role),
    onSuccess: onChange,
  })
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>The people behind the project</h2>
          <p>
            {members.length} {members.length === 1 ? 'person' : 'people'}, one shared direction.
          </p>
        </div>
      </div>
      <ErrorNotice error={mutation.error} />
      <div className="member-list">
        {members.map((member) => (
          <div key={member.profile_id} className="member-row">
            <Link className="member-person" to={`/people/${member.profile_id}`}>
              <Avatar name={member.profiles?.full_name} url={member.profiles?.avatar_url} />
              <div>
                <strong>
                  {member.profiles?.full_name || 'Developer'}
                  {member.profile_id === userId && <small> (you)</small>}
                </strong>
                <span>{member.profiles?.headline || `@${member.profiles?.username}`}</span>
              </div>
            </Link>
            <div className="member-controls">
              {owner && member.role !== 'owner' ? (
                <select
                  aria-label={`Role for ${member.profiles?.full_name}`}
                  value={member.role}
                  disabled={mutation.isPending}
                  onChange={(e) =>
                    mutation.mutate({
                      profileId: member.profile_id,
                      role: e.target.value as 'member' | 'maintainer',
                    })
                  }
                >
                  <option value="member">Member</option>
                  <option value="maintainer">Maintainer</option>
                </select>
              ) : (
                <span className={`role-badge role-${member.role}`}>{member.role}</span>
              )}
              {member.role !== 'owner' && (owner || member.profile_id === userId) && (
                <button
                  className="icon-button"
                  aria-label={owner ? `Remove ${member.profiles?.full_name}` : 'Leave project'}
                  onClick={() => setRemoving(member)}
                >
                  {owner ? <Trash2 size={16} /> : <LogOut size={16} />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="field-hint">
        All teammates can manage tasks. The owner manages project settings, requests, and
        membership.
      </p>
      {removing && (
        <ConfirmDialog
          title={removing.profile_id === userId ? 'Leave this project?' : 'Remove this teammate?'}
          description="They will lose access to the task board, and their assigned tasks will become unassigned. Their work will remain."
          label={removing.profile_id === userId ? 'Leave project' : 'Remove teammate'}
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await removeMember(projectId, removing.profile_id)
            onChange()
          }}
        />
      )}
    </section>
  )
}
