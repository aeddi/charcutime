import { writable, get } from 'svelte/store'
import { loadData, saveData, loadPrefs, savePrefs } from '../lib/storage'
import type { AppData, Prefs, Item, Measurement } from '../lib/types'
import { uuid, nextColor } from '../lib/logic'
import {
  auth, GithubAuthProvider, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  readUserData, writeUserData,
} from '../lib/firebase'

// ── Stores ──

export const appData = writable<AppData>(loadData())
export const prefs = writable<Prefs>(loadPrefs())

export interface SyncState {
  status: 'idle' | 'syncing' | 'error'
  displayName: string | null
  uid: string | null
  lastSynced: string | null
  error: string | null
}

export const syncState = writable<SyncState>({
  status: 'idle',
  displayName: null,
  uid: null,
  lastSynced: null,
  error: null,
})

// Pending conflict to resolve — set by syncNow, consumed by SyncConflictDialog
export interface ConflictPayload {
  local: AppData
  remote: AppData
}

export const pendingConflict = writable<ConflictPayload | null>(null)

// ── Item mutations ──

export function addItem(fields: Omit<Item, 'id' | 'color' | 'measurements'>) {
  appData.update(d => {
    d.items.push({
      ...fields,
      id: uuid(),
      color: nextColor(d.items.map(i => i.color)),
      measurements: [],
    })
    saveData(d)
    return d
  })
  scheduleSyncAfterChange()
}

export function updateItem(id: string, fields: Omit<Item, 'id' | 'color' | 'measurements'>) {
  appData.update(d => {
    const item = d.items.find(i => i.id === id)
    if (item) Object.assign(item, fields)
    saveData(d)
    return d
  })
  scheduleSyncAfterChange()
}

export function deleteItem(id: string) {
  appData.update(d => {
    d.items = d.items.filter(i => i.id !== id)
    saveData(d)
    return d
  })
  scheduleSyncAfterChange()
}

export function addMeasurement(itemId: string, m: Measurement) {
  appData.update(d => {
    const item = d.items.find(i => i.id === itemId)
    if (item) {
      item.measurements.push(m)
      item.measurements.sort((a, b) => a.date.localeCompare(b.date))
    }
    saveData(d)
    return d
  })
  scheduleSyncAfterChange()
}

export function deleteMeasurement(itemId: string, index: number) {
  appData.update(d => {
    const item = d.items.find(i => i.id === itemId)
    if (item) item.measurements.splice(index, 1)
    saveData(d)
    return d
  })
  scheduleSyncAfterChange()
}

// ── Prefs mutations ──

export function updatePrefs(patch: Partial<Prefs>) {
  prefs.update(p => {
    Object.assign(p, patch)
    savePrefs(p)
    return p
  })
}

// ── Export / Import ──

export function exportData() {
  const data = get(appData)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'charcutime_backup.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

export function importDataFromFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target!.result as string) as AppData
        if (!parsed.items || !Array.isArray(parsed.items)) {
          reject(new Error('Invalid file format'))
          return
        }
        appData.set(parsed)
        saveData(parsed)
        resolve()
      } catch {
        reject(new Error('Failed to parse JSON file'))
      }
    }
    reader.readAsText(file)
  })
}

// ── Sync helpers ──

let _syncDebounce: ReturnType<typeof setTimeout> | null = null

function mergeData(local: AppData, remote: AppData): AppData {
  const map = new Map<string, Item>()
  for (const item of local.items) map.set(item.id, item)
  for (const item of remote.items) {
    const existing = map.get(item.id)
    if (!existing || item.measurements.length > existing.measurements.length) {
      map.set(item.id, item)
    }
  }
  return { items: Array.from(map.values()) }
}

async function pushToFirestore(data: AppData) {
  const { uid } = get(syncState)
  if (!uid) return
  syncState.update(s => ({ ...s, status: 'syncing', error: null }))
  try {
    await writeUserData(uid, data)
    syncState.update(s => ({ ...s, status: 'idle', lastSynced: new Date().toISOString() }))
  } catch (e) {
    syncState.update(s => ({ ...s, status: 'error', error: e instanceof Error ? e.message : 'Sync failed' }))
  }
}

/** Auto-sync after data changes (debounced 5 s). */
export function scheduleSyncAfterChange() {
  if (!get(syncState).uid) return
  if (_syncDebounce) clearTimeout(_syncDebounce)
  _syncDebounce = setTimeout(() => pushToFirestore(get(appData)), 5000)
}

/** Full sync: read Firestore, merge/conflict, write back. */
export async function syncNow(opts?: { forceDirection?: 'upload' | 'download' }) {
  const { uid } = get(syncState)
  if (!uid) return
  syncState.update(s => ({ ...s, status: 'syncing', error: null }))
  try {
    const local = get(appData)

    if (opts?.forceDirection === 'upload') {
      await pushToFirestore(local)
      return
    }

    const remote = await readUserData(uid)

    if (opts?.forceDirection === 'download') {
      if (remote) { appData.set(remote); saveData(remote) }
      syncState.update(s => ({ ...s, status: 'idle', lastSynced: new Date().toISOString() }))
      return
    }

    if (!remote || remote.items.length === 0) {
      await pushToFirestore(local)
      return
    }

    if (local.items.length === 0) {
      appData.set(remote)
      saveData(remote)
      syncState.update(s => ({ ...s, status: 'idle', lastSynced: new Date().toISOString() }))
      return
    }

    // Both non-empty — let the UI decide (conflict dialog)
    pendingConflict.set({ local, remote })
    syncState.update(s => ({ ...s, status: 'idle' }))
  } catch (e) {
    syncState.update(s => ({ ...s, status: 'error', error: e instanceof Error ? e.message : 'Sync failed' }))
  }
}

/** Resolve a pending conflict and write the chosen data to both local and Firestore. */
export async function resolveConflict(choice: 'local' | 'remote' | 'merge') {
  const conflict = get(pendingConflict)
  if (!conflict) return
  const { local, remote } = conflict

  const resolved =
    choice === 'local' ? local :
    choice === 'remote' ? remote :
    mergeData(local, remote)

  appData.set(resolved)
  saveData(resolved)
  pendingConflict.set(null)

  await pushToFirestore(resolved)
}

// ── Auth ──

export async function startLogin(provider: 'github' | 'google'): Promise<void> {
  try {
    const p = provider === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider()
    await signInWithPopup(auth, p)
    // onAuthStateChanged will fire and call syncNow
  } catch (e) {
    syncState.update(s => ({ ...s, status: 'error', error: e instanceof Error ? e.message : 'Login failed' }))
  }
}

export async function logout() {
  await signOut(auth)
  // onAuthStateChanged will fire and reset syncState
}

// ── Session restore (Firebase auto-restores from localStorage) ──

onAuthStateChanged(auth, async (user) => {
  if (user) {
    syncState.update(s => ({ ...s, displayName: user.displayName ?? user.email ?? null, uid: user.uid }))
    await syncNow()
  } else {
    syncState.set({ status: 'idle', displayName: null, uid: null, lastSynced: null, error: null })
  }
})
