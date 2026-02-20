import { Button } from '@/app/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Separator } from '@/app/components/ui/separator'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import EmailSignupContent from './EmailSignupContent'
import EmailLoginContent from './EmailLoginContent'
import ItoIcon from '../../icons/ItoIcon'
import UserCog from '@/app/assets/icons/UserCog.svg'
import GoogleIcon from '../../icons/GoogleIcon'
import AppleIcon from '../../icons/AppleIcon'
import GitHubIcon from '../../icons/GitHubIcon'
import MicrosoftIcon from '../../icons/MicrosoftIcon'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { checkLocalServerHealth } from '@/app/utils/healthCheck'
import { useDictionaryStore } from '@/app/store/useDictionaryStore'
import { isValidEmail } from '@/app/utils/utils'

export default function CreateAccountContent() {
  const { initializeOnboarding } = useOnboardingStore()
  const [isServerHealthy, setIsServerHealthy] = useState(true)
  const [isSelfHostedModalOpen, setIsSelfHostedModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const isDictInitialized = useRef(false)
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [showEmailLogin, setShowEmailLogin] = useState(false)

  const {
    user,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isAuthenticated,
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithApple,
    loginWithGitHub,
    loginWithSelfHosted,
    signupWithEmail,
  } = useAuth()
  const userName = user?.name

  const addEntry = useDictionaryStore(state => state.addEntry)

  useEffect(() => {
    if (userName && !isDictInitialized.current) {
      addEntry(userName)
      isDictInitialized.current = true
    }
  }, [userName, isDictInitialized, addEntry])

  useEffect(() => {
    initializeOnboarding()
  }, [initializeOnboarding])

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

  const handleSelfHosted = async () => {
    try {
      await loginWithSelfHosted()
    } catch (error) {
      console.error('Self-hosted authentication failed:', error)
    }
  }

  const onClickSelfHosted = async () => {
    if (!isServerHealthy) {
      setIsSelfHostedModalOpen(true)
      return
    }
    await handleSelfHosted()
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

  const handleContinueWithEmail = async () => {
    if (!emailOk) {
      setEmailTouched(true)
      return
    }
    setShowEmailPassword(true)
  }

  if (showEmailPassword) {
    return (
      <EmailSignupContent
        initialEmail={email}
        onBack={() => setShowEmailPassword(false)}
        onContinue={(em, pw) => signupWithEmail(em, pw || '')}
      />
    )
  }

  if (showEmailLogin) {
    return (
      <EmailLoginContent
        initialEmail={email}
        onBack={() => setShowEmailLogin(false)}
        onContinue={() => {}}
      />
    )
  }

  const emailOk = isValidEmail(email)

  return (
    <div className="flex flex-col h-full w-full bg-background items-center justify-center">
      <div className="relative flex flex-col items-center w-full h-full max-h-full px-8 py-16 mt-12 mb-12">
        <div className="mb-4 bg-black rounded-md p-2 w-10 h-10">
          <ItoIcon height={24} width={24} style={{ color: '#FFFFFF' }} />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold mb-3 text-foreground">
            Get started with Ito
          </h1>
          <p className="text-muted-foreground text-base">
            Smart dictation. Everywhere you want.
          </p>
        </div>

        <div className="w-1/2 space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full h-12 flex items-center justify-start gap-3 text-sm font-medium"
              onClick={() => handleSocialAuth('google')}
            >
              <GoogleIcon className="size-5" />
              <div className="w-full text-sm font-medium">
                Continue with Google
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 flex items-center justify-start gap-3 text-sm font-medium"
              onClick={() => handleSocialAuth('microsoft')}
            >
              <MicrosoftIcon className="size-5" />
              <div className="w-full text-sm font-medium">
                Continue with Microsoft
              </div>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 flex items-center justify-start gap-2 text-sm font-medium"
              onClick={() => handleSocialAuth('apple')}
            >
              <AppleIcon className="size-5" />
              <div className="w-full text-sm font-medium">
                Continue with Apple
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-12 flex items-center justify-start gap-2 text-sm font-medium"
              onClick={() => handleSocialAuth('github')}
            >
              <GitHubIcon className="size-5" />
              <div className="w-full text-sm font-medium">
                Continue with GitHub
              </div>
            </Button>
          </div>
        </div>

        <div className="w-1/2 flex items-center my-6 gap-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>

        <div className="w-1/2 space-y-3 mb-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="signup-email">Email address</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="Email address"
              className="h-12"
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleContinueWithEmail()
                }
              }}
              aria-invalid={emailTouched && !emailOk}
              aria-describedby={
                emailTouched && !emailOk ? 'signup-email-error' : undefined
              }
            />
          </div>
          {emailTouched && !emailOk && (
            <p id="signup-email-error" className="text-xs text-destructive">
              Please enter a valid email address
            </p>
          )}
          <Button
            className="w-full h-12 text-sm font-medium"
            disabled={!emailOk}
            onClick={handleContinueWithEmail}
          >
            Continue with email
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              className="text-foreground underline hover:text-muted-foreground"
              onClick={() => {
                if (emailOk) setShowEmailLogin(true)
              }}
            >
              Sign in
            </button>
          </p>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center">
          <button
            type="button"
            onClick={onClickSelfHosted}
            className="flex flex-row items-center gap-2 hover:text-muted-foreground"
          >
            <img src={UserCog} alt="User settings" className="h-4 w-4" />
            <span className="text-sm">Self-Hosted</span>
          </button>
        </div>

        <Dialog
          open={isSelfHostedModalOpen}
          onOpenChange={setIsSelfHostedModalOpen}
        >
          <DialogContent
            showCloseButton={false}
            className="w-[90vw] max-w-[600px] rounded-md border-0 bg-background p-6"
          >
            <DialogHeader className="mb-2 text-left">
              <DialogTitle className="text-[18px] leading-6 font-semibold text-foreground">
                Self-Hosted
              </DialogTitle>
              <DialogDescription className="text-sm leading-5 text-foreground">
                Local server must be running to use self-hosted option
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsSelfHostedModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={async () => {
                  setIsSelfHostedModalOpen(false)
                  await handleSelfHosted()
                }}
              >
                Retry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
