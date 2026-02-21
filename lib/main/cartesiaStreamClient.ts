import WebSocket from 'ws'

export interface CartesiaStreamConfig {
  serverUrl: string
  authToken?: string
  language?: string
  asrModel?: string
  llmProvider?: string
  llmModel?: string
  llmTemperature?: number
  transcriptionPrompt?: string
  editingPrompt?: string
  context?: {
    windowTitle?: string
    appName?: string
    contextText?: string
    browserUrl?: string
    browserDomain?: string
    tonePrompt?: string
    mode?: number
  }
  vocabulary?: string[]
  replacements?: Array<{ from: string; to: string }>
  userDetails?: any
}

export interface StreamingResult {
  type: 'partial' | 'asr_final' | 'llm_final' | 'error' | 'done'
  text?: string
  is_final?: boolean
  message?: string
}

export type StreamingResultCallback = (result: StreamingResult) => void

export class CartesiaStreamClient {
  private ws: WebSocket | null = null
  private isConnected = false
  private config: CartesiaStreamConfig
  private onResult: StreamingResultCallback
  private resolveComplete: ((value: string) => void) | null = null
  private rejectComplete: ((err: Error) => void) | null = null
  private finalText = ''

  constructor(config: CartesiaStreamConfig, onResult: StreamingResultCallback) {
    this.config = config
    this.onResult = onResult
  }

  async connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.resolveComplete = resolve
      this.rejectComplete = reject

      const headers: Record<string, string> = {}
      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`
      }

      this.ws = new WebSocket(this.config.serverUrl, { headers })

      this.ws.on('open', () => {
        console.log('[CartesiaStreamClient] Connected to server')
        this.isConnected = true

        this.ws!.send(JSON.stringify({
          type: 'config',
          language: this.config.language || 'fr',
          asrModel: this.config.asrModel || 'ink-whisper',
          llmProvider: this.config.llmProvider,
          llmModel: this.config.llmModel,
          llmTemperature: this.config.llmTemperature,
          transcriptionPrompt: this.config.transcriptionPrompt,
          editingPrompt: this.config.editingPrompt,
          context: this.config.context,
          vocabulary: this.config.vocabulary,
          replacements: this.config.replacements?.map(r => ({
            from_text: r.from,
            to_text: r.to,
          })),
          userDetails: this.config.userDetails,
        }))
      })

      this.ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString()) as StreamingResult
          this.handleMessage(msg)
        } catch (err) {
          console.error('[CartesiaStreamClient] Failed to parse:', err)
        }
      })

      this.ws.on('close', () => {
        console.log('[CartesiaStreamClient] Disconnected')
        this.isConnected = false
      })

      this.ws.on('error', (err: Error) => {
        console.error('[CartesiaStreamClient] Error:', err)
        this.isConnected = false
        reject(err)
      })
    })
  }

  private handleMessage(msg: StreamingResult) {
    this.onResult(msg)

    switch (msg.type) {
      case 'asr_final':
        this.finalText = msg.text || ''
        break
      case 'llm_final':
        this.finalText = msg.text || this.finalText
        break
      case 'done':
        this.resolveComplete?.(this.finalText)
        break
      case 'error':
        console.error('[CartesiaStreamClient] Server error:', msg.message)
        break
    }
  }

  sendAudio(data: Buffer): void {
    if (this.ws && this.isConnected) {
      this.ws.send(data)
    }
  }

  endAudio(): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({ type: 'done' }))
    }
  }

  cancel(): void {
    if (this.ws) {
      try { this.ws.close() } catch { /* ignore */ }
      this.ws = null
      this.isConnected = false
      this.rejectComplete?.(new Error('Cancelled'))
    }
  }

  get connected(): boolean {
    return this.isConnected
  }
}
