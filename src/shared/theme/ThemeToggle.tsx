import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import { useThemeStore } from './themeStore'

/**
 * Light/dark switch for the admin header (UI_GUIDELINES §5.2).
 *
 * The icon shows the theme it will switch *to*, not the one in effect — a sun means "go light".
 * That is the convention users expect from a single-button toggle, and the `aria-label`/`title`
 * spell out the action so it is unambiguous for anyone who reads it rather than sees it.
 */
export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const goingDark = theme === 'light'
  const label = goingDark ? 'Switch to dark theme' : 'Switch to light theme'

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={theme === 'dark'}
      onClick={toggleTheme}
      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink transition-colors hover:bg-hover-tint"
    >
      {goingDark ? <DarkModeRoundedIcon fontSize="small" /> : <LightModeRoundedIcon fontSize="small" />}
    </button>
  )
}
