import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { cx } from 'class-variance-authority'

export function Tip({
  tipText,
  className,
}: {
  tipText: string
  className?: string
}) {
  const baseClass = 'flex gap-2 items-center '
  return (
    <div className={cx(baseClass, className)}>
      <span className="align-middle inline-flex">
        <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="text-blue-400 h-6 w-6" />
      </span>
      <span>
        <span className="font-semibold">Tip:</span> {tipText}
      </span>
    </div>
  )
}
