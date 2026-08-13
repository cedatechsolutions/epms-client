import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { useEffect } from 'react'
import { useToastStore, type Toast, type ToastTone } from './toastStore'

type ToneStyle = {
  Icon: typeof InfoOutlinedIcon
  accent: string
  icon: string
  text: string
}

// Colors from the palette (UI guidelines §3). MUI icons inherit currentColor, so the icon
// tint comes from its text color class.
const TONE_STYLES: Record<ToastTone, ToneStyle> = {
  success: {
    Icon: CheckCircleOutlineRoundedIcon,
    accent: 'border-l-[#1f5d3b]',
    icon: 'text-[#1f5d3b]',
    text: 'text-[#123524]',
  },
  error: {
    Icon: ErrorOutlineRoundedIcon,
    accent: 'border-l-[#9f2f2f]',
    icon: 'text-[#9f2f2f]',
    text: 'text-[#8a2d2d]',
  },
  warning: {
    Icon: WarningAmberRoundedIcon,
    accent: 'border-l-[#7b6542]',
    icon: 'text-[#7b6542]',
    text: 'text-[#7b6542]',
  },
  info: {
    Icon: InfoOutlinedIcon,
    accent: 'border-l-[#123524]',
    icon: 'text-[#506552]',
    text: 'text-[#123524]',
  },
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onDismiss, toast.duration)
    return () => window.clearTimeout(timeoutId)
  }, [toast.duration, onDismiss])

  const style = TONE_STYLES[toast.tone]
  const Icon = style.Icon

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-slide-in-up pointer-events-auto w-full max-w-sm border border-[#d8e1d4] bg-white shadow-[0_18px_40px_rgba(18,53,36,0.12)]"
    >
      <div className={['flex items-start gap-3 border-l-4 px-4 py-3', style.accent].join(' ')}>
        <Icon fontSize="small" className={['mt-0.5 shrink-0', style.icon].join(' ')} />
        <p className={['flex-1 text-sm leading-6', style.text].join(' ')}>{toast.message}</p>
        <button
          type="button"
          aria-label="Dismiss notification"
          title="Dismiss"
          onClick={onDismiss}
          className="-mr-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center text-[#60755f] transition-colors hover:text-[#123524] rounded-md"
        >
          <CloseRoundedIcon fontSize="small" />
        </button>
      </div>
    </div>
  )
}

/**
 * Renders the global toast stack (UI guidelines §6.6). Mount once near the app root; push
 * toasts from anywhere via `notify.*`. Newest appears nearest the bottom-right corner.
 */
export default function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-6 z-40 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  )
}
