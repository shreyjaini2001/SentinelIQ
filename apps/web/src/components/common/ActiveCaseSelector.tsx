import { useInvestigationStore } from '../../stores/investigationStore'

interface Props {
  /** Selected case id, or null for scratch (no case). */
  value: string | null
  onChange: (caseId: string | null) => void
  label?: string
  className?: string
}

/**
 * Reusable case destination picker. Lists all investigations plus an explicit
 * "No case (scratch)" option so save/link actions always have a clear destination.
 */
export function ActiveCaseSelector({ value, onChange, label, className }: Props) {
  const investigations = useInvestigationStore((s) => s.investigations)

  return (
    <label className={className}>
      {label && <span className="text-[10px] text-gray-500 mr-2">{label}</span>}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="text-[11px] bg-gray-800/60 text-gray-300 border border-gray-700/40 rounded px-2 py-0.5 outline-none focus:border-gray-600 transition-colors"
      >
        <option value="">No case (scratch)</option>
        {investigations.map((inv) => (
          <option key={inv.id} value={inv.id}>
            {inv.title} ({inv.severity})
          </option>
        ))}
      </select>
    </label>
  )
}
