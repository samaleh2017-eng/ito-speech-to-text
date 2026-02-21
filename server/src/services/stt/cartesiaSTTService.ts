import WebSocket from 'ws'

export interface CartesiaSTTConfig {
  apiKey: string
  language?: string
  sampleRate?: number
  encoding?: string
  model?: string
}

export interface CartesiaTranscriptMessage {
  type: 'transcript'
  is_final: boolean
  text: string
  words?: Array<{ word: string; start: number; end: number }>
  duration?: number
  language?: string
}

export interface CartesiaFlushDoneMessage {
  type: 'flush_done'
  request_id?: string
}

export interface CartesiaDoneMessage {
  type: 'done'
  request_id?: string
}

export interface CartesiaErrorMessage {
  type: 'error'
  message: string
}

export type CartesiaMessage =
  | CartesiaTranscriptMessage
  | CartesiaFlushDoneMessage
  | CartesiaDoneMessage
  | CartesiaErrorMessage

export type CartesiaMessageCallback = (msg: CartesiaMessage) => void

export class CartesiaSTTSession {
  private ws: WebSocket | null = null
  private config: CartesiaSTTConfig
  private onMessage: CartesiaMessageCallback
  private onClose: () => void
  private onError: (err: Error) => void
  private isConnected = false

  constructor(
    config: CartesiaSTTConfig,
    callbacks: {
      onMessage: CartesiaMessageCallback
      onClose: () => void
      onError: (err: Error) => void
    }
  ) {
    this.config = config
    this.onMessage = callbacks.onMessage
    this.onClose = callbacks.onClose
    this.onError = callbacks.onError
  }

  async connect(): Promise<void> {
    const {
      apiKey,
      language = 'fr',
      sampleRate = 16000,
      encoding = 'pcm_s16le',
      model = 'ink-whisper',
    } = this.config

    const params = new URLSearchParams({
      model,
      language,
      encoding,
      sample_rate: String(sampleRate),
      api_key: apiKey,
    })

    const url = `wss://api.cartesia.ai/stt/websocket?${params.toString()}`

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url)

      this.ws.on('open', () => {
        console.log('[CartesiaSTT] WebSocket connected')
        this.isConnected = true
        resolve()
      })

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const msg = JSON.parse(data.toString()) as CartesiaMessage
          this.onMessage(msg)
        } catch (err) {
          console.error('[CartesiaSTT] Failed to parse message:', err)
        }
      })

      this.ws.on('close', () => {
        console.log('[CartesiaSTT] WebSocket closed')
        this.isConnected = false
        this.onClose()
      })

      this.ws.on('error', (err: Error) => {
        console.error('[CartesiaSTT] WebSocket error:', err)
        this.isConnected = false
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          reject(err)
        }
        this.onError(err)
      })
    })
  }

  sendAudio(data: Buffer | Uint8Array): void {
    if (this.ws && this.isConnected) {
      this.ws.send(data)
    }
  }

  finalize(): void {
    if (this.ws && this.isConnected) {
      this.ws.send('finalize')
    }
  }

  done(): void {
    if (this.ws && this.isConnected) {
      this.ws.send('done')
    }
  }

  close(): void {
    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        // ignore close errors
      }
      this.ws = null
      this.isConnected = false
    }
  }

  get connected(): boolean {
    return this.isConnected
  }
}
