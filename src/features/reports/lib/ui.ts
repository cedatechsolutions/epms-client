// Class strings shared by the Reports screen (UI guidelines §6.1, §6.2, §6.13). Hoisted so every
// generator card and the archive use one definition — the radius lives here, never at the call site.

export const fieldLabelClassName = 'mb-2 block text-sm font-medium text-ink'

export const selectClassName =
  'w-full cursor-pointer border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

export const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

export const filterSelectClassName =
  'h-10 cursor-pointer border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

export const filterInputClassName =
  'h-10 border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

export const filterLabelClassName = 'text-xs font-semibold uppercase tracking-[0.12em] text-label'

export const primaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md'

export const secondaryButtonClassName =
  'cursor-pointer border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md'

export const errorAlertClassName = 'border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text rounded-md'

export const helpTextClassName = 'mt-2 text-xs leading-5 text-muted-alt'
