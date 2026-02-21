import { ItoMode } from '@/app/generated/ito_pb'
import { voiceInputService } from './voiceInputService'
import { recordingStateNotifier } from './recordingStateNotifier'
import { itoStreamController } from './itoStreamController'
import { TextInserter } from './text/TextInserter'
import { interactionManager } from './interactions/InteractionManager'
import { contextGrabber } from './context/ContextGrabber'
import { GrammarRulesService } from './grammar/GrammarRulesService'
import { getAdvancedSettings } from './store'
import log from 'electron-log'
import { timingCollector, TimingEventName } from './timing/TimingCollector'
import { CartesiaStreamClient, CartesiaStreamConfig } from './cartesiaStreamClient'
import { audioRecorderService } from '../media/audio'
import store from './store'
import { STORE_KEYS } from '../constants/store-keys'

export class ItoSessionManager {
  private readonly MINIMUM_AUDIO_DURATION_MS = 100
  private textInserter = new TextInserter()
  private streamResponsePromise: Promise<{
    response: any
    audioBuffer: Buffer
    sampleRate: number
  }> | null = null
  private grammarRulesService = new GrammarRulesService('')
  private cartesiaClient: CartesiaStreamClient | null = null
  private audioChunkHandler: ((chunk: Buffer) => void) | null = null

  public async startSession(mode: ItoMode) {
    console.log('[itoSessionManager] Starting session with mode:', mode)

    // Reuse existing global interaction ID if present, otherwise create a new one
    let interactionId = interactionManager.getCurrentInteractionId()
    if (interactionId) {
      console.log(
        '[itoSessionManager] Reusing existing interaction ID:',
        interactionId,
      )
      interactionManager.adoptInteractionId(interactionId)
    } else {
      interactionId = interactionManager.initialize()
    }

    // Branch based on ASR provider
    if (this.isCartesiaProvider()) {
      return this.startCartesiaSession(mode, interactionId)
    }

    // --- Existing V2 flow ---
    // Initialize all necessary components
    const started = await itoStreamController.initialize(mode)
    if (!started) {
      log.error('[itoSessionManager] Failed to initialize itoStreamController')
      return
    }

    // Begin gRPC stream immediately (note, no audio is flowing yet)
    this.streamResponsePromise = itoStreamController.startGrpcStream()

    // Begin recording audio (audio bytes will now flow into the gRPC stream)
    voiceInputService.startAudioRecording()

    // Send initial mode to the stream
    itoStreamController.setMode(mode)

    // Update UI state
    recordingStateNotifier.notifyRecordingStarted(mode)

    // Fetch and send context in the background (non-blocking)
    this.fetchAndSendContext().catch(error => {
      log.error('[itoSessionManager] Failed to fetch/send context:', error)
    })

    // Start timing the interaction
    timingCollector.startInteraction()
    timingCollector.startTiming(TimingEventName.INTERACTION_ACTIVE)

    return interactionId
  }

  private async fetchAndSendContext() {
    console.log('[itoSessionManager] Gathering context...')

    // Gather all context data (window, app, selected text, vocabulary, settings)
    const context = await contextGrabber.gatherContext(
      itoStreamController.getCurrentMode(),
    )

    // Send the gathered context to the stream controller
    await itoStreamController.scheduleConfigUpdate(context)

    // Fetch cursor context for grammar rules only if grammar service is enabled
    const { grammarServiceEnabled } = getAdvancedSettings()
    if (grammarServiceEnabled) {
      const cursorContext = await timingCollector.timeAsync(
        TimingEventName.GRAMMAR_SERVICE,
        async () => await contextGrabber.getCursorContextForGrammar(),
      )
      this.grammarRulesService = new GrammarRulesService(cursorContext)
    }
  }

  public setMode(mode: ItoMode) {
    // Send mode change to grpc stream (will also update windows via recordingStateNotifier)
    itoStreamController.setMode(mode)

    // Update UI to show the new mode
    recordingStateNotifier.notifyRecordingStarted(mode)
  }

  public async cancelSession() {
    // Clean up Cartesia session if active
    if (this.cartesiaClient) {
      this.cartesiaClient.cancel()
      this.cartesiaClient = null
      if (this.audioChunkHandler) {
        audioRecorderService.off('audio-chunk', this.audioChunkHandler)
        this.audioChunkHandler = null
      }
      recordingStateNotifier.notifyStreamingText({
        text: '',
        isFinal: true,
        phase: 'done',
      })

      const responsePromise = this.streamResponsePromise
      this.streamResponsePromise = null
      timingCollector.clearInteraction()
      interactionManager.clearCurrentInteraction()
      await voiceInputService.stopAudioRecording()
      recordingStateNotifier.notifyRecordingStopped()
      if (responsePromise) {
        try {
          await responsePromise
        } catch (error) {
          console.log('[itoSessionManager] Cartesia stream cancelled as expected:', error)
        }
      }
      return
    }

    // Capture the promise in a local variable immediately so new sessions can start
    const responsePromise = this.streamResponsePromise
    this.streamResponsePromise = null

    // Clear timing for the interaction on cancel
    timingCollector.clearInteraction()

    // Cancel the transcription (will not create interaction)
    itoStreamController.cancelTranscription()
    interactionManager.clearCurrentInteraction()
    itoStreamController.clearInteractionAudio()

    // Stop audio recording
    await voiceInputService.stopAudioRecording()

    // Update UI state
    recordingStateNotifier.notifyRecordingStopped()

    // Wait for the stream promise to reject with cancellation error
    if (responsePromise) {
      try {
        await responsePromise
      } catch (error) {
        // Expected cancellation error, log and ignore
        console.log('[itoSessionManager] Stream cancelled as expected:', error)
      }
    }
  }

  public async completeSession() {
    // If Cartesia session, handle differently
    if (this.cartesiaClient) {
      return this.completeCartesiaSession()
    }

    // Capture the promise in a local variable immediately so new sessions can start
    const responsePromise = this.streamResponsePromise
    this.streamResponsePromise = null

    // End timing for the interaction
    timingCollector.endTiming(TimingEventName.INTERACTION_ACTIVE)

    // Stop audio recording and wait for drain
    await voiceInputService.stopAudioRecording()

    // Check actual audio duration (keyboard duration can be misleading due to latency)
    const audioDurationMs = itoStreamController.getAudioDurationMs()

    if (audioDurationMs < this.MINIMUM_AUDIO_DURATION_MS) {
      console.log(
        `[itoSessionManager] Audio too short (${audioDurationMs}ms < ${this.MINIMUM_AUDIO_DURATION_MS}ms), cancelling`,
      )
      itoStreamController.cancelTranscription()
      itoStreamController.clearInteractionAudio()
      recordingStateNotifier.notifyRecordingStopped()

      // Wait for the stream promise to reject with cancellation error
      if (responsePromise) {
        try {
          await responsePromise
        } catch (error) {
          // Expected cancellation error, log and ignore
          console.log(
            '[itoSessionManager] Stream cancelled as expected:',
            error,
          )
        }
      }
      return
    }

    // End the interaction (this will complete the gRPC stream)
    itoStreamController.endInteraction()

    // Update UI state
    recordingStateNotifier.notifyRecordingStopped()

    // Notify processing started
    recordingStateNotifier.notifyProcessingStarted()

    // Wait for the stream response and handle it
    if (responsePromise) {
      console.log(
        '[itoSessionManager] Waiting for stream response from server...',
      )
      try {
        const result = await responsePromise
        console.log('[itoSessionManager] Received stream response:', {
          hasTranscript: !!result.response?.transcript,
          transcriptLength: result.response?.transcript?.length || 0,
          hasError: !!result.response?.error,
          audioBufferSize: result.audioBuffer.length,
        })
        await this.handleTranscriptionResponse(result)
      } catch (error) {
        console.error(
          '[itoSessionManager] Error waiting for stream response:',
          error,
        )
        await this.handleTranscriptionError(error)
      } finally {
        // Always notify processing stopped after handling response
        recordingStateNotifier.notifyProcessingStopped()
      }
    } else {
      console.warn('[itoSessionManager] No stream response promise to wait for')
      recordingStateNotifier.notifyProcessingStopped()
    }
  }

  private async handleTranscriptionResponse(result: {
    response: any
    audioBuffer: Buffer
    sampleRate: number
  }) {
    const { response, audioBuffer, sampleRate } = result

    const errorMessage = response.error ? response.error.message : undefined

    // Handle any transcription error
    if (response.error) {
      await interactionManager.createInteraction(
        response.transcript || '',
        audioBuffer,
        sampleRate,
        errorMessage,
      )
      timingCollector.clearInteraction()
      interactionManager.clearCurrentInteraction()
      itoStreamController.clearInteractionAudio()
    } else {
      // Handle text insertion with grammar-corrected text
      if (response.transcript && !response.error) {
        let textToInsert = response.transcript

        // Apply grammar rules only if grammar service is enabled
        const { grammarServiceEnabled } = getAdvancedSettings()
        if (grammarServiceEnabled) {
          textToInsert = this.grammarRulesService.setCaseFirstWord(textToInsert)
          textToInsert =
            this.grammarRulesService.addLeadingSpaceIfNeeded(textToInsert)
        }

        this.textInserter.insertText(textToInsert)

        // Create interaction in database
        await interactionManager.createInteraction(
          response.transcript,
          audioBuffer,
          sampleRate,
          errorMessage,
        )
      } else {
        log.warn('[itoSessionManager] Skipping text insertion:', {
          hasTranscript: !!response.transcript,
          transcriptLength: response.transcript?.length || 0,
          hasError: !!response.error,
        })
      }
      timingCollector.finalizeInteraction()
      interactionManager.clearCurrentInteraction()
      itoStreamController.clearInteractionAudio()
    }
  }

  private async handleTranscriptionError(error: any) {
    log.error(
      '[itoSessionManager] An unexpected error occurred during transcription:',
      error,
    )
    // Clear timing for the interaction on error
    timingCollector.clearInteraction()

    // Clear current interaction on error
    interactionManager.clearCurrentInteraction()
    itoStreamController.clearInteractionAudio()
  }

  private isCartesiaProvider(): boolean {
    const settings = getAdvancedSettings()
    return settings.llm?.asrProvider === 'cartesia'
  }

  private async startCartesiaSession(mode: ItoMode, interactionId: string) {
    const settings = getAdvancedSettings()

    const baseUrl = import.meta.env.VITE_GRPC_BASE_URL as string
    const wsUrl = baseUrl.replace(/^http/, 'ws') + '/stt/stream'

    const authToken = store.get(STORE_KEYS.ACCESS_TOKEN) as string | undefined

    const context = await contextGrabber.gatherContext(mode)

    const config: CartesiaStreamConfig = {
      serverUrl: wsUrl,
      authToken: authToken || undefined,
      language: 'fr',
      asrModel: settings.llm?.asrModel || 'ink-whisper',
      llmProvider: settings.llm?.llmProvider || undefined,
      llmModel: settings.llm?.llmModel || undefined,
      llmTemperature: settings.llm?.llmTemperature ?? undefined,
      transcriptionPrompt: settings.llm?.transcriptionPrompt || undefined,
      editingPrompt: settings.llm?.editingPrompt || undefined,
      context: {
        windowTitle: context.windowTitle,
        appName: context.appName,
        contextText: context.contextText,
        browserUrl: context.browserUrl ?? undefined,
        browserDomain: context.browserDomain ?? undefined,
        tonePrompt: context.tone?.promptTemplate ?? undefined,
        mode: mode === ItoMode.EDIT ? 1 : 0,
      },
      vocabulary: context.vocabularyWords,
      replacements: context.replacements.map(r => ({ from: r.from, to: r.to })),
      userDetails: context.userDetails,
    }

    this.cartesiaClient = new CartesiaStreamClient(config, (result) => {
      switch (result.type) {
        case 'partial':
          recordingStateNotifier.notifyStreamingText({
            text: result.text || '',
            isFinal: result.is_final || false,
            phase: 'streaming',
          })
          break
        case 'asr_final':
          recordingStateNotifier.notifyStreamingText({
            text: result.text || '',
            isFinal: true,
            phase: 'asr_complete',
          })
          break
        case 'llm_final':
          recordingStateNotifier.notifyStreamingText({
            text: result.text || '',
            isFinal: true,
            phase: 'llm_complete',
          })
          break
      }
    })

    const resultPromise = this.cartesiaClient.connect()

    this.streamResponsePromise = resultPromise.then(finalText => ({
      response: { transcript: finalText },
      audioBuffer: Buffer.alloc(0),
      sampleRate: 16000,
    }))

    voiceInputService.startAudioRecording()

    this.audioChunkHandler = (chunk: Buffer) => {
      this.cartesiaClient?.sendAudio(chunk)
    }
    audioRecorderService.on('audio-chunk', this.audioChunkHandler)

    recordingStateNotifier.notifyRecordingStarted(mode)

    timingCollector.startInteraction()
    timingCollector.startTiming(TimingEventName.INTERACTION_ACTIVE)

    return interactionId
  }

  private async completeCartesiaSession() {
    const responsePromise = this.streamResponsePromise
    this.streamResponsePromise = null

    timingCollector.endTiming(TimingEventName.INTERACTION_ACTIVE)

    await voiceInputService.stopAudioRecording()

    if (this.audioChunkHandler) {
      audioRecorderService.off('audio-chunk', this.audioChunkHandler)
      this.audioChunkHandler = null
    }

    this.cartesiaClient?.endAudio()

    recordingStateNotifier.notifyRecordingStopped()

    recordingStateNotifier.notifyStreamingText({
      text: '',
      isFinal: false,
      phase: 'llm_processing',
    })

    recordingStateNotifier.notifyProcessingStarted()

    if (responsePromise) {
      try {
        const result = await responsePromise
        await this.handleTranscriptionResponse(result)
      } catch (error) {
        await this.handleTranscriptionError(error)
      } finally {
        recordingStateNotifier.notifyStreamingText({
          text: '',
          isFinal: true,
          phase: 'done',
        })
        recordingStateNotifier.notifyProcessingStopped()
      }
    }

    this.cartesiaClient = null
  }
}

export const itoSessionManager = new ItoSessionManager()
