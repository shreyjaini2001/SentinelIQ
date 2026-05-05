import { useState } from 'react'
import { clsx } from 'clsx'
import type { BreadcrumbEntry } from '../../types'

interface Props {
  breadcrumbs: BreadcrumbEntry[]
  onRestore?: (entry: BreadcrumbEntry) => void
}

export function SessionBreadcrumb({ breadcrumbs, onRestore }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  if (!breadcrumbs.length) return null

  return (
    <div className="text-xs">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 mb-1"
      >
        <span>{collapsed ? '▶' : '▼'}</span>
        <span>Session history ({breadcrumbs.length})</span>
      </button>

      {!collapsed && (
        <div className="flex items-center gap-1 flex-wrap">
          {breadcrumbs.map((entry, i) => (
            <div key={entry.query_id} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-600">›</span>}
              <button
                onClick={() => onRestore?.(entry)}
                className={clsx(
                  'px-2 py-0.5 rounded text-xs truncate max-w-[180px]',
                  'text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors',
                )}
                title={entry.original_text}
              >
                {entry.original_text.length > 40
                  ? entry.original_text.slice(0, 40) + '…'
                  : entry.original_text}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
