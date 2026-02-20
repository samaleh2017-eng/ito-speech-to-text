import { Button } from '@/app/components/ui/button'
import DiscordIcon from '@/app/components/icons/DiscordIcon'
import XIcon from '@/app/components/icons/XIcon'
import GitHubIcon from '@/app/components/icons/GitHubIcon'
import { HugeiconsIcon } from '@hugeicons/react'
import { GlobeIcon, CallIcon } from '@hugeicons/core-free-icons'
import { EXTERNAL_LINKS } from '@/lib/constants/external-links'
import ItoIcon from '../../icons/ItoIcon'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/app/components/ui/card'

interface AboutCardProps {
  icon: React.ReactNode
  title: string
  description: string
  buttonText: string
  onClick: () => void
}

function AboutCard({
  icon,
  title,
  description,
  buttonText,
  onClick,
}: AboutCardProps) {
  return (
    <Card className="w-full flex flex-col items-start text-left transition-all duration-180 hover:-translate-y-1 hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mb-3">
          {icon}
        </div>
        <h2 className="text-lg font-semibold mb-1">{title}</h2>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onClick}
          variant="outline"
          className="w-fit cursor-pointer"
          style={{
            padding: '20px 28px',
          }}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function AboutContent() {
  const handleDiscordClick = () => {
    window.open(EXTERNAL_LINKS.DISCORD, '_blank')
  }

  const handleTeamCallClick = () => {
    window.open(EXTERNAL_LINKS.TEAM_CALL, '_blank')
  }

  const handleXClick = () => {
    window.open(EXTERNAL_LINKS.X_TWITTER, '_blank')
  }

  const handleGitHubClick = () => {
    window.open(EXTERNAL_LINKS.GITHUB, '_blank')
  }

  const handleWebsiteClick = () => {
    window.open(EXTERNAL_LINKS.WEBSITE, '_blank')
  }

  return (
    <div className="w-full px-12">
      <div className="mb-8">
        <h1 className="text-[30px] font-semibold tracking-tight font-sans">About</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AboutCard
            icon={<DiscordIcon width={24} height={24} className="text-black" />}
            title="Discord"
            description="Join the community, share feedback, and grow with Ito."
            buttonText="Join Discord"
            onClick={handleDiscordClick}
          />

          <AboutCard
            icon={<HugeiconsIcon icon={CallIcon} strokeWidth={2} className="w-6 h-6 text-black" />}
            title="Team Call"
            description="Got feedback or ideas? Book a quick call with the Ito team."
            buttonText="Book a Call"
            onClick={handleTeamCallClick}
          />

          <AboutCard
            icon={<XIcon width={24} height={24} className="text-black" />}
            title="X (Twitter)"
            description="Get updates, tips, and behind-the-scenes insights from the Ito team."
            buttonText="Follow on X"
            onClick={handleXClick}
          />

          <AboutCard
            icon={<GitHubIcon width={24} height={24} className="text-black" />}
            title="GitHub"
            description="Check out the code, contribute, or star the repo."
            buttonText="View on GitHub"
            onClick={handleGitHubClick}
          />

          <AboutCard
            icon={<HugeiconsIcon icon={GlobeIcon} strokeWidth={2} className="w-6 h-6 text-black" />}
            title="ito.ai"
            description="Learn more about Ito, explore features, and see what's next."
            buttonText="Go to Website"
            onClick={handleWebsiteClick}
          />

          <Card className="w-full flex flex-col items-start text-left transition-all duration-180 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader>
              <div className="bg-muted rounded-xl flex items-center justify-center">
                <ItoIcon
                  className="w-6 h-6 text-foreground"
                  style={{ height: '24px' }}
                />
                <span className={`text-lg font-bold ml-2`}>ito</span>
              </div>
            </CardHeader>
            <CardContent>
              <h2 className="text-lg font-semibold mb-4">
                Version {import.meta.env.VITE_ITO_VERSION}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Made with 🩷 in San Francisco.
              </p>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
