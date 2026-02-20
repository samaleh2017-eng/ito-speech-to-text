import { Button } from '@/app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import AvatarIcon from '../../icons/AvatarIcon'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import { useAuthStore } from '@/app/store/useAuthStore'

const sources = [
  'Twitter',
  'TikTok',
  'Instagram',
  'Discord',
  'YouTube',
  'Reddit',
  'Friend',
  'Google Search',
  'Product Hunt',
  'Other',
]

export default function ReferralContent() {
  const { incrementOnboardingStep, referralSource, setReferralSource } =
    useOnboardingStore()
  const { user } = useAuthStore()
  const firstName = user?.name?.split(' ')[0]

  return (
    <div className="flex flex-row h-full w-full bg-background">
      <div className="flex flex-col w-[45%] justify-center items-start pl-24">
        <div className="flex flex-col h-full min-h-[400px] justify-between py-12">
          <div className="pt-32">
            <h1 className="text-3xl mb-4">
              Welcome{firstName ? `, ${firstName}!` : '!'}
            </h1>
            <p className="mb-6 text-base text-muted-foreground">
              Where did you hear about us?
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="mb-8 w-48 h-10 justify-between text-left">
                  {referralSource ? (
                    <span className="text-sm">{referralSource}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Select a source
                    </span>
                  )}
                  <svg
                    className="ml-2 h-4 w-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 text-sm border-border">
                {sources.map(s => (
                  <DropdownMenuItem
                    key={s}
                    onSelect={() => setReferralSource(s)}
                  >
                    {s}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col items-start mb-8">
            <Button
              className="w-24"
              onClick={incrementOnboardingStep}
              disabled={!referralSource}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
      <div className="flex w-[55%] items-center justify-center bg-gradient-to-b from-sky-50/20 to-sky-100 border-l-2 border-sky-100">
        <AvatarIcon />
      </div>
    </div>
  )
}
