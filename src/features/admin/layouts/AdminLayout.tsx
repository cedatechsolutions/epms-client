import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { getPrimaryRoleLabel, getUserDisplayName, getUserInitials, hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import { ADMIN_ROLES } from '@/features/auth/types'

type NavItem = {
  id: string
  label: string
  to: string
  Icon: typeof DashboardOutlinedIcon
  matches: (pathname: string) => boolean
  disabled?: boolean
}

type SectionCopy = {
  eyebrow: string
}

function getNavigationItems(canAccessUserManagement: boolean): NavItem[] {
  const items: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      to: '/admin/dashboard',
      Icon: DashboardOutlinedIcon,
      matches: (currentPathname) => currentPathname === '/admin/dashboard',
    },
  ]

  if (canAccessUserManagement) {
    items.push({
      id: 'users',
      label: 'User Management',
      to: '/admin/users',
      Icon: GroupOutlinedIcon,
      matches: (currentPathname) => currentPathname.startsWith('/admin/users'),
    })
  }

  items.push(
    {
      id: 'projects',
      label: 'Extension Projects',
      to: '/admin/dashboard',
      Icon: FolderOutlinedIcon,
      matches: () => false,
      disabled: true,
    },
    {
      id: 'requests',
      label: 'Project Requests',
      to: '/admin/dashboard',
      Icon: InboxOutlinedIcon,
      matches: () => false,
      disabled: true,
    },
    {
      id: 'reports',
      label: 'Reports',
      to: '/admin/dashboard',
      Icon: AssessmentOutlinedIcon,
      matches: () => false,
      disabled: true,
    },
  )

  return items
}

function getSectionCopy(pathname: string): SectionCopy {
  if (pathname.startsWith('/admin/users')) {
    return {
      eyebrow: 'Administration / User Management',
    }
  }
  return {
    eyebrow: 'Administration / Dashboard',
  }
}

type SidebarProps = {
  navigationItems: NavItem[]
  pathname: string
  onNavigate: (to: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  onSignOut: () => void
}

function Sidebar({
  navigationItems,
  pathname,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  onSignOut,
}: SidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className={['px-4 py-5', collapsed ? 'px-3' : 'px-6'].join(' ')}>
        <div className={['flex items-center', collapsed ? 'justify-center' : 'gap-3'].join(' ')}>
          <img src="/logo.png" alt="Cavite State University logo" className="h-11 w-11 shrink-0 object-contain" />
          <div className={['min-w-0', collapsed ? 'hidden' : 'block'].join(' ')}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
              Cavite State University
            </p>
            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#60755f]">
              Bacoor City Campus
            </p>
          </div>
        </div>
      </div>

      <div className={['min-h-0 flex-1 overflow-y-auto py-6', collapsed ? 'px-3' : 'px-6'].join(' ')}>
        <div className={['flex items-center', collapsed ? 'justify-center' : 'justify-between gap-3'].join(' ')}>
          <p className={['text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]', collapsed ? 'sr-only' : 'block'].join(' ')}>
            Navigation
          </p>
          {onToggleCollapse ? (
            <button
              type="button"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={onToggleCollapse}
              className="hidden h-9 w-9 items-center justify-center border border-[#cad5c7] text-[#445846] transition-colors hover:bg-[#f6faf5] hover:text-[#123524] md:inline-flex"
            >
              {collapsed ? <ChevronRightRoundedIcon fontSize="small" /> : <ChevronLeftRoundedIcon fontSize="small" />}
            </button>
          ) : null}
        </div>
        <nav className="mt-4 space-y-1">
          {navigationItems.map((item) => {
            const isActive = item.matches(pathname)
            const Icon = item.Icon

            return (
              <button
                key={item.id}
                type="button"
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                onClick={() => {
                  if (!item.disabled) {
                    onNavigate(item.to)
                  }
                }}
                disabled={item.disabled}
                className={[
                  'flex w-full items-center border-l-2 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3 text-left',
                  isActive
                    ? 'border-[#1f5d3b] bg-[#f1f6f0] text-[#123524]'
                    : item.disabled
                      ? 'border-transparent text-[#8a9989]'
                      : 'border-transparent text-[#445846] hover:bg-[#f7faf6] hover:text-[#123524]',
                ].join(' ')}
                  >
                <Icon className="shrink-0" fontSize="small" />
                <span className={collapsed ? 'sr-only' : 'truncate'}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className={['shrink-0 border-t border-[#d8e1d4] px-6 py-5', collapsed ? 'hidden' : 'block'].join(' ')}>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full cursor-pointer items-center justify-center gap-2 border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5]"
        >
          <LogoutRoundedIcon fontSize="small" />
          Logout
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const canAccessUserManagement = hasAnyRole(user, ADMIN_ROLES)
  const displayName = getUserDisplayName(user)
  const primaryRoleLabel = getPrimaryRoleLabel(user)
  const initials = getUserInitials(user)

  const navigationItems = useMemo(
    () => getNavigationItems(canAccessUserManagement),
    [canAccessUserManagement],
  )
  const sectionCopy = useMemo(() => getSectionCopy(location.pathname), [location.pathname])

  useEffect(() => {
    if (!profileMenuOpen) {
      return undefined
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [profileMenuOpen])

  const handleNavigate = (to: string) => {
    navigate(to)
    setMobileOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
    setProfileMenuOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f4f7f1] text-[#123524]">
      <div className="mx-auto flex h-screen max-w-[1600px] overflow-hidden">
        <aside
          className={[
            'hidden h-screen shrink-0 border-r border-[#d8e1d4] bg-white transition-[width] duration-200 md:block',
            sidebarCollapsed ? 'w-[88px]' : 'w-[280px]',
          ].join(' ')}
        >
          <Sidebar
            navigationItems={navigationItems}
            pathname={location.pathname}
            onNavigate={handleNavigate}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
            onSignOut={() => void handleSignOut()}
          />
        </aside>

        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 border-b border-[#d8e1d4] bg-white">
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">
                  {sectionCopy.eyebrow}
                </p>
                <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-[#123524] md:text-lg">
                  Extension Projects Management System
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((current) => !current)}
                    className="hidden items-center gap-3 border border-[#cad5c7] px-3 py-2 transition-colors hover:bg-[#f6faf5] md:inline-flex"
                  >
                    <span className="flex h-9 w-9 items-center justify-center bg-[#1f5d3b] text-sm font-semibold text-white rounded-full">
                      {initials}
                    </span>
                    <span className="text-left">
                      <span className="block text-sm font-medium text-[#123524]">{displayName}</span>
                      <span className="block text-xs text-[#6a7f6d]">{primaryRoleLabel}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((current) => !current)}
                    className="flex h-10 w-10 items-center justify-center border border-[#cad5c7] bg-white text-sm font-semibold text-[#123524] transition-colors hover:bg-[#f6faf5] md:hidden"
                  >
                    {initials}
                  </button>

                  {profileMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[220px] border border-[#d8e1d4] bg-white p-2 shadow-[0_12px_30px_rgba(18,53,36,0.08)]">
                      <div className="border-b border-[#eef2eb] px-3 py-3">
                        <p className="text-sm font-medium text-[#123524]">{displayName}</p>
                        <p className="mt-1 text-xs text-[#6a7f6d]">{user?.email}</p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#73856f]">
                          {primaryRoleLabel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        className="mt-2 w-full px-3 py-2 text-left text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5]"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                  className="flex h-10 w-10 items-center justify-center border border-[#cad5c7] text-[#123524] transition-colors hover:bg-[#f6faf5] md:hidden"
                >
                  <MenuRoundedIcon fontSize="small" />
                </button>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="min-h-full border border-[#d8e1d4] bg-white p-4 md:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-[#123524]/20 md:hidden">
          <div className="flex h-full">
            <div className="w-[280px] border-r border-[#d8e1d4] bg-white shadow-xl">
              <Sidebar
                navigationItems={navigationItems}
                pathname={location.pathname}
                onNavigate={handleNavigate}
                onSignOut={() => void handleSignOut()}
              />
            </div>
            <button
              type="button"
              aria-label="Close menu"
              className="flex-1"
              onClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
