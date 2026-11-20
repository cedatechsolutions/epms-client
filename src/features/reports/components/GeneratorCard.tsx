import type { FormEvent, ReactNode } from 'react'
import { errorAlertClassName, primaryButtonClassName } from '../lib/ui'

type GeneratorCardProps = {
  id: string
  title: string
  description: string
  submitLabel: string
  loadingLabel: string
  loading: boolean
  disabled?: boolean
  errorMessage: string | null
  onSubmit: () => void
  children: ReactNode
}

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

/**
 * One generator on the Reports screen, laid out as a §6.13 section: header strip, form body, and a
 * right-aligned action strip with the single primary button. Each card owns its own loading and
 * error state, so one failed generation never blanks the others.
 */
export default function GeneratorCard({
  id,
  title,
  description,
  submitLabel,
  loadingLabel,
  loading,
  disabled = false,
  errorMessage,
  onSubmit,
  children,
}: GeneratorCardProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface"
    >
      <div className="border-b border-divider px-5 py-4">
        <h5 id={`${id}-title`} className="text-lg font-semibold tracking-[-0.02em] text-ink">
          {title}
        </h5>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>

      <form id={`${id}-form`} onSubmit={handleSubmit} className="flex-1 space-y-4 px-5 py-5">
        {errorMessage ? (
          <div role="alert" className={errorAlertClassName}>
            {errorMessage}
          </div>
        ) : null}
        {children}
      </form>

      <div className="flex justify-end border-t border-divider bg-row-hover px-5 py-4">
        <button
          type="submit"
          form={`${id}-form`}
          disabled={loading || disabled}
          className={primaryButtonClassName}
        >
          {loading ? <ButtonSpinner /> : null}
          {loading ? loadingLabel : submitLabel}
        </button>
      </div>
    </section>
  )
}
