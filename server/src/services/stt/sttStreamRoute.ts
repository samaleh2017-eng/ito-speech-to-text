import { FastifyInstance } from 'fastify'
import { verifySupabaseToken } from '../../auth/supabaseJwt.js'
import { cartesiaClient } from '../../clients/cartesiaClient.js'
import { CartesiaSTTSession } from './cartesiaSTTService.js'
import { getLlmProvider } from '../../clients/providerUtils.js'
import { DEFAULT_ADVANCED_SETTINGS } from '../../constants/generated-defaults.js'
import { createUserPromptWithContext, getPromptForMode } from '../ito/helpers.js'
import type { ItoContext } from '../ito/types.js'
import { ItoMode } from '../../generated/ito_pb.js'

interface StreamConfig {
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
  replacements?: Array<{ from_text: string; to_text: string }>
  userDetails?: any
}

export async function registerSTTStreamRoute(fastify: FastifyInstance, opts: { requireAuth: boolean }) {
  await fastify.register(import('@fastify/websocket'))

  fastify.get('/stt/stream', { websocket: true }, (socket, request) => {
    const startTime = Date.now()
    console.log(`[STT Stream] New WebSocket connection at ${new Date().toISOString()}`)

    let cartesiaSession: CartesiaSTTSession | null = null
    let config: StreamConfig | null = null
    let accumulatedText = ''
    let sessionEnded = false
    let authVerified = !opts.requireAuth

    if (opts.requireAuth) {
      const authHeader = request.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        socket.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }))
        socket.close()
        return
      }
      const token = authHeader.slice(7)
      verifySupabaseToken(token)
        .then(() => {
          authVerified = true
        })
        .catch(() => {
          socket.send(JSON.stringify({ type: 'error', message: 'Invalid token' }))
          socket.close()
        })
    }

    if (!cartesiaClient || !cartesiaClient.isAvailable) {
      socket.send(JSON.stringify({ type: 'error', message: 'Cartesia client not available' }))
      socket.close()
      return
    }

    socket.on('message', async (data: Buffer, isBinary: boolean) => {
      if (sessionEnded) return

      if (!authVerified) {
        return
      }

      if (isBinary) {
        if (cartesiaSession) {
          cartesiaSession.sendAudio(data)
        }
        return
      }

      try {
        const msg = JSON.parse(data.toString())

        if (msg.type === 'config') {
          config = msg as StreamConfig

          cartesiaSession = new CartesiaSTTSession(
            {
              apiKey: cartesiaClient!.apiKey,
              language: config.language || 'fr',
              sampleRate: 16000,
              encoding: 'pcm_s16le',
              model: config.asrModel || 'ink-whisper',
            },
            {
              onMessage: (cartesiaMsg) => {
                if (cartesiaMsg.type === 'transcript') {
                  socket.send(JSON.stringify({
                    type: 'partial',
                    text: cartesiaMsg.text,
                    is_final: cartesiaMsg.is_final,
                  }))

                  if (cartesiaMsg.is_final && cartesiaMsg.text.trim()) {
                    accumulatedText += (accumulatedText ? ' ' : '') + cartesiaMsg.text.trim()
                  }
                } else if (cartesiaMsg.type === 'flush_done') {
                  cartesiaSession?.done()
                } else if (cartesiaMsg.type === 'done') {
                  handleSessionComplete()
                } else if (cartesiaMsg.type === 'error') {
                  socket.send(JSON.stringify({ type: 'error', message: cartesiaMsg.message }))
                }
              },
              onClose: () => {
                console.log('[STT Stream] Cartesia session closed')
              },
              onError: (err) => {
                console.error('[STT Stream] Cartesia error:', err)
                socket.send(JSON.stringify({ type: 'error', message: err.message }))
              },
            }
          )

          try {
            await cartesiaSession.connect()
          } catch (err: any) {
            socket.send(JSON.stringify({ type: 'error', message: `Failed to connect to Cartesia: ${err.message}` }))
            socket.close()
          }
        } else if (msg.type === 'finalize') {
          cartesiaSession?.finalize()
        } else if (msg.type === 'done') {
          cartesiaSession?.finalize()
        }
      } catch (err) {
        console.error('[STT Stream] Failed to parse message:', err)
      }
    })

    async function handleSessionComplete() {
      if (sessionEnded) return
      sessionEnded = true

      const finalTranscript = accumulatedText.trim()
      const duration = Date.now() - startTime

      socket.send(JSON.stringify({ type: 'asr_final', text: finalTranscript }))

      if (!finalTranscript || finalTranscript.length < 2) {
        socket.send(JSON.stringify({ type: 'done' }))
        socket.close()
        return
      }

      const llmProvider = config?.llmProvider
      const llmModel = config?.llmModel

      if (llmProvider && llmModel) {
        try {
          const provider = getLlmProvider(llmProvider)
          const mode = config?.context?.mode ?? 0

          const windowContext: ItoContext = {
            windowTitle: config?.context?.windowTitle || '',
            appName: config?.context?.appName || '',
            contextText: config?.context?.contextText || '',
            browserUrl: config?.context?.browserUrl || '',
            browserDomain: config?.context?.browserDomain || '',
            tonePrompt: config?.context?.tonePrompt || '',
            userDetailsContext: '',
          }

          const advancedSettingsForPrompt = {
            asrModel: config?.asrModel || DEFAULT_ADVANCED_SETTINGS.asrModel,
            asrProvider: 'cartesia',
            asrPrompt: DEFAULT_ADVANCED_SETTINGS.asrPrompt,
            llmProvider: llmProvider || DEFAULT_ADVANCED_SETTINGS.llmProvider,
            llmModel: llmModel || DEFAULT_ADVANCED_SETTINGS.llmModel,
            llmTemperature: config?.llmTemperature ?? DEFAULT_ADVANCED_SETTINGS.llmTemperature,
            transcriptionPrompt: config?.transcriptionPrompt || DEFAULT_ADVANCED_SETTINGS.transcriptionPrompt,
            editingPrompt: config?.editingPrompt || DEFAULT_ADVANCED_SETTINGS.editingPrompt,
            noSpeechThreshold: DEFAULT_ADVANCED_SETTINGS.noSpeechThreshold,
          }

          const temperature = config?.llmTemperature ?? DEFAULT_ADVANCED_SETTINGS.llmTemperature
          const itoMode = mode === 1 ? ItoMode.EDIT : ItoMode.TRANSCRIBE
          const systemPrompt = getPromptForMode(itoMode, advancedSettingsForPrompt, config?.context?.tonePrompt)
          const userPrompt = createUserPromptWithContext(finalTranscript, windowContext)

          const llmResult = await provider.adjustTranscript(userPrompt, {
            prompt: systemPrompt,
            model: llmModel,
            temperature,
          })

          let result = llmResult
          if (config?.replacements?.length) {
            for (const r of config.replacements) {
              result = result.split(r.from_text).join(r.to_text)
            }
          }

          socket.send(JSON.stringify({ type: 'llm_final', text: result }))
        } catch (err: any) {
          console.error('[STT Stream] LLM adjustment failed:', err)
        }
      }

      socket.send(JSON.stringify({ type: 'done' }))

      console.log(`[STT Stream] Session completed in ${duration}ms`)

      cartesiaSession?.close()
      socket.close()
    }

    socket.on('close', () => {
      console.log('[STT Stream] Client disconnected')
      cartesiaSession?.close()
    })

    socket.on('error', (err) => {
      console.error('[STT Stream] Socket error:', err)
      cartesiaSession?.close()
    })
  })
}
