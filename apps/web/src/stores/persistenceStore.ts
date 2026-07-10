import { create } from 'zustand'
import type { BackendStatus, StorageMode } from '../types/persistence'

/**
 * Non-persisted status surface for the local demo persistence layer (v1.2.0). Drives the
 * PersistenceStatusCard and any subtle indicators. This is UI status only — it never holds
 * domain data.
 */
interface PersistenceStatusState {
  backend: BackendStatus
  storageMode: StorageMode
  lastSavedAt: string | null
  lastError: string | null
  hydrated: boolean
  saving: boolean

  setBackend: (backend: BackendStatus) => void
  setStorageMode: (mode: StorageMode) => void
  markSaved: (at: string) => void
  setSaving: (saving: boolean) => void
  setError: (message: string | null) => void
  setHydrated: (hydrated: boolean) => void
}

export const usePersistenceStore = create<PersistenceStatusState>((set) => ({
  backend: 'idle',
  storageMode: 'browser-fallback',
  lastSavedAt: null,
  lastError: null,
  hydrated: false,
  saving: false,

  setBackend: (backend) => set({ backend }),
  setStorageMode: (storageMode) => set({ storageMode }),
  markSaved: (lastSavedAt) => set({ lastSavedAt, backend: 'connected', lastError: null }),
  setSaving: (saving) => set({ saving }),
  setError: (lastError) => set({ lastError }),
  setHydrated: (hydrated) => set({ hydrated }),
}))
