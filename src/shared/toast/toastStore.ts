import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'warning' | 'info'

export type Toast = {
  id: string
  tone: ToastTone
  message: string
  duration: number
}

/** Default auto-dismiss window (ms) — a toast disappears after this unless dismissed sooner. */
export const DEFAULT_TOAST_DURATION = 20_000

type ToastState = {
  toasts: Toast[]
  addToast: (tone: ToastTone, message: string, duration?: number) => string
  dismissToast: (id: string) => void
  clearToasts: () => void
}

let counter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (tone, message, duration = DEFAULT_TOAST_DURATION) => {
    const id = `toast-${++counter}`
    set((state) => ({ toasts: [...state.toasts, { id, tone, message, duration }] }))
    return id
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
}))
