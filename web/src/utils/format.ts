export function initials(name?: string | null) {
  return (name || 'Developer')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function relativeDate(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000))
  return days === 0
    ? 'Today'
    : days === 1
      ? 'Yesterday'
      : days < 30
        ? `${days} days ago`
        : new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

export function errorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'message' in error) return String(error.message)
  return 'Something went wrong. Please try again.'
}

export function githubUrl(value?: string | null) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'github.com' ? url.href : undefined
  } catch {
    return undefined
  }
}
