import { create } from 'zustand'

/** What the user asked for. `system` follows the OS and keeps following it as it changes. */
export type ThemePreference = 'system' | 'light' | 'dark'

/** What is actually painted — `system` resolved against the media query. */
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'cems-theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function systemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/**
 * Storage access is guarded: Safari private mode and hardened browser profiles throw on
 * localStorage rather than returning null, and a theme preference is never worth breaking
 * boot over. A failed read simply falls back to `system`.
 */
function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    /* ignore — fall through to the default */
  }
  return 'system'
}

function writePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    /* ignore — the theme still applies for this session */
  }
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === 'system' ? systemTheme() : preference
}

/**
 * Mirror the resolved theme onto `<html data-theme>`. Every color in the app is a CSS variable
 * keyed off that attribute (see `globals.css`), so this one write repaints the whole UI —
 * there is nothing else to update, and no component subscribes to the theme to restyle itself.
 */
function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.dataset.theme = theme
}

type ThemeState = {
  preference: ThemePreference
  theme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
  /** Flip to the opposite of what is on screen, which also leaves `system`. */
  toggleTheme: () => void
}

const initialPreference = readPreference()

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: initialPreference,
  theme: resolveTheme(initialPreference),
  setPreference: (preference) => {
    const theme = resolveTheme(preference)
    writePreference(preference)
    applyTheme(theme)
    set({ preference, theme })
  },
  toggleTheme: () => {
    get().setPreference(get().theme === 'dark' ? 'light' : 'dark')
  },
}))

/**
 * Apply the stored theme and keep following the OS while the preference is `system`.
 *
 * Called once at boot. The inline script in `index.html` has already painted the correct
 * theme by this point; this re-applies it (harmless) and installs the media-query listener,
 * so a user who changes their OS theme with the app open sees it follow immediately.
 *
 * Returns an unsubscribe function.
 */
export function initTheme(): () => void {
  applyTheme(useThemeStore.getState().theme)

  const media = window.matchMedia(DARK_QUERY)
  const handleChange = () => {
    if (useThemeStore.getState().preference !== 'system') return
    const theme = systemTheme()
    applyTheme(theme)
    useThemeStore.setState({ theme })
  }

  media.addEventListener('change', handleChange)
  return () => media.removeEventListener('change', handleChange)
}
