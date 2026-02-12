const KEEP_ALIVE_INTERVAL_MS = 12 * 60 * 1000

let keepAliveTimer: NodeJS.Timeout | null = null

export function startServerKeepAlive(baseUrl: string) {
  if (keepAliveTimer) return
  if (!baseUrl) {
    console.warn('[KeepAlive] No base URL provided, skipping')
    return
  }

  const ping = async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      await fetch(`${baseUrl}/`, { signal: controller.signal })
      console.log('[KeepAlive] Server ping successful')
    } catch (err) {
      console.warn('[KeepAlive] Server ping failed:', err)
    } finally {
      clearTimeout(timeout)
    }
  }

  ping()
  keepAliveTimer = setInterval(ping, KEEP_ALIVE_INTERVAL_MS)
  console.log(`[KeepAlive] Started (interval: ${KEEP_ALIVE_INTERVAL_MS / 1000}s)`)
}

export function stopServerKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer)
    keepAliveTimer = null
    console.log('[KeepAlive] Stopped')
  }
}
