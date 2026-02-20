import { useMainStore } from '@/app/store/useMainStore'
import GeneralSettingsContent from './settings/GeneralSettingsContent'
import AudioSettingsContent from './settings/AudioSettingsContent'
import AccountSettingsContent from './settings/AccountSettingsContent'
import KeyboardSettingsContent from './settings/KeyboardSettingsContent'
import AdvancedSettingsContent from './settings/AdvancedSettingsContent'
import PricingBillingSettingsContent from './settings/PricingBillingSettingsContent'
import MyDetailsSettingsContent from './settings/MyDetailsSettingsContent'
import PerformanceSettingsContent from './settings/PerformanceSettingsContent'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Settings03Icon,
  KeyboardIcon,
  Mic01Icon,
  CodeIcon,
  UserCircleIcon,
  UserGroupIcon,
  CreditCardIcon,
  FlashIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'

const settingsNavItems: { id: string; label: string; icon: IconSvgElement }[] = [
  { id: 'general', label: 'General', icon: Settings03Icon },
  { id: 'keyboard', label: 'Keyboard', icon: KeyboardIcon },
  { id: 'audio', label: 'Audio & Mic', icon: Mic01Icon },
  { id: 'performance', label: 'Performance', icon: FlashIcon },
  { id: 'advanced', label: 'Advanced', icon: CodeIcon },
]

const accountNavItems: { id: string; label: string; icon: IconSvgElement }[] = [
  { id: 'my-details', label: 'My Details', icon: UserCircleIcon },
  { id: 'account', label: 'Account', icon: UserGroupIcon },
  { id: 'pricing-billing', label: 'Plans and Billing', icon: CreditCardIcon },
]

const pageTitles: Record<string, string> = {
  general: 'General',
  keyboard: 'Keyboard',
  audio: 'Audio & Mic',
  performance: 'Performance',
  advanced: 'Advanced',
  'my-details': 'My Details',
  account: 'Account',
  'pricing-billing': 'Plans and Billing',
}

export default function SettingsContent() {
  const { settingsPage, setSettingsPage } = useMainStore()

  const renderSettingsContent = () => {
    switch (settingsPage) {
      case 'general':
        return <GeneralSettingsContent />
      case 'keyboard':
        return <KeyboardSettingsContent />
      case 'audio':
        return <AudioSettingsContent />
      case 'performance':
        return <PerformanceSettingsContent />
      case 'pricing-billing':
        return <PricingBillingSettingsContent />
      case 'my-details':
        return <MyDetailsSettingsContent />
      case 'account':
        return <AccountSettingsContent />
      case 'advanced':
        return <AdvancedSettingsContent />
      default:
        return <GeneralSettingsContent />
    }
  }

  return (
    <div className="flex h-full">
      <div className="w-[260px] flex-shrink-0 flex flex-col justify-between py-6 px-5 border-r border-border">
        <div>
          <div className="text-xs font-semibold tracking-[1.5px] text-muted-foreground uppercase mb-3 px-3">
            Settings
          </div>
          <div className="flex flex-col gap-0.5">
            {settingsNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSettingsPage(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  settingsPage === item.id
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <HugeiconsIcon icon={item.icon} strokeWidth={2} className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </div>
          <div className="text-xs font-semibold tracking-[1.5px] text-muted-foreground uppercase mb-3 mt-6 px-3">
            Account
          </div>
          <div className="flex flex-col gap-0.5">
            {accountNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSettingsPage(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  settingsPage === item.id
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <HugeiconsIcon icon={item.icon} strokeWidth={2} className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground px-3">Ito v0.2.3</div>
      </div>
      <div className="flex-1 py-6 px-10 overflow-y-auto">
        <h1 className="font-sans text-2xl font-semibold text-foreground mb-6">
          {pageTitles[settingsPage] ?? 'General'}
        </h1>
        <div>{renderSettingsContent()}</div>
      </div>
    </div>
  )
}
