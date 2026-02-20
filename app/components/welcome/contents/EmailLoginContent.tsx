import { useMemo, useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Card, CardContent } from '@/app/components/ui/card'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { AppOrbitImage } from '@/app/components/ui/app-orbit-image'
import { isValidEmail, isStrongPassword } from '@/app/utils/utils'
import { useAuth } from '@/app/components/auth/useAuth'

type Props = {
  initialEmail?: string
  onBack: () => void
  onContinue: (email: string, password?: string) => void
}

export default function EmailLoginContent({
  initialEmail = '',
  onBack,
}: Props) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')

  const emailOk = useMemo(() => isValidEmail(email), [email])

  const isValid = useMemo(() => {
    const passwordOk = isStrongPassword(password)
    return emailOk && passwordOk
  }, [emailOk, password])

  const { loginWithEmailPassword } = useAuth()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!emailOk || !isStrongPassword(password)) return
    try {
      setIsLoggingIn(true)
      setErrorMessage(null)
      await loginWithEmailPassword(email, password)
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : 'Login failed.'
      console.error('Login error:', e)
      setErrorMessage(msg)
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <div className="flex h-full w-full bg-background">
      <div className="flex w-1/2 flex-col justify-center px-16">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 w-fit gap-1 text-muted-foreground"
          onClick={onBack}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="w-4 h-4" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground">
            Welcome back!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Log in to get started
          </p>
        </div>

        <Card>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                className="h-10"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                className="h-10"
                value={password}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleLogin()
                  }
                }}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <Button
              className="h-10 w-full"
              disabled={!isValid || isLoggingIn}
              aria-busy={isLoggingIn}
              onClick={handleLogin}
            >
              {isLoggingIn && (
                <span className="mr-2 inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              )}
              {isLoggingIn ? 'Logging in…' : 'Log In'}
            </Button>

            {errorMessage && (
              <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button className="hover:underline" onClick={onBack}>
                Log in with a different email
              </button>
              <span className="hover:underline cursor-default">
                Forgot password?
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex w-1/2 items-center justify-center border-l border-border bg-muted/20">
        <AppOrbitImage />
      </div>
    </div>
  )
}
