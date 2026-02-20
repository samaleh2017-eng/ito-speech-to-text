import { ReactNode } from 'react'
import React from 'react'
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip'

interface NavItemProps {
  icon: ReactNode
  label: string
  isActive?: boolean
  showText: boolean
  onClick?: () => void
}

export const NavItem = React.memo(function NavItem({
  icon,
  label,
  isActive = false,
  showText,
  onClick,
}: NavItemProps) {
  const navContent = (
    <button
      type="button"
      aria-current={isActive ? 'page' : undefined}
      className={`group flex w-full items-center px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all duration-180 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--sidebar-ring)] active:scale-[0.99] ${
        isActive
          ? 'bg-[linear-gradient(135deg,var(--sidebar-active-from),var(--sidebar-active-to))] text-[var(--sidebar-active-text)] font-medium shadow-sm'
          : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)]'
      }`}
      onClick={onClick}
    >
      <div className="w-6 flex items-center justify-center">{icon}</div>
      <span
        className={`transition-opacity duration-100 ${
          showText ? 'opacity-100' : 'opacity-0'
        } ${showText ? 'ml-3' : 'w-0 overflow-hidden'}`}
      >
        {label}
      </span>
    </button>
  )

  if (!showText) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{navContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={2} className="text-sm">
          {label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return navContent
})
