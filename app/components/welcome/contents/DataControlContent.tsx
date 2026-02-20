import { Button } from '@/app/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle01Icon, LockIcon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { EXTERNAL_LINKS } from '@/lib/constants/external-links'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import { useSettingsStore } from '@/app/store/useSettingsStore'
import { Card, CardContent } from '@/app/components/ui/card'

export default function DataControlContent() {
  const { incrementOnboardingStep, decrementOnboardingStep } =
    useOnboardingStore()
  const { shareAnalytics, setShareAnalytics } = useSettingsStore()

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
            <h1 className="text-3xl mb-4 mt-12">You control your data.</h1>
            <div className="flex flex-col gap-4 my-8 pr-24">
              <Card
                className={`cursor-pointer transition-all ${shareAnalytics ? 'border-sky-200 bg-sky-50 ring-sky-200' : 'ring-border bg-background'}`}
                onClick={() => setShareAnalytics(true)}
              >
                <CardContent>
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="font-medium">Help improve Ito</div>
                    {shareAnalytics && (
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="w-[18px] h-[18px] text-sky-500" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground max-w-md mt-1">
                    To make Ito better, this option lets us collect your audio,
                    transcript, and edits to evaluate, train and improve Ito's
                    features and AI models.
                  </div>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all ${!shareAnalytics ? 'border-slate-200 bg-slate-50 ring-slate-200' : 'ring-border bg-background'}`}
                onClick={() => setShareAnalytics(false)}
              >
                <CardContent>
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="font-medium">Privacy Mode</div>
                    {!shareAnalytics && (
                      <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="w-[18px] h-[18px] text-slate-500" />
                    )}
                  </div>
                  <div className="text-muted-foreground max-w-md mt-1">
                    If you enable Privacy Mode, none of your dictation data will
                    be stored or used for model training by us or any third party.
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="text-sm text-muted-foreground">
              You can always change this later in settings.{' '}
              <button
                onClick={() =>
                  window.api?.invoke(
                    'web-open-url',
                    EXTERNAL_LINKS.PRIVACY_POLICY,
                  )
                }
                className="underline hover:text-foreground cursor-pointer"
              >
                Read more here.
              </button>
            </div>
          </div>
          <div className="flex flex-col items-start mb-8">
            <Button className="w-24" onClick={incrementOnboardingStep}>
              Continue
            </Button>
          </div>
        </div>
      </div>
      <div className="flex w-[55%] items-center justify-center bg-gradient-to-b from-sky-50/20 to-sky-100 border-l-2 border-sky-100">
        <HugeiconsIcon icon={LockIcon} strokeWidth={1.5} className="w-[220px] h-[220px] text-sky-400" />
      </div>
    </div>
  )
}
