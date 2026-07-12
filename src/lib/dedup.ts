import { createHash } from 'crypto'

const DEDUP_TTL_MS = 60_000
const MAX_ENTRIES = 100
const cache = new Map<string, { result: unknown; expiresAt: number }>()

export function hashBuffer(buffer: ArrayBuffer): string {
  return createHash('sha256').update(Buffer.from(buffer)).digest('hex')
}

export function getCached(hash: string): unknown | null {
  const entry = cache.get(hash)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(hash)
    return null
  }
  return entry.result
}

export function setCached(hash: string, result: unknown): void {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(hash, { result, expiresAt: Date.now() + DEDUP_TTL_MS })
}
