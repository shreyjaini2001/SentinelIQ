import { clsx } from 'clsx'
import type { MockQueryResult } from '../../utils/mockResults'

// Columns that carry forensic value get colored text to aid scanning
const COLUMN_COLOR: Record<string, string> = {
  userprincipalname: 'text-cyan-300',
  accountname:       'text-cyan-300',
  targetusername:    'text-cyan-300',
  subjectusername:   'text-cyan-300',
  ipaddress:         'text-red-400',
  remoteip:          'text-red-400',
  computer:          'text-blue-400',
  devicename:        'text-blue-400',
  remotedevicename:  'text-blue-400',
  processcommandline:'text-amber-300',
  commandline:       'text-amber-300',
  filename:          'text-orange-400',
  location:          'text-emerald-400',
  eventid:           'text-purple-400',
  resulttype:        'text-red-400',
  actiontype:        'text-gray-300',
}

const HIGHLIGHT_HEADERS = new Set([
  'userprincipalname', 'accountname', 'targetusername', 'subjectusername',
  'ipaddress', 'remoteip', 'computer', 'devicename', 'remotedevicename',
  'processcommandline', 'commandline', 'filename', 'location', 'eventid', 'resulttype',
])

function colKey(name: string) {
  return name.toLowerCase().replace(/\s+/g, '')
}

interface Props {
  result: MockQueryResult
  maxRows?: number
}

export function QueryResultTable({ result, maxRows }: Props) {
  const displayRows = maxRows ? result.rows.slice(0, maxRows) : result.rows

  return (
    <div>
      {/* Meta row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-300">
          {result.sourceTable}
        </span>
        <span className="text-[10px] text-gray-500">{result.rowCount} rows</span>
        <span className="text-[10px] text-gray-700">·</span>
        <span className="text-[10px] text-gray-500">{result.queryTimeMs}ms</span>
        <span className="text-[10px] text-gray-700">·</span>
        <span className="text-[10px] text-gray-600">Mock · Fixture data</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="border-b border-gray-700/50">
              {result.columns.map((col) => (
                <th
                  key={col}
                  className={clsx(
                    'text-left text-[10px] font-semibold uppercase tracking-wider pb-2 pr-4 whitespace-nowrap',
                    HIGHLIGHT_HEADERS.has(colKey(col)) ? 'text-gray-400' : 'text-gray-600',
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={result.columns.length} className="py-6 text-center text-xs text-gray-600">
                  No results returned.
                </td>
              </tr>
            ) : (
              displayRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-800/20 hover:bg-gray-800/20 transition-colors">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      title={cell}
                      className={clsx(
                        'py-1.5 pr-4 text-[11px] font-mono whitespace-nowrap max-w-[260px] truncate',
                        COLUMN_COLOR[colKey(result.columns[j])] ?? 'text-gray-400',
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {maxRows && result.rows.length > maxRows && (
        <p className="text-[10px] text-gray-600 mt-2">
          Showing {maxRows} of {result.rowCount} rows
        </p>
      )}
    </div>
  )
}
