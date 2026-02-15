import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Square } from 'lucide-react'
import { X } from '@mynaui/icons-react'
import { useSettingsStore } from '../../store/useSettingsStore'
import {
  useOnboardingStore,
  ONBOARDING_CATEGORIES,
} from '../../store/useOnboardingStore'
import { AudioBars } from './contents/AudioBars'
import { useAudioStore } from '@/app/store/useAudioStore'
import { analytics, ANALYTICS_EVENTS } from '../analytics'
import { ItoIcon } from '../icons/ItoIcon'
import type {
  RecordingStatePayload,
  ProcessingStatePayload,
} from '@/lib/types/ipc'
import type { AppTarget } from '@/app/store/useAppStylingStore'

const globalStyles = `
  html, body, #app {
    height: 100%;
    margin: 0;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    pointer-events: none;
    font-family:
      'Inter',
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      sans-serif;
  }
`

const BAR_UPDATE_INTERVAL = 64

const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
  mass: 0.5,
  restDelta: 0.001,
}

const getDimensions = (state: 'idle' | 'listening' | 'thinking') => {
  if (state === 'listening' || state === 'thinking') {
    return { width: 360, height: 46, borderBottomRadius: 20 }
  }
  return { width: 200, height: 46, borderBottomRadius: 20 }
}

const Pill = () => {
  const initialShowItoBarAlways = useSettingsStore(
    state => state.showItoBarAlways,
  )
  const initialOnboardingCategory = useOnboardingStore(
    state => state.onboardingCategory,
  )
  const initialOnboardingCompleted = useOnboardingStore(
    state => state.onboardingCompleted,
  )
  const { startRecording, stopRecording } = useAudioStore()

  const [isRecording, setIsRecording] = useState(false)
  const [isManualRecording, setIsManualRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const isManualRecordingRef = useRef(false)
  const [showItoBarAlways, setShowItoBarAlways] = useState(
    initialShowItoBarAlways,
  )
  const [onboardingCategory, setOnboardingCategory] = useState(
    initialOnboardingCategory,
  )
  const [onboardingCompleted, setOnboardingCompleted] = useState(
    initialOnboardingCompleted,
  )
  const [volumeHistory, setVolumeHistory] = useState<number[]>([])
  const [lastVolumeUpdate, setLastVolumeUpdate] = useState(0)
  const [appTarget, setAppTarget] = useState<AppTarget | null>(null)

  useEffect(() => {
    const unsubRecording = window.api.on(
      'recording-state-update',
      (state: RecordingStatePayload) => {
        setIsRecording(state.isRecording)

        if (!isManualRecordingRef.current) {
          const analyticsEvent = state.isRecording
            ? ANALYTICS_EVENTS.RECORDING_STARTED
            : ANALYTICS_EVENTS.RECORDING_COMPLETED
          analytics.track(analyticsEvent, {
            is_recording: state.isRecording,
            mode: state.mode,
          })
        }

        if (!state.isRecording) {
          setIsManualRecording(false)
          isManualRecordingRef.current = false
          setVolumeHistory([])
        }
      },
    )

    const unsubProcessing = window.api.on(
      'processing-state-update',
      (state: ProcessingStatePayload) => {
        setIsProcessing(state.isProcessing)
      },
    )

    const unsubVolume = window.api.on('volume-update', (vol: number) => {
      const now = Date.now()
      if (now - lastVolumeUpdate < BAR_UPDATE_INTERVAL) {
        return
      }
      const newVolumeHistory = [...volumeHistory, vol]
      if (newVolumeHistory.length > 42) {
        newVolumeHistory.shift()
      }
      setVolumeHistory(newVolumeHistory)
      setLastVolumeUpdate(now)
    })

    const unsubSettings = window.api.on('settings-update', (settings: any) => {
      setShowItoBarAlways(settings.showItoBarAlways)
    })

    const unsubOnboarding = window.api.on(
      'onboarding-update',
      (onboarding: any) => {
        setOnboardingCategory(onboarding.onboardingCategory)
        setOnboardingCompleted(onboarding.onboardingCompleted)
      },
    )

    const unsubUserAuth = window.api.on('user-auth-update', (authUser: any) => {
      if (authUser) {
        analytics.identifyUser(
          authUser.id,
          {
            user_id: authUser.id,
            email: authUser.email,
            name: authUser.name,
            provider: authUser.provider,
          },
          authUser.provider,
        )
      } else {
        analytics.resetUser()
      }
    })

    return () => {
      unsubRecording()
      unsubProcessing()
      unsubVolume()
      unsubSettings()
      unsubOnboarding()
      unsubUserAuth()
    }
  }, [volumeHistory, lastVolumeUpdate])

  useEffect(() => {
    if (isRecording || isManualRecording) {
      window.api.appTargets
        .getCurrent()
        .then(setAppTarget)
        .catch(() => setAppTarget(null))
    }
  }, [isRecording, isManualRecording])

  useEffect(() => {
    if (!isRecording && !isManualRecording && !isProcessing) {
      setAppTarget(null)
    }
  }, [isRecording, isManualRecording, isProcessing])

  const anyRecording = isRecording || isManualRecording
  const shouldShow =
    (onboardingCategory === ONBOARDING_CATEGORIES.TRY_IT ||
      onboardingCompleted) &&
    (anyRecording || isProcessing || showItoBarAlways || isHovered)

  const notchState: 'idle' | 'listening' | 'thinking' = anyRecording
    ? 'listening'
    : isProcessing
      ? 'thinking'
      : 'idle'

  const { width, height, borderBottomRadius } = getDimensions(notchState)

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (window.api?.setPillMouseEvents) {
      window.api.setPillMouseEvents(false)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (window.api?.setPillMouseEvents) {
      window.api.setPillMouseEvents(true, { forward: true })
    }
  }

  const handleClick = () => {
    if (isHovered && !anyRecording && !isProcessing) {
      setIsManualRecording(true)
      isManualRecordingRef.current = true
      startRecording()
      analytics.track(ANALYTICS_EVENTS.MANUAL_RECORDING_STARTED, {
        is_recording: true,
      })
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsManualRecording(false)
    stopRecording()
    analytics.track(ANALYTICS_EVENTS.MANUAL_RECORDING_ABANDONED, {
      is_recording: false,
    })
  }

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsManualRecording(false)
    stopRecording()
    analytics.track(ANALYTICS_EVENTS.MANUAL_RECORDING_COMPLETED, {
      is_recording: false,
    })
  }

  const renderIcon = () => {
    if (appTarget?.iconBase64) {
      return (
        <motion.img
          key="app-icon"
          src={`data:image/png;base64,${appTarget.iconBase64}`}
          className="w-6 h-6 rounded"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90 }}
          transition={springTransition}
        />
      )
    }
    return (
      <motion.div
        key="ito-icon"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 90 }}
        transition={springTransition}
      >
        <ItoIcon width={24} height={24} className="text-white" />
      </motion.div>
    )
  }

  const renderRightContent = () => {
    if (isManualRecording) {
      return (
        <motion.div
          key="manual-recording"
          className="absolute inset-0 w-full h-full flex items-center justify-between px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            onClick={handleCancel}
            className="flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
          >
            <X width={16} height={16} color="white" />
          </button>
          <div className="h-full flex items-center flex-1 justify-center">
            <AudioBars volumeHistory={volumeHistory} barColor="#007AFF" />
          </div>
          <button
            onClick={handleStop}
            className="flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
          >
            <Square className="w-4 h-4 text-[#007AFF]" fill="currentColor" />
          </button>
        </motion.div>
      )
    }

    if (anyRecording) {
      return (
        <motion.div
          key="recording"
          className="h-full flex items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <AudioBars volumeHistory={volumeHistory} barColor="#007AFF" />
        </motion.div>
      )
    }

    if (isProcessing) {
      return (
        <motion.div
          key="thinking"
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{
              rotate: { repeat: Infinity, duration: 3, ease: 'linear' },
              scale: { repeat: Infinity, duration: 2 },
            }}
          >
            <Sparkles
              className="w-4 h-4 text-[#007AFF]"
              fill="currentColor"
            />
          </motion.div>
          <span className="text-[14px] font-medium text-[#007AFF]">
            Thinking
          </span>
        </motion.div>
      )
    }

    return null
  }

  const isIdle = notchState === 'idle'

  return (
    <>
      <style>{globalStyles}</style>
      <div className="fixed top-0 left-0 w-full flex justify-center z-50 pointer-events-none">
        <AnimatePresence>
          {shouldShow && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0.7, scaleY: 0.5 }}
              animate={{
                opacity: 1,
                scaleX: 1,
                scaleY: 1,
                width,
                height,
                borderBottomLeftRadius: borderBottomRadius,
                borderBottomRightRadius: borderBottomRadius,
              }}
              exit={{ opacity: 0, scaleX: 0.7, scaleY: 0.5 }}
              transition={springTransition}
              style={{ transformOrigin: 'top center' }}
              className={[
                'relative flex flex-col items-center pointer-events-auto',
                'backdrop-blur-[40px] saturate-150 overflow-hidden',
                'rounded-t-none border-t-0',
                'bg-gradient-to-b from-black to-[#141414]',
                'shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_-1px_0_rgba(255,255,255,0.15),inset_0_-8px_12px_rgba(255,255,255,0.02)]',
                'border-x border-b border-white/5 ring-1 ring-white/5',
                isIdle && !anyRecording && !isProcessing
                  ? 'cursor-pointer'
                  : 'cursor-default',
              ].join(' ')}
              whileHover={
                isIdle && !anyRecording && !isProcessing
                  ? {
                      scale: 1.02,
                      boxShadow:
                        '0 10px 40px rgba(0,122,255,0.15), inset 0 -1px 0 rgba(255,255,255,0.15), inset 0 -8px 12px rgba(255,255,255,0.02)',
                    }
                  : undefined
              }
              onClick={handleClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {!isManualRecording && (
                <motion.div
                  className="absolute inset-0 w-full h-full flex items-center justify-between px-5"
                  layout
                  transition={springTransition}
                >
                  <div className="flex items-center gap-2.5">
                    <AnimatePresence mode="wait">
                      {renderIcon()}
                    </AnimatePresence>
                    <span className="text-[14px] font-semibold tracking-wide text-white">
                      {appTarget?.name || 'Ito'}
                    </span>
                  </div>
                  <AnimatePresence mode="wait">
                    {renderRightContent()}
                  </AnimatePresence>
                </motion.div>
              )}
              {isManualRecording && (
                <AnimatePresence mode="wait">
                  {renderRightContent()}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export default Pill
