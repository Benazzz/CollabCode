import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { ErrorNotice } from '@/components/ui/feedback'

export function ConfirmDialog({
  title,
  description,
  label,
  onConfirm,
  onClose,
}: {
  title: string
  description: string
  label: string
  onConfirm: () => Promise<unknown>
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  useEffect(() => {
    dialog.current?.showModal()
    return () => dialog.current?.close()
  }, [])
  return (
    <dialog
      ref={dialog}
      className="dialog"
      onCancel={(event) => {
        if (busy) event.preventDefault()
        else onClose()
      }}
    >
      <div className="dialog-header">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close confirmation"
          disabled={busy}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <p>{description}</p>
      <ErrorNotice error={error} />
      <div className="form-actions">
        <button className="button secondary" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button
          className="button danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onConfirm()
              onClose()
            } catch (e) {
              setError(e)
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Working…' : label}
        </button>
      </div>
    </dialog>
  )
}
