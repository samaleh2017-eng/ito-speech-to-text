import { Button } from '@/app/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { useEffect, useState } from 'react'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import { useSettingsStore } from '@/app/store/useSettingsStore'
import { MicrophoneSelector } from '@/app/components/ui/microphone-selector'
import { Card, CardContent } from '@/app/components/ui/card'

function MicrophoneBars({ volume }: { volume: number }) {
  const minHeight = 0.2
  const levels = Array(12)
    .fill(0)
    .map((_, i) => {
      const threshold = (i / 12) * 0.5
      const normalizedVolume = Math.min(volume * 8, 1)
      return normalizedVolume > threshold ? 1 : minHeight
    })

  return (
    <div
      className="flex gap-1 py-4 px-4 items-end bg-muted rounded-md"
      style={{ height: 120 }}
    >
      {levels.map((level, i) => (
        <div
          key={i}
          className={`mx-2 h-full ${level > minHeight ? 'bg-sky-300' : 'bg-muted-foreground/30'}`}
          style={{
            width: 18,
            borderRadius: 6,
            transition: 'height 0.18s cubic-bezier(.4,2,.6,1)',
          }}
        />
      ))}
    </div>
  )
}

export default function MicrophoneTestContent() {
  const { incrementOnboardingStep, decrementOnboardingStep } =
    useOnboardingStore()
  const { microphoneDeviceId, microphoneName, setMicrophoneDeviceId } =
    useSettingsStore()

  const [volume, setVolume] = useState(0)
  const [smoothedVolume, setSmoothedVolume] = useState(0)

  useEffect(() => {
    const unsubscribe = window.api.on('volume-update', (newVolume: number) => {
      setVolume(newVolume)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (microphoneDeviceId) {
      window.api.send('start-native-recording-test')
    }

    return () => {
      window.api.send('stop-native-recording-test')
    }
  }, [microphoneDeviceId])

  useEffect(() => {
    const smoothing = 0.4
    setSmoothedVolume(prev => prev * (1 - smoothing) + volume * smoothing)
  }, [volume])

  const handleMicrophoneChange = async (deviceId: string, name: string) => {
    setMicrophoneDeviceId(deviceId, name)
  }

  return (
    <div className="flex flex-row h-full w-full bg-background">
      <div className="flex flex-col w-[45%] justify-center items-start px-24">
        <div className="flex flex-col h-full min-h-[400px] justify-between py-12 overflow-hidden">
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
            <h1 className="text-3xl mb-4 mt-12">
              Speak to test your microphone.
            </h1>
            <div className="text-base text-muted-foreground mb-8 max-w-md">
              Your computer's built-in mic will ensure accurate transcription
              with minimal latency.
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-[55%] items-center justify-center bg-gradient-to-b from-sky-50/20 to-sky-100 border-l-2 border-sky-100">
        <Card className="min-w-[500px] max-h-[280px] shadow-lg">
          <CardContent className="flex flex-col items-center">
            <div className="text-lg font-medium mb-6 text-center">
              Do you see sky bars moving while you speak?
            </div>
            <MicrophoneBars volume={smoothedVolume} />
            <div className="flex gap-2 mt-6 w-full justify-end">
              <MicrophoneSelector
                selectedDeviceId={microphoneDeviceId}
                selectedMicrophoneName={microphoneName}
                onSelectionChange={handleMicrophoneChange}
                triggerButtonText="No, change microphone"
                triggerButtonVariant="outline"
                triggerButtonClassName="w-44"
              />
              <Button
                className="w-16"
                type="button"
                onClick={incrementOnboardingStep}
              >
                Yes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
