export interface PerformanceMetrics {
  fps: number
  memoryUsageMB: number | null
  timestamp: number
}

type MonitorCallback = (metrics: PerformanceMetrics) => void

class PerformanceMonitor {
  private rafId: number | null = null
  private frameCount = 0
  private lastTime = 0
  private callbacks: Set<MonitorCallback> = new Set()
  private running = false
  private samplingInterval = 1000

  setSamplingInterval(ms: number) {
    this.samplingInterval = ms
  }

  start() {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.frameCount = 0
    this.tick()
  }

  stop() {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  subscribe(cb: MonitorCallback): () => void {
    this.callbacks.add(cb)
    return () => this.callbacks.delete(cb)
  }

  private tick = () => {
    if (!this.running) return
    this.frameCount++
    const now = performance.now()
    const elapsed = now - this.lastTime

    if (elapsed >= this.samplingInterval) {
      const fps = Math.round((this.frameCount * 1000) / elapsed)
      const perf = performance as any
      const memoryUsageMB = perf.memory
        ? Math.round(perf.memory.usedJSHeapSize / (1024 * 1024))
        : null

      const metrics: PerformanceMetrics = { fps, memoryUsageMB, timestamp: now }
      this.callbacks.forEach(cb => cb(metrics))
      this.frameCount = 0
      this.lastTime = now
    }

    this.rafId = requestAnimationFrame(this.tick)
  }
}

export const performanceMonitor = new PerformanceMonitor()
