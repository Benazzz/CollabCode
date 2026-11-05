export function TagPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { id: number; name: string }[]
  selected: number[]
  onChange: (ids: number[]) => void
}) {
  return (
    <fieldset className="tag-picker">
      <legend>{label}</legend>
      <div className="tag-options">
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            className={`tag ${selected.includes(option.id) ? 'selected' : ''}`}
            aria-pressed={selected.includes(option.id)}
            onClick={() =>
              onChange(
                selected.includes(option.id)
                  ? selected.filter((id) => id !== option.id)
                  : [...selected, option.id],
              )
            }
          >
            {option.name}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
