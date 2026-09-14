/**
 * Recent searches and chats, per tenant, in localStorage.
 *
 * The 2025 sidebar read `search_history` and `learn_conversations` filtered by
 * the signed-in user's email. There are no accounts now, so history is
 * per-browser instead of per-user -- nothing to log into, nothing to leak
 * between tenants, and no schema change.
 *
 * Entries carry their results with them. Re-running a restored search would
 * cost 15-25 seconds and four LLM calls to reproduce an answer the browser
 * already had, so restoring reads from here instead of hitting the pipeline.
 */

export type RecentKind = 'searches' | 'chats'

export interface RecentEntry {
  id: string
  /** Rendered in the sidebar: the query for a search, the first question for a chat. */
  label: string
  at: number
  /** Whatever the page needs to put itself back into this state. */
  payload: unknown
}

/** The 2025 sidebar showed five. */
const MAX_ENTRIES = 5

const RESTORE_KEY = 'alumlo:restore'
export const RECENTS_CHANGED = 'alumlo:recents-changed'
export const RESTORE_REQUESTED = 'alumlo:restore-requested'

const keyFor = (kind: RecentKind, tenantSlug: string) =>
  `alumlo:recent:${kind}:${tenantSlug}`

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage

export function listRecents(kind: RecentKind, tenantSlug: string): RecentEntry[] {
  if (!canUseStorage() || !tenantSlug) return []
  try {
    const raw = window.localStorage.getItem(keyFor(kind, tenantSlug))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as RecentEntry[]) : []
  } catch {
    // A hand-edited or truncated value should not take the sidebar down.
    return []
  }
}

/**
 * Writes the list, dropping the oldest entries until it fits.
 *
 * A result set is a few hundred KB and the quota is ~5MB, so a tenant with a
 * long history can hit QuotaExceededError. Losing the oldest search is a
 * better outcome than failing the write and losing the newest.
 */
function persist(kind: RecentKind, tenantSlug: string, entries: RecentEntry[]) {
  const key = keyFor(kind, tenantSlug)
  let candidate = entries.slice(0, MAX_ENTRIES)

  while (candidate.length > 0) {
    try {
      window.localStorage.setItem(key, JSON.stringify(candidate))
      return
    } catch {
      candidate = candidate.slice(0, candidate.length - 1)
    }
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage is unavailable entirely; history is a convenience, so give up.
  }
}

/** Prepends an entry, replacing any earlier one with the same label. */
export function recordRecent(
  kind: RecentKind,
  tenantSlug: string,
  entry: { label: string; payload: unknown }
): void {
  if (!canUseStorage() || !tenantSlug || !entry.label?.trim()) return

  const existing = listRecents(kind, tenantSlug).filter(
    (e) => e.label.trim().toLowerCase() !== entry.label.trim().toLowerCase()
  )

  const next: RecentEntry[] = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: entry.label.trim(),
      at: Date.now(),
      payload: entry.payload,
    },
    ...existing,
  ]

  persist(kind, tenantSlug, next)
  window.dispatchEvent(new CustomEvent(RECENTS_CHANGED, { detail: { kind, tenantSlug } }))
}

export function getRecent(
  kind: RecentKind,
  tenantSlug: string,
  id: string
): RecentEntry | null {
  return listRecents(kind, tenantSlug).find((e) => e.id === id) ?? null
}

export function clearRecents(kind: RecentKind, tenantSlug: string): void {
  if (!canUseStorage() || !tenantSlug) return
  try {
    window.localStorage.removeItem(keyFor(kind, tenantSlug))
  } catch {
    // Nothing to do; the list simply stays as it is.
  }
  window.dispatchEvent(new CustomEvent(RECENTS_CHANGED, { detail: { kind, tenantSlug } }))
}

/**
 * Asks the page for `kind` to restore an entry.
 *
 * The sidebar may be on a different route than the page that can honour this,
 * so the request is parked in storage as well as announced. A page mounting
 * later picks it up with takePendingRestore().
 */
export function requestRestore(kind: RecentKind, tenantSlug: string, id: string): void {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(RESTORE_KEY, JSON.stringify({ kind, tenantSlug, id }))
  } catch {
    // Fall through to the event, which covers the same-page case.
  }
  window.dispatchEvent(new CustomEvent(RESTORE_REQUESTED, { detail: { kind, tenantSlug, id } }))
}

/** Reads and clears a parked restore request, so it fires once. */
export function takePendingRestore(): { kind: RecentKind; tenantSlug: string; id: string } | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(RESTORE_KEY)
    if (!raw) return null
    window.localStorage.removeItem(RESTORE_KEY)
    const parsed = JSON.parse(raw)
    if (!parsed?.kind || !parsed?.id || !parsed?.tenantSlug) return null
    return parsed
  } catch {
    return null
  }
}

/** "3m ago", "2h ago", "5d ago" -- the sidebar has no room for a timestamp. */
export function relativeTime(at: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - at) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
