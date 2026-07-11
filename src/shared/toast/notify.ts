import { useToastStore } from './toastStore'

/**
 * Global toast API. Usable from anywhere (components, stores, api layers) since it reaches
 * the store imperatively via getState(). Each call returns the toast id for early dismissal.
 *
 *   notify.error('Invalid email or password.')
 *   notify.success('User created successfully.')
 */
export const notify = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast('success', message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast('error', message, duration),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().addToast('warning', message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast('info', message, duration),
  dismiss: (id: string) => useToastStore.getState().dismissToast(id),
}
