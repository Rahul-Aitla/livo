const requestLog = new Map<string, number[]>()

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 10
const MAX_IPS = 10_000

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  let timestamps = requestLog.get(ip) || []
  timestamps = timestamps.filter((t) => t > windowStart)
  timestamps.push(now)
  requestLog.set(ip, timestamps)

  if (timestamps.length > MAX_REQUESTS) {
    const oldest = timestamps[0]
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((oldest + WINDOW_MS - now) / 1000),
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - timestamps.length,
    resetIn: 0,
  }
}

setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS * 2
  for (const [ip, timestamps] of requestLog.entries()) {
    const valid = timestamps.filter((t) => t > cutoff)
    if (valid.length === 0) {
      requestLog.delete(ip)
    } else {
      requestLog.set(ip, valid)
    }
  }
  if (requestLog.size > MAX_IPS) {
    const toEvict = requestLog.size - MAX_IPS
    const keys = Array.from(requestLog.keys())
    for (let i = 0; i < toEvict; i++) {
      requestLog.delete(keys[i])
    }
  }
}, 60_000)
