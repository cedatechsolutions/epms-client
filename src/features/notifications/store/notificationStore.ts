import { create } from 'zustand'
import { getUnreadCount } from '../api/notificationsApi'

type NotificationState = {
  /** Unread rows for the header badge; null until the first fetch lands. */
  unreadCount: number | null
  /**
   * Bumped whenever this tab changes read state (mark one / mark all), so every open feed (the bell
   * panel and the notifications page) can refetch without the two knowing about each other.
   */
  version: number
  refreshUnread: () => Promise<void>
  changed: () => void
  reset: () => void
}

/**
 * Shared notification state: the badge count and a change signal. The feed rows themselves stay
 * in the component that shows them; only what two places must agree on lives here.
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: null,
  version: 0,
  refreshUnread: async () => {
    try {
      set({ unreadCount: await getUnreadCount() })
    } catch {
      // The badge is a hint, not a gate: keep the last known count rather than flashing an error.
    }
  },
  changed: () => {
    set({ version: get().version + 1 })
    void get().refreshUnread()
  },
  reset: () => set({ unreadCount: null, version: 0 }),
}))
