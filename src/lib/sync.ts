// Sync logic: merge strategy Option A — union by id, item with more measurements wins.
import type { AppData, Item } from './types'

/**
 * Merge two datasets. For items with the same id, the version with more
 * measurements wins. Items unique to either side are always kept.
 */
export function mergeData(local: AppData, remote: AppData): AppData {
  const merged = new Map<string, Item>()

  for (const item of local.items) {
    merged.set(item.id, item)
  }

  for (const item of remote.items) {
    const existing = merged.get(item.id)
    if (!existing) {
      merged.set(item.id, item)
    } else if (item.measurements.length > existing.measurements.length) {
      merged.set(item.id, item)
    }
  }

  return { items: Array.from(merged.values()) }
}
