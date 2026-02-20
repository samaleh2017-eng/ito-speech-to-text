import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Separator } from '@/app/components/ui/separator'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/app/components/ui/tooltip'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import ItoIcon from '../../icons/ItoIcon'
import GoogleIcon from '../../icons/GoogleIcon'
import AppleIcon from '../../icons/AppleIcon'
import GitHubIcon from '../../icons/GitHubIcon'
import MicrosoftIcon from '../../icons/MicrosoftIcon'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { checkLocalServerHealth } from '@/app/utils/healthCheck'
import { useAuthStore } from '@/app/store/useAuthStore'
import { useNotesStore } from '@/app/store/useNotesStore'
import { useDictionaryStore } from '@/app/store/useDictionaryStore'
import { AppOrbitImage } from '@/app/components/ui/app-orbit-image'
import { STORE_KEYS } from '../../../../lib/constants/store-keys'
import { isValidEmail, isStrongPassword } from '@/app/utils/utils'

const AUTH_PROVIDERS = {
  email: {
    key: 'email',
    label: 'Email',
    icon: null,
    variant: 'default' as const,
  },
  'google-oauth2': {
    key: 'google',
    label: 'Google',
    icon: GoogleIcon,
    variant: 'outline' as const,
  },
  microsoft: {
    key: 'microsoft',
    label: 'Microsoft',
    icon: MicrosoftIcon,
    variant: 'outline' as const,
  },
  apple: {
    key: 'apple',
    label: 'Apple',
    icon: AppleIcon,
    variant: 'outline' as const,
  },
  github: {
    key: 'github',
    label: 'GitHub',
    icon: GitHubIcon,
    variant: 'outline' as const,
  },
  'self-hosted': {
    key: 'self-hosted',
    label: 'Self-Hosted',
    icon: null,
    variant: 'default' as const,
  },
}

interface AuthButtonProps {
  provider: keyof typeof AUTH_PROVIDERS
  onClick: () => void
  className?: string
  children?: React.ReactNode
  disabled?: boolean
  title?: string
}

function AuthButton({
  provider,
  onClick,
  className = '',
  children,
  disabled = false,
  title,
}: AuthButtonProps) {
  const config = AUTH_PROVIDERS[provider]
  const IconComponent = config.icon

  const button = (
    <Button
      variant={config.variant}
      className={`h-12 flex items-center justify-center gap-3 text-sm font-medium ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {IconComponent && <IconComponent className="size-5" />}
      <span>{children || config.label}</span>
    </Button>
  )

  if (disabled && title) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">{button}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{title}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}

export default function SignInContent() {
  const { incrementOnboardingStep } = useOnboardingStore()
  const { clearAuth } = useAuthStore()
  const { loadNotes } = useNotesStore()
  const { loadEntries } = useDictionaryStore()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { resetOnboarding } = useOnboardingStore()
  const [isServerHealthy, setIsServerHealthy] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    user,
    isAuthenticated,
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithApple,
    loginWithGitHub,
    loginWithSelfHosted,
    loginWithEmail,
    loginWithEmailPassword,
  } = useAuth()

  useEffect(() => {
    const checkHealth = async () => {
      const { isHealthy } = await checkLocalServerHealth()
      setIsServerHealthy(isHealthy)
    }

    checkHealth()

    const intervalId = setInterval(checkHealth, 5000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && user) {
      incrementOnboardingStep()
    }
  }, [isAuthenticated, user, incrementOnboardingStep])

  const handleSelfHosted = async () => {
    try {
      await loginWithSelfHosted()
    } catch (error) {
      console.error('Self-hosted authentication failed:', error)
    }
  }

  const handleSocialAuth = async (provider: string) => {
    try {
      switch (provider) {
        case 'google':
          await loginWithGoogle()
          break
        case 'microsoft':
          await loginWithMicrosoft()
          break
        case 'apple':
          await loginWithApple()
          break
        case 'github':
          await loginWithGitHub()
          break
        default:
          console.error('Unknown auth provider:', provider)
      }
    } catch (error) {
      console.error(`${provider} authentication failed:`, error)
    }
  }

  const storedUser = window.electron?.store?.get(STORE_KEYS.AUTH)?.user
  const userEmail = storedUser?.email
  const userProvider = storedUser?.provider as keyof typeof AUTH_PROVIDERS

  useEffect(() => {
    if (typeof userEmail === 'string' && userEmail.length > 0) {
      setEmail(userEmail)
    }
  }, [userEmail])

  const emailOk = useMemo(() => isValidEmail(email || ''), [email])
  const isValid = useMemo(
    () => isStrongPassword(password) && emailOk,
    [password, emailOk],
  )

  const handleEmailPasswordLogin = async () => {
    if (!isValid) return
    try {
      setIsLoggingIn(true)
      setErrorMessage(null)
      await loginWithEmailPassword(email, password)
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : 'Login failed.'
      setErrorMessage(msg)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const formatProviderName = (provider?: string): string => {
    if (!provider) return 'Unknown'
    return (
      AUTH_PROVIDERS[provider as keyof typeof AUTH_PROVIDERS]?.label ||
      provider.charAt(0).toUpperCase() + provider.slice(1)
    )
  }

  const renderAllAuthOptions = () => (
    <>
      <div className="space-y-3 mb-8">
        <div className="grid grid-cols-2 gap-3">
          <AuthButton
            provider="google-oauth2"
            onClick={() => handleSocialAuth('google')}
          />
          <AuthButton
            provider="microsoft"
            onClick={() => handleSocialAuth('microsoft')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <AuthButton
            provider="apple"
            onClick={() => handleSocialAuth('apple')}
          />
          <AuthButton
            provider="github"
            onClick={() => handleSocialAuth('github')}
          />
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <div className="flex flex-col gap-2">
          <Label htmlFor="signin-email">Email</Label>
          <Input
            id="signin-email"
            type="email"
            placeholder="Enter your email"
            className="h-12"
            onChange={e => setEmail(e.target.value)}
            defaultValue={userEmail}
          />
        </div>
        <AuthButton
          provider="google-oauth2"
          onClick={() => {}}
          className="hidden"
        />
        <Button
          className="w-full h-12 text-sm font-medium"
          onClick={() => loginWithEmail()}
        >
          Continue with Email
        </Button>
      </div>

      <div className="flex items-center my-8 gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <div className="space-y-4">
        <AuthButton
          provider="self-hosted"
          onClick={handleSelfHosted}
          className="w-full"
          disabled={!isServerHealthy}
          title={
            !isServerHealthy
              ? 'Local server must be running to use self-hosted option'
              : undefined
          }
        />
      </div>
    </>
  )

  const renderSingleProviderOption = (
    provider: keyof typeof AUTH_PROVIDERS,
  ) => {
    if (provider === 'email') {
      return (
        <div className="space-y-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="signin-email-provider">Email</Label>
            <Input
              id="signin-email-provider"
              type="email"
              placeholder="Enter your email"
              className="h-10"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="signin-password-provider">Password</Label>
            <Input
              id="signin-password-provider"
              type="password"
              placeholder="Enter your password"
              className="h-10"
              value={password}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleEmailPasswordLogin()
                }
              }}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <Button
            className="h-10 w-full"
            disabled={!isValid || isLoggingIn}
            aria-busy={isLoggingIn}
            onClick={handleEmailPasswordLogin}
          >
            {isLoggingIn && (
              <span className="mr-2 inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            )}
            {isLoggingIn ? 'Logging in…' : 'Log In'}
          </Button>

          {errorMessage && (
            <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
          )}
        </div>
      )
    }

    const getClickHandler = () => {
      switch (provider) {
        case 'google-oauth2':
          return () => handleSocialAuth('google')
        case 'microsoft':
          return () => handleSocialAuth('microsoft')
        case 'apple':
          return () => handleSocialAuth('apple')
        case 'github':
          return () => handleSocialAuth('github')
        case 'self-hosted':
          return handleSelfHosted
        default:
          return () => console.error('Unknown provider:', provider)
      }
    }

    const getLabel = () => {
      const config = AUTH_PROVIDERS[provider]
      return `Continue with ${config.label}`
    }

    return (
      <div className="space-y-4">
        <AuthButton
          provider={provider}
          onClick={getClickHandler()}
          className="w-full"
          disabled={provider === 'self-hosted' && !isServerHealthy}
          title={
            provider === 'self-hosted' && !isServerHealthy
              ? 'Local server must be running to use self-hosted option'
              : undefined
          }
        >
          {getLabel()}
        </AuthButton>
      </div>
    )
  }

  const renderAuthButton = () => {
    if (userProvider === 'email') {
      return renderSingleProviderOption('email')
    }
    if (!userProvider || !AUTH_PROVIDERS[userProvider]) {
      return renderAllAuthOptions()
    }
    return renderSingleProviderOption(userProvider)
  }

  return (
    <div className="flex h-full w-full bg-background">
      <div className="flex w-[30%] flex-col items-center justify-center px-12 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 bg-black rounded-md p-2 w-10 h-10 mx-auto">
            <ItoIcon height={24} width={24} style={{ color: '#FFFFFF' }} />
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-semibold mb-4 text-foreground">
              Welcome back!
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              {userEmail && userProvider
                ? `You last logged in with ${formatProviderName(userProvider)} (${userEmail})`
                : userEmail
                  ? `You last logged in with ${userEmail}`
                  : 'Sign in to continue with your smart dictation.'}
            </p>
          </div>

          {renderAuthButton()}

          {(userProvider === 'self-hosted' || !userProvider) && (
            <p className="text-xs text-muted-foreground text-center mt-8 leading-relaxed">
              Running Ito locally requires additional setup. Please refer to our{' '}
              <a href="#" className="underline">
                Github
              </a>{' '}
              and{' '}
              <a href="#" className="underline">
                Documentation
              </a>
            </p>
          )}

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              {userProvider
                ? 'Sign in with a different account?'
                : 'Need to create an account?'}{' '}
              <button
                onClick={() => {
                  clearAuth(false)
                  loadNotes()
                  loadEntries()
                  window.location.reload()
                }}
                className="text-foreground underline font-medium"
              >
                {userProvider ? 'Switch account' : 'Create account'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-[70%] bg-muted/20 items-center justify-center border-l border-border">
        <AppOrbitImage />
      </div>
    </div>
  )
}
