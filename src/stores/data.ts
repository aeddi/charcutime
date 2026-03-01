import { writable, get } from 'svelte/store'
import { loadData, saveData, loadPrefs, savePrefs } from '../lib/storage'
import type { AppData, Prefs, Item, Measurement } from '../lib/types'
import { uuid, nextColor } from '../lib/logic'

// ── Stores ──

export const appData = writable<AppData>(loadData())
export const prefs = writable<Prefs>(loadPrefs())

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
}

export function updateItem(id: string, fields: Omit<Item, 'id' | 'color' | 'measurements'>) {
  appData.update(d => {
    const item = d.items.find(i => i.id === id)
    if (item) Object.assign(item, fields)
    saveData(d)
    return d
  })
}

export function deleteItem(id: string) {
  appData.update(d => {
    d.items = d.items.filter(i => i.id !== id)
    saveData(d)
    return d
  })
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
}

export function deleteMeasurement(itemId: string, index: number) {
  appData.update(d => {
    const item = d.items.find(i => i.id === itemId)
    if (item) item.measurements.splice(index, 1)
    saveData(d)
    return d
  })
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
