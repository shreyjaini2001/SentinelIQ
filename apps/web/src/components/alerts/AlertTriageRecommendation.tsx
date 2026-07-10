import { clsx } from 'clsx'
import type { EnrichedTriageVerdict } from '../../types/alerts'

function DispositionBadge({ disp }: { disp: EnrichedTriageVerdict['triageDisposition'] }) {
  const cfg =
    disp === 'likely_tp' ? 'bg-red-500/15 text-red-400 border-red-500/30'
    : disp === 'likely_fp' ? 'bg-gray-700/60 text-gray-400 border-gray-600/40'
    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  const label = disp === 'likely_tp' ? 'LIKELY TP' : disp === 'likely_fp' ? 'LIKELY FP' : 'UNCERTAIN'
  return <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border', cfg)}>{label}</span>
}

interface Props {
  verdict: EnrichedTriageVerdict
  /** Alert-type-specific next actions (overrides the verdict's generic list when provided). */
  nextActions?: string[]
}

/**
 * The AI triage recommendation block for a single alert: disposition, confidence, reason,
 * evidence used, recommended action, and recommended next actions. Advisory only — nothing
 * here changes state or auto-runs.
 */
export function AlertTriageRecommendation({ verdict, nextActions }: Props) {
  const actions = nextActions && nextActions.length > 0 ? nextActions : verdict.recommendedNextActions

  return (
    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] font-semibold text-purple-400 uppercase tracking-widest">AI Triage Recommendation</span>
        <span className="text-[9px] text-gray-600 font-mono">Mock · External: Off</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <DispositionBadge disp={verdict.triageDisposition} />
        <span className="text-[11px] text-gray-400">
          TP {verdict.tp_probability}% · FP {verdict.fp_probability}% · confidence {verdict.confidence}
        </span>
      </div>

      <p className="text-xs text-gray-300 leading-relaxed">{verdict.reasoning}</p>

      {verdict.influencing_fields.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">Evidence used</span>
          {verdict.influencing_fields.map((f) => (
            <code key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono">{f}</code>
          ))}
        </div>
      )}

      <p className="text-[11px] text-gray-400">
        <span className="text-gray-600 uppercase tracking-wider text-[10px] mr-1.5">Recommended</span>
        {verdict.recommendedAction}
      </p>

      {actions.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Recommended next actions</div>
          <ul className="space-y-0.5">
            {actions.map((a, i) => (
              <li key={i} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                <span className="text-purple-400/70 mt-px">→</span>{a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
