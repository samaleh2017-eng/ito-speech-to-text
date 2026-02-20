import { Button } from '@/app/components/ui/button'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'

export default function GoodToGoContent() {
  const { incrementOnboardingStep, decrementOnboardingStep } =
    useOnboardingStore()

  return (
    <div className="flex flex-row h-full w-full bg-background">
      <div className="flex flex-col w-[45%] justify-center items-start px-24">
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
            <h1 className="text-3xl mb-4 mt-12">
              Your hardware setup is good to go!
            </h1>
          </div>
          <div className="flex flex-col items-start mb-8">
            <Button className="w-24" onClick={incrementOnboardingStep}>
              Continue
            </Button>
          </div>
        </div>
      </div>
      <div className="flex w-[55%] items-center justify-center bg-gradient-to-b from-sky-50/20 to-sky-100 border-l-2 border-sky-100">
        <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={1.5} className="w-[220px] h-[220px] text-sky-400" />
      </div>
    </div>
  )
}
