import { useState, useEffect, useMemo } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { useAppStylingStore, type MatchType } from '@/app/store/useAppStylingStore'
import { HugeiconsIcon } from '@hugeicons/react'
import { GlobeIcon, Tick01Icon, RefreshIcon, Search01Icon } from '@hugeicons/core-free-icons'
import AppWindowIcon from '@/app/components/icons/AppWindowIcon'

function extractDomainFromInput(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    return url.hostname
  } catch {
    if (trimmed.includes('.') && !trimmed.includes(' ') && trimmed.length >= 3) {
      return trimmed.toLowerCase()
    }
    return null
  }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManualAddDialog({ open, onOpenChange }: Props) {
  const { registerApp } = useAppStylingStore()
  const [selectedType, setSelectedType] = useState<MatchType>('app')
  const [installedApps, setInstalledApps] = useState<string[]>([])
  const [isLoadingApps, setIsLoadingApps] = useState(false)
  const [appFilter, setAppFilter] = useState('')
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [domainInput, setDomainInput] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  const fetchInstalledApps = async (signal?: { cancelled: boolean }) => {
    setIsLoadingApps(true)
    try {
      const apps = await window.api.appTargets.listInstalledApps()
      if (signal?.cancelled) return
      setInstalledApps(apps)
    } catch (error) {
      console.error('Failed to load installed apps:', error)
    } finally {
      if (!signal?.cancelled) setIsLoadingApps(false)
    }
  }

  useEffect(() => {
    if (open) {
      setSelectedType('app')
      setAppFilter('')
      setSelectedApp(null)
      setDomainInput('')
      setIsRegistering(false)
      const signal = { cancelled: false }
      fetchInstalledApps(signal)
      return () => { signal.cancelled = true }
    }
  }, [open])

  useEffect(() => {
    setSelectedApp(null)
    setAppFilter('')
    setDomainInput('')
  }, [selectedType])

  const filteredApps = useMemo(() => {
    if (!appFilter.trim()) return installedApps
    const lower = appFilter.toLowerCase()
    return installedApps.filter(app => app.toLowerCase().includes(lower))
  }, [installedApps, appFilter])

  const extractedDomain = useMemo(() => extractDomainFromInput(domainInput), [domainInput])

  const canAdd = selectedType === 'app' ? !!selectedApp : !!extractedDomain

  const handleAdd = async () => {
    if (!canAdd) return
    setIsRegistering(true)
    try {
      if (selectedType === 'app' && selectedApp) {
        await registerApp('app', selectedApp)
      } else if (selectedType === 'domain' && extractedDomain) {
        await registerApp('domain', extractedDomain, extractedDomain)
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to register:', error)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add App or Domain</DialogTitle>
          <DialogDescription>
            Register an application or website to assign a writing tone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSelectedType('app')}
              className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                selectedType === 'app'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className={`p-2 rounded-lg ${selectedType === 'app' ? 'bg-blue-500 text-white' : 'bg-muted'}`}>
                <AppWindowIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">Application</span>
                  {selectedType === 'app' && <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} className="h-3.5 w-3.5 text-blue-500" />}
                </div>
                <p className="text-xs text-muted-foreground">Match by app name</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('domain')}
              className={`flex-1 flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                selectedType === 'domain'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <div className={`p-2 rounded-lg ${selectedType === 'domain' ? 'bg-blue-500 text-white' : 'bg-muted'}`}>
                <HugeiconsIcon icon={GlobeIcon} strokeWidth={2} className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">Domain</span>
                  {selectedType === 'domain' && <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} className="h-3.5 w-3.5 text-blue-500" />}
                </div>
                <p className="text-xs text-muted-foreground">Match by website</p>
              </div>
            </button>
          </div>

          {selectedType === 'app' ? (
            <div className="space-y-2">
              <div className="relative">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Filter apps..."
                  value={appFilter}
                  onChange={e => setAppFilter(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => fetchInstalledApps()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted transition-colors"
                  title="Refresh app list"
                >
                  <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={`h-3.5 w-3.5 text-muted-foreground ${isLoadingApps ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {isLoadingApps ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    <span className="text-sm">Loading apps...</span>
                  </div>
                ) : filteredApps.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {appFilter ? 'No apps match your filter' : 'No apps found'}
                  </div>
                ) : (
                  filteredApps.map(appName => (
                    <button
                      key={appName}
                      type="button"
                      onClick={() => setSelectedApp(appName)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        selectedApp === appName
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'hover:bg-card'
                      }`}
                    >
                      {appName}
                    </button>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">Apps installed on your computer</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <input
                type="text"
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="e.g. docs.google.com or paste a full URL"
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
              />
              {domainInput.trim() && (
                extractedDomain ? (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} className="h-3 w-3" />
                    Will match: <span className="font-medium">{extractedDomain}</span>
                  </p>
                ) : (
                  <p className="text-xs text-red-500">
                    Invalid domain — enter a valid URL or domain name
                  </p>
                )
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!canAdd || isRegistering}>
            {isRegistering ? 'Adding...' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
