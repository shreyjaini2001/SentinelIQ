import { clsx } from 'clsx'
import type { IngestionRun } from '../../types/connectors'

const STATUS_STYLE: Record<string, string> = {
  success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  failed:  'text-red-400 bg-red-500/10 border-red-500/25',
  running: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
  pending: 'text-gray-400 bg-gray-500/10 border-gray-500/25',
}

/** History of ingestion runs (persisted to the backend, newest first). */
export function IngestionRunList({ runs }: { runs: IngestionRun[] }) {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Ingestion Runs</h3>
        <span className="text-[10px] text-gray-600">{runs.length} run{runs.length === 1 ? '' : 's'}</span>
      </div>

      {runs.length === 0 ? (
        <p className="text-xs text-gray-600">No ingestion runs yet. Run a mock sync to create one.</p>
      ) : (
        <div className="space-y-1.5">
          {runs.map((run) => (
            <div key={run.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-700/40 bg-gray-900/40">
              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border shrink-0', STATUS_STYLE[run.status] ?? STATUS_STYLE.pending)}>
                {run.status}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-200 truncate">{run.connectorName}</div>
                <div className="text-[10px] text-gray-600 font-mono">
                  {run.startedAt.replace('T', ' ').slice(0, 16)} · mode: {run.mode}
                </div>
              </div>
              <div className="text-right shrink-0 text-[10px] text-gray-500 font-mono">
                {run.status === 'success' ? (
                  <>
                    <div>{run.recordsNormalized} normalized</div>
                    <div className="text-gray-600">{run.alertsCreated} alerts · {run.recordsFetched} fetched</div>
                  </>
                ) : (
                  <div className="text-red-400/80 max-w-[220px] truncate">{run.errors[0] ?? 'no records'}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
