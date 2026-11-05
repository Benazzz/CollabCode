import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Save } from 'lucide-react'
import { saveProfile } from '@/features/profiles/api/profiles'
import { TagPicker } from '@/components/ui/tag-picker'
import { ErrorNotice } from '@/components/ui/feedback'
import type { Profile } from '@/types/domain'
import type { Tables } from '@/types/database'

export function ProfileForm({
  profile,
  technologies,
}: {
  profile: Profile
  technologies: Tables<'technologies'>[]
}) {
  const [techIds, setTechIds] = useState(
    profile.profile_technologies.map((item) => item.technology_id),
  )
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: saveProfile,
    onSuccess: () => client.invalidateQueries({ queryKey: ['profiles'] }),
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const text = (key: string) => String(form.get(key) || '').trim()
    mutation.mutate({
      p_full_name: text('name'),
      p_username: text('username'),
      p_headline: text('headline'),
      p_bio: text('bio'),
      p_location: text('location'),
      p_github_username: text('github'),
      p_available: form.get('available') === 'on',
      p_technology_ids: techIds,
    })
  }
  return (
    <form className="form-panel" onSubmit={submit}>
      <div className="section-kicker">
        01 <span>A LITTLE ABOUT YOU</span>
      </div>
      <div className="form-grid">
        <label>
          Full name
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            defaultValue={profile.full_name}
          />
        </label>
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            required
            pattern="[a-zA-Z0-9_-]{3,40}"
            maxLength={40}
            title="3–40 letters, numbers, underscores, or hyphens"
            defaultValue={profile.username}
          />
        </label>
      </div>
      <label>
        What do you do?
        <input
          name="headline"
          maxLength={120}
          placeholder="Frontend developer, curious about the little details"
          defaultValue={profile.headline}
        />
      </label>
      <label>
        Your story
        <textarea
          name="bio"
          rows={5}
          maxLength={2000}
          placeholder="What do you enjoy building? What would you like to learn?"
          defaultValue={profile.bio}
        />
      </label>
      <div className="form-grid">
        <label>
          Location
          <input
            name="location"
            maxLength={100}
            placeholder="Vilnius, Lithuania"
            defaultValue={profile.location}
          />
        </label>
        <label>
          GitHub username
          <input
            name="github"
            maxLength={39}
            pattern="[a-zA-Z0-9-]{1,39}"
            placeholder="your-github-handle"
            defaultValue={profile.github_username || ''}
          />
        </label>
      </div>
      <div className="section-kicker">
        02 <span>WHAT YOU BRING</span>
      </div>
      <TagPicker
        label="Your skills & technologies"
        options={technologies}
        selected={techIds}
        onChange={setTechIds}
      />
      <label className="checkbox-label">
        <input type="checkbox" name="available" defaultChecked={profile.available} />
        I’m open to joining a project
      </label>
      <ErrorNotice error={mutation.error} />
      {mutation.isSuccess && (
        <div className="notice success" role="status">
          <Check size={17} />
          Your profile is up to date.
        </div>
      )}
      <div className="form-actions">
        <p>This information is visible to the community.</p>
        <button className="button primary" disabled={mutation.isPending}>
          <Save size={16} />
          {mutation.isPending ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </form>
  )
}
