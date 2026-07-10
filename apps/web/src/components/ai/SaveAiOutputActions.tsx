import { useState } from 'react'
import type { AiOrchestrationResult } from '../../types/aiOrchestration'
import { useInvestigationStore } from '../../stores/investigationStore'
import { useSessionStore } from '../../stores/sessionStore'

interface Props {
  orchestration: AiOrchestrationResult
  content?: string
}

export function SaveAiOutputActions({ orchestration, content }: Props) {
  const [savedNote,    setSavedNote]    = useState(false)
  const [savedFinding, setSavedFinding] = useState(false)
  const [copied,       setCopied]       = useState(false)

  const { addNote, addPinnedFinding } = useInvestigationStore()
  const clear = useSessionStore((s) => s.clear)

  const disabled = !orchestration.hasActiveInvestigation
  const text = content ?? orchestration.intent

  const handleSaveNote = () => {
    const noteText = content
      ? `[${orchestration.intent}] ${content.slice(0, 500)}`
      : `[${orchestration.intent}] AI-generated result`
    addNote(noteText)
    setSavedNote(true)
    setTimeout(() => setSavedNote(false), 2000)
  }

  const handlePinFinding = () => {
    const firstSentence = text.split(/[.!?]/)[0]?.trim() ?? text.slice(0, 100)
    addPinnedFinding(firstSentence)
    setSavedFinding(true)
    setTimeout(() => setSavedFinding(false), 2000)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const base = 'text-xs px-2.5 py-1.5 rounded-lg border transition-colors'
  const active = `${base} border-gray-700/60 text-gray-400 hover:text-gray-200 hover:border-gray-600`
  const off    = `${base} border-gray-700/30 text-gray-700 cursor-not-allowed`

  return (
    <div className="flex items-center flex-wrap gap-2">
      <button
        onClick={handleSaveNote}
        disabled={disabled}
        className={disabled ? off : active}
        title={disabled ? 'No active investigation' : 'Save as note in active case'}
      >
        {savedNote ? 'Saved ✓' : 'Save as Note'}
      </button>
      <button
        onClick={handlePinFinding}
        disabled={disabled}
        className={disabled ? off : active}
        title={disabled ? 'No active investigation' : 'Pin as finding in active case'}
      >
        {savedFinding ? 'Pinned ✓' : 'Pin as Finding'}
      </button>
      <button onClick={() => void handleCopy()} className={active}>
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
      <button
        onClick={clear}
        className={`${base} border-gray-700/30 text-gray-600 hover:text-gray-400 hover:border-gray-700/60`}
      >
        Dismiss
      </button>
    </div>
  )
}
