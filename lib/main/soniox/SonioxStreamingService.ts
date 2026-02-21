import { SonioxNodeClient, RealtimeSttSession } from '@soniox/node'
import { EventEmitter } from 'events'

interface SonioxToken {
  text: string
  is_final: boolean
}

export interface SonioxEvents {
  token: (token: SonioxToken) => void
  'final-text': (text: string) => void
  finished: () => void
  error: (error: Error) => void
}

export class SonioxStreamingService extends EventEmitter {
  private client: SonioxNodeClient | null = null
  private session: RealtimeSttSession | null = null
  private isActive = false
  private accumulatedText = ''

  async start(tempApiKey: string): Promise<void> {
    if (this.isActive) {
      console.warn(
        '[SonioxStreaming] Already active, stopping previous session',
      )
      await this.stop()
    }

    this.accumulatedText = ''
    this.client = new SonioxNodeClient({ api_key: tempApiKey })

    this.session = this.client.realtime.stt({
      model: 'stt-rt-v4',
      audio_format: 'pcm_s16le',
      sample_rate: 16000,
      num_channels: 1,
      enable_endpoint_detection: true,
      language_hints: ['fr'],
    })

    this.session.on('result', result => {
      if (result.tokens && result.tokens.length > 0) {
        for (const token of result.tokens) {
          this.emit('token', {
            text: token.text,
            is_final: token.is_final,
          })
          if (token.is_final) {
            this.accumulatedText += token.text
          }
        }
        this.emit('final-text', this.accumulatedText)
      }
    })

    this.session.on('finished', () => {
      console.log('[SonioxStreaming] Session finished')
      this.emit('finished')
    })

    this.session.on('error', (error: Error) => {
      console.error('[SonioxStreaming] Error:', error)
      this.emit('error', error)
    })

    await this.session.connect()
    this.isActive = true
    console.log('[SonioxStreaming] Session started')
  }

  sendAudio(chunk: Buffer): void {
    if (!this.isActive || !this.session) return
    this.session.sendAudio(chunk)
  }

  async stop(): Promise<string> {
    if (!this.isActive || !this.session) {
      return this.accumulatedText
    }

    try {
      await this.session.finish()
      this.session.close()
    } catch (error) {
      console.error('[SonioxStreaming] Error during stop:', error)
    }

    this.isActive = false
    this.session = null
    this.client = null

    const finalText = this.accumulatedText
    console.log(
      '[SonioxStreaming] Session stopped, final text length:',
      finalText.length,
    )
    return finalText
  }

  cancel(): void {
    if (!this.session) return
    try {
      this.session.close()
    } catch (error) {
      console.error('[SonioxStreaming] Error during cancel:', error)
    }
    this.isActive = false
    this.session = null
    this.client = null
    this.accumulatedText = ''
  }

  getAccumulatedText(): string {
    return this.accumulatedText
  }

  isCurrentlyActive(): boolean {
    return this.isActive
  }
}
