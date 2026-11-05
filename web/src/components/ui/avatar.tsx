import { initials } from '@/utils/format'

export function Avatar({
  name,
  url,
  size = 'md',
}: {
  name?: string | null
  url?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const safeUrl = url?.startsWith('https://') ? url : undefined
  return (
    <span className={`avatar avatar-${size}`} aria-label={name || 'Developer'}>
      {safeUrl ? (
        <img
          src={safeUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : null}
      <span>{initials(name)}</span>
    </span>
  )
}
