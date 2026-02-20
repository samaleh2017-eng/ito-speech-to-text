import { Button } from '@/app/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon, LockIcon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/app/components/ui/tooltip'
import { useState, useEffect, useRef } from 'react'
import { Spinner } from '@/app/components/ui/spinner'
import { AnimatedCheck } from '@/app/components/ui/animated-checkmark'
import { usePermissionsStore } from '@/app/store/usePermissionsStore'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import accessibilityVideo from '@/app/assets/accesssibility.webm'
import microphoneVideo from '@/app/assets/microphone.webm'

export default function PermissionsContent() {
  const { incrementOnboardingStep, decrementOnboardingStep } =
    useOnboardingStore()

  const {
    isAccessibilityEnabled,
    isMicrophoneEnabled,
    setAccessibilityEnabled,
    setMicrophoneEnabled,
  } = usePermissionsStore()
  const [checkingAccessibility, setCheckingAccessibility] = useState(false)
  const [checkingMicrophone, setCheckingMicrophone] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const microphonePollingRef = useRef<NodeJS.Timeout | null>(null)
  const [accessibilityCheckTrigger, setAccessibilityCheckTrigger] =
    useState(false)
  const [microphoneCheckTrigger, setMicrophoneCheckTrigger] = useState(false)

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
      if (microphonePollingRef.current) {
        clearInterval(microphonePollingRef.current)
      }
    }
  }, [])

  useEffect(() => {
    window.api
      .invoke('check-accessibility-permission', false)
      .then((enabled: boolean) => {
        setAccessibilityEnabled(enabled)
      })

    window.api
      .invoke('check-microphone-permission', false)
      .then((enabled: boolean) => {
        setMicrophoneEnabled(enabled)
      })
  }, [setAccessibilityEnabled, setMicrophoneEnabled])

  useEffect(() => {
    if (isAccessibilityEnabled) {
      window.api.invoke('start-key-listener-service')
      setAccessibilityCheckTrigger(false)
      setTimeout(() => setAccessibilityCheckTrigger(true), 100)
    }
  }, [isAccessibilityEnabled])

  useEffect(() => {
    if (isMicrophoneEnabled) {
      setMicrophoneCheckTrigger(false)
      setTimeout(() => setMicrophoneCheckTrigger(true), 100)
    }
  }, [isMicrophoneEnabled])

  const pollAccessibility = () => {
    pollingRef.current = setInterval(() => {
      window.api
        .invoke('check-accessibility-permission', false)
        .then((enabled: boolean) => {
          if (enabled) {
            setAccessibilityEnabled(true)
            setCheckingAccessibility(false)
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
          }
        })
    }, 2000)
  }

  const pollMicrophone = () => {
    microphonePollingRef.current = setInterval(() => {
      window.api
        .invoke('check-microphone-permission', false)
        .then((enabled: boolean) => {
          if (enabled) {
            setMicrophoneEnabled(true)
            setCheckingMicrophone(false)
            if (microphonePollingRef.current) {
              clearInterval(microphonePollingRef.current)
              microphonePollingRef.current = null
            }
          }
        })
    }, 2000)
  }

  const handleAllowAccessibility = () => {
    setCheckingAccessibility(true)
    window.api
      .invoke('check-accessibility-permission', true)
      .then((enabled: boolean) => {
        setAccessibilityEnabled(enabled)
        if (!enabled) {
          pollAccessibility()
        } else {
          setCheckingAccessibility(false)
        }
      })
  }

  const handleAllowMicrophone = () => {
    setCheckingMicrophone(true)
    window.api
      .invoke('check-microphone-permission', true)
      .then((enabled: boolean) => {
        setMicrophoneEnabled(enabled)
        if (!enabled) {
          pollMicrophone()
        } else {
          setCheckingMicrophone(false)
        }
      })
  }

  return (
    <div className="flex flex-row h-full w-full bg-background">
      <div className="flex flex-col w-[45%] justify-center items-start pl-24">
        <div className="flex flex-col h-full min-h-[400px] justify-between py-12">
          <div className="mt-8">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 gap-1 text-muted-foreground"
              onClick={decrementOnboardingStep}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl mb-4 mt-12 pr-24">
              {isAccessibilityEnabled && isMicrophoneEnabled
                ? 'Thank you for trusting us. We take your privacy seriously.'
                : 'Set up Ito on your computer'}
            </h1>
            <div className="flex flex-col gap-4 my-8 pr-24">
              <div className="border rounded-lg p-4 flex flex-col gap-2 bg-background border-border border-2">
                <div
                  className={`flex items-center gap-2 ${isAccessibilityEnabled ? '' : 'mb-2'}`}
                >
                  {isAccessibilityEnabled && (
                    <AnimatedCheck trigger={accessibilityCheckTrigger} />
                  )}
                  <div className="font-medium text-base flex">
                    {isAccessibilityEnabled
                      ? 'Ito can insert and edit text.'
                      : 'Allow Ito to insert spoken words.'}
                  </div>
                </div>
                {!isAccessibilityEnabled && (
                  <>
                    <div className="text-sm text-muted-foreground mb-2">
                      This lets Ito put your spoken words in the right textbox
                      and edit text according to your commands
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          className="w-24"
                          type="button"
                          onClick={handleAllowAccessibility}
                        >
                          Allow
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center">
                              <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="w-5 h-5 text-sky-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="start">
                            <p>
                              Ito uses this to gather context based on the
                              application you&apos;re using, <br /> and to
                              access your clipboard temporarily to paste text.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {checkingAccessibility && (
                        <div className="text-sm text-muted-foreground">
                          <Spinner size="medium" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="border rounded-lg p-4 flex flex-col gap-2 bg-background border-border border-2">
                <div
                  className={`flex items-center gap-2 ${isMicrophoneEnabled ? '' : 'mb-2'}`}
                >
                  {isMicrophoneEnabled && (
                    <AnimatedCheck trigger={microphoneCheckTrigger} />
                  )}
                  <div className="font-medium text-base flex">
                    {isMicrophoneEnabled
                      ? 'Ito can use your microphone.'
                      : 'Allow Ito to use your microphone.'}
                  </div>
                </div>
                {isAccessibilityEnabled && !isMicrophoneEnabled && (
                  <>
                    <div className="text-sm text-muted-foreground mb-2">
                      This lets Ito hear your voice and transcribe your speech
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          className="w-24"
                          type="button"
                          onClick={handleAllowMicrophone}
                        >
                          Allow
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center">
                              <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="w-5 h-5 text-sky-500" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="start">
                            <p>
                              Ito will show an animation when the mic is active{' '}
                              <br /> and only listen when you activate it
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {checkingMicrophone && (
                        <div className="text-sm text-muted-foreground">
                          <Spinner size="medium" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start mb-8">
            <Button
              className={`w-24 ${isAccessibilityEnabled && isMicrophoneEnabled ? '' : 'hidden'}`}
              onClick={incrementOnboardingStep}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
      <div className="flex w-[55%] items-center justify-center bg-gradient-to-b from-sky-50/20 to-sky-100 border-l-2 border-sky-100">
        <div className="w-[600px] h-[500px] rounded-lg flex items-center justify-center">
          {isAccessibilityEnabled && isMicrophoneEnabled ? (
            <HugeiconsIcon icon={LockIcon} strokeWidth={1.5} className="w-[220px] h-[220px] text-sky-400" />
          ) : !isAccessibilityEnabled ? (
            <video
              src={accessibilityVideo}
              autoPlay
              loop
              muted
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : (
            <video
              src={microphoneVideo}
              autoPlay
              loop
              muted
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  )
}
