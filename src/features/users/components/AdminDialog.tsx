import { useEffect, useId, type PropsWithChildren, type ReactNode } from 'react'

type AdminDialogProps = PropsWithChildren<{
  open: boolean
  title: string
  description?: string
  footer?: ReactNode
  maxWidthClassName?: string
  closeDisabled?: boolean
  onClose: () => void
}>

export default function AdminDialog({
  open,
  title,
  description,
  footer,
  maxWidthClassName = 'max-w-3xl',
  closeDisabled = false,
  onClose,
  children,
}: AdminDialogProps) {
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return undefined

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabled) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeDisabled, onClose, open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        className="animate-fade-in fixed inset-0 cursor-default bg-[#123524]/45 backdrop-blur-[1px]"
        disabled={closeDisabled}
        onClick={onClose}
      />

      <div className="relative z-10 flex min-h-full items-center justify-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className={[
            'animate-pop-in my-6 max-h-[calc(100vh-3rem)] w-full overflow-hidden border border-[#d8e1d4] bg-white shadow-[0_28px_80px_rgba(18,53,36,0.18)]',
            maxWidthClassName,
          ].join(' ')}
        >
          <header className="border-b border-[#e7eee3] px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold tracking-[-0.02em] text-[#123524]">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-1 text-sm leading-6 text-[#617462]">
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={closeDisabled}
                className="cursor-pointer border border-[#d8e1d4] px-3 py-1.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>
          </header>

          <div className="max-h-[calc(100vh-15rem)] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

          {footer ? <footer className="border-t border-[#e7eee3] bg-[#fbfdf9] px-5 py-4 sm:px-6">{footer}</footer> : null}
        </section>
      </div>
    </div>
  )
}
