import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'

type NavItem = {
  id: string
  label: string
  to: string
  matches: (pathname: string) => boolean
  disabled?: boolean
}

type SectionCopy = {
  eyebrow: string
  title: string
  description: string
}

function getNavigationItems(pathname: string): NavItem[] {
  if (pathname.startsWith('/test')) {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        to: '/test/dashboard',
        matches: (currentPathname) => currentPathname === '/test/dashboard',
      },
      {
        id: 'projects',
        label: 'Extension Projects',
        to: '/test/dashboard',
        matches: () => false,
        disabled: true,
      },
      {
        id: 'requests',
        label: 'Project Requests',
        to: '/test/dashboard',
        matches: () => false,
        disabled: true,
      },
      {
        id: 'reports',
        label: 'Reports',
        to: '/test/dashboard',
        matches: () => false,
        disabled: true,
      },
    ]
  }

  return [
    {
      id: 'dashboard',
      label: 'Dashboard',
      to: '/admin/dashboard',
      matches: (currentPathname) => currentPathname === '/admin/dashboard',
    },
    {
      id: 'users',
      label: 'User Management',
      to: '/admin/users',
      matches: (currentPathname) => currentPathname.startsWith('/admin/users'),
    },
    {
      id: 'projects',
      label: 'Extension Projects',
      to: '/admin/dashboard',
      matches: () => false,
      disabled: true,
    },
    {
      id: 'requests',
      label: 'Project Requests',
      to: '/admin/dashboard',
      matches: () => false,
      disabled: true,
    },
    {
      id: 'reports',
      label: 'Reports',
      to: '/admin/dashboard',
      matches: () => false,
      disabled: true,
    },
  ]
}

function getSectionCopy(pathname: string): SectionCopy {
  if (pathname.startsWith('/admin/users')) {
    return {
      eyebrow: 'Administration / User Management',
      title: 'User management workspace',
      description:
        'Review accounts, manage permissions, and handle administrative records inside a cleaner, more restrained shell.',
    }
  }

  if (pathname.startsWith('/test')) {
    return {
      eyebrow: 'Preview / Layout',
      title: 'Admin layout preview',
      description:
        'A flatter, simpler Tailwind-based shell using a CavSU-inspired green palette and text-first navigation.',
    }
  }

  return {
    eyebrow: 'Administration / Dashboard',
    title: 'Extension Projects Management System',
    description:
      'A cleaner administrative shell with restrained spacing, simpler navigation, and a more professional CavSU-aligned tone.',
  }
}

type SidebarProps = {
  navigationItems: NavItem[]
  pathname: string
  onNavigate: (to: string) => void
}

function Sidebar({ navigationItems, pathname, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className=" px-6 py-5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Cavite State University logo" className="h-11 w-11 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
              Cavite State University
            </p>
            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#60755f]">
              Bacoor City Campus
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">Navigation</p>
        <nav className="mt-4 space-y-1">
          {navigationItems.map((item) => {
            const isActive = item.matches(pathname)

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (!item.disabled) {
                    onNavigate(item.to)
                  }
                }}
                disabled={item.disabled}
                className={[
                  'w-full border-l-2 px-4 py-3 text-left text-sm font-medium transition-colors',
                  isActive
                    ? 'border-[#1f5d3b] bg-[#f1f6f0] text-[#123524]'
                    : item.disabled
                      ? 'border-transparent text-[#8a9989]'
                      : 'border-transparent text-[#445846] hover:bg-[#f7faf6] hover:text-[#123524]',
                ].join(' ')}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-[#d8e1d4] px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#73856f]">Current style</p>
        <p className="mt-2 text-sm leading-6 text-[#5b6f5f]">
          Reduced radii, simple navigation states, and flatter containers.
        </p>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  const navigationItems = useMemo(() => getNavigationItems(location.pathname), [location.pathname])
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

  return (
    <div className="min-h-screen bg-[#f4f7f1] text-[#123524]">
      <div className="mx-auto min-h-screen max-w-[1600px] md:flex">
        <aside className="hidden w-[280px] shrink-0 border-r border-[#d8e1d4] bg-white md:block">
          <Sidebar navigationItems={navigationItems} pathname={location.pathname} onNavigate={handleNavigate} />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="border-b border-[#d8e1d4] bg-white">
            <div className="flex items-center justify-between px-4 py-4 md:px-8 md:py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">
                  CvSU Administration
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
                      AD
                    </span>
                    <span className="text-left">
                      <span className="block text-sm font-medium text-[#123524]">Administrator</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((current) => !current)}
                    className="flex h-10 w-10 items-center justify-center border border-[#cad5c7] bg-white text-sm font-semibold text-[#123524] transition-colors hover:bg-[#f6faf5] md:hidden"
                  >
                    AD
                  </button>

                  {profileMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[220px] border border-[#d8e1d4] bg-white p-2 shadow-[0_12px_30px_rgba(18,53,36,0.08)]">
                      <div className="border-b border-[#eef2eb] px-3 py-3">
                        <p className="text-sm font-medium text-[#123524]">Administrator</p>
                        <p className="mt-1 text-xs text-[#6a7f6d]">Extension Projects Management System</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
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
                  className="border border-[#cad5c7] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] md:hidden"
                >
                  Menu
                </button>
              </div>
            </div>
          </header>

          <section className="border-b border-[#d8e1d4] bg-[#eef4eb] px-4 py-6 md:px-8 md:py-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_340px]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">
                  {sectionCopy.eyebrow}
                </p>
                <h3 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#123524] md:text-[2.6rem]">
                  {sectionCopy.title}
                </h3>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#506552] md:text-[15px]">
                  {sectionCopy.description}
                </p>
              </div>

              <div className="border border-[#d8e1d4] bg-white p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">
                  Workspace notes
                </p>
                <div className="mt-4 space-y-3 text-sm leading-6 text-[#506552]">
                  <p>Navigation is intentionally text-only for now.</p>
                  <p>Containers use tighter corners and flatter surfaces.</p>
                  <p>The shell now relies on Tailwind utilities instead of MUI layout components.</p>
                </div>
              </div>
            </div>
          </section>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="border border-[#d8e1d4] bg-white p-4 md:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-[#123524]/20 md:hidden">
          <div className="flex h-full">
            <div className="w-[280px] border-r border-[#d8e1d4] bg-white shadow-xl">
              <Sidebar navigationItems={navigationItems} pathname={location.pathname} onNavigate={handleNavigate} />
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
