import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import { ADMIN_ROLES, SUPER_ADMIN_ROLES } from '@/features/auth/types'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  patchAdminUserStatus,
  printAdminUsersPdf,
  resetAdminUserPassword,
  updateAdminUser,
} from '../api/adminUsersApi'
import type { UserModalFormMode, UserModalFormValues } from '../components/AdminUserFormModal'
import AdminUserFormModal from '../components/AdminUserFormModal'
import DeleteUserModal from '../components/DeleteUserModal'
import ResetPasswordModal from '../components/ResetPasswordModal'
import StatusToggleConfirmModal from '../components/StatusToggleConfirmModal'
import UserPrintPreviewModal from '../components/UserPrintPreviewModal'
import { getUserRequestErrorMessage } from '../lib/errorMessages'
import { formatDateTime } from '../lib/formatters'
import type { PaginationMeta, ResetPasswordPayload, User, UserListQuery, UserRole, UserStatus } from '../types'

const defaultMeta: PaginationMeta = {
  current_page: 1,
  from: null,
  last_page: 1,
  path: '',
  per_page: 10,
  to: null,
  total: 0,
}

type PaginationItem = number | 'ellipsis'

type ToastState = {
  message: string
  tone: 'success' | 'error'
}

const actionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-[#d8e1d4] text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-45'

const destructiveActionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-[#e3c9c9] text-[#9f2f2f] transition-colors hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-45'

const inputClassName =
  'h-10 border border-[#d8e1d4] bg-white px-3 text-sm text-[#123524] outline-none transition-colors focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'

const selectClassName =
  'h-10 cursor-pointer border border-[#d8e1d4] bg-white px-3 text-sm text-[#123524] outline-none transition-colors focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]'

const skeletonRows = Array.from({ length: 5 }, (_, index) => index)

function getDisplayName(user: User): string {
  return user.full_name || [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ')
}

function formatRole(user: User): string {
  if (user.roles.includes('ROLE_SUPER_ADMIN')) {
    return 'Super Admin'
  }

  return user.role.charAt(0).toUpperCase() + user.role.slice(1)
}

function isProtectedUser(user: User): boolean {
  return user.roles.includes('ROLE_SUPER_ADMIN')
}

function ButtonSpinner({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span
      className={[
        'h-4 w-4 animate-spin rounded-full border-2',
        tone === 'light' ? 'border-white/35 border-t-white' : 'border-[#d8e1d4] border-t-[#1f5d3b]',
      ].join(' ')}
    />
  )
}

function getPaginationItems(currentPage: number, lastPage: number): PaginationItem[] {
  const pageSet = new Set<number>([1, lastPage, currentPage - 1, currentPage, currentPage + 1])

  if (currentPage <= 3) {
    pageSet.add(2)
    pageSet.add(3)
  }

  if (currentPage >= lastPage - 2) {
    pageSet.add(lastPage - 1)
    pageSet.add(lastPage - 2)
  }

  const pages = Array.from(pageSet)
    .filter((page) => page >= 1 && page <= lastPage)
    .sort((left, right) => left - right)

  return pages.reduce<PaginationItem[]>((items, page, index) => {
    const previousPage = pages[index - 1]
    if (previousPage && page - previousPage > 1) {
      items.push('ellipsis')
    }
    items.push(page)
    return items
  }, [])
}

export default function AdminUsersListPage() {
  const currentUser = useAuthStore((state) => state.user)
  const canManageUsers = hasAnyRole(currentUser, SUPER_ADMIN_ROLES)
  const canPrintUsers = hasAnyRole(currentUser, ADMIN_ROLES)
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(defaultMeta.per_page)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  const [sort, setSort] = useState<NonNullable<UserListQuery['sort']>>('lastName')
  const [direction, setDirection] = useState<NonNullable<UserListQuery['direction']>>('asc')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<UserModalFormMode>('create')
  const [activeUser, setActiveUser] = useState<User | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)
  const [formApiErrors, setFormApiErrors] = useState<ApiValidationErrors | undefined>(undefined)

  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTargetUser, setStatusTargetUser] = useState<User | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null)
  const [resetApiErrors, setResetApiErrors] = useState<ApiValidationErrors | undefined>(undefined)
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false)
  const [printPdfBlob, setPrintPdfBlob] = useState<Blob | null>(null)
  const [printLoading, setPrintLoading] = useState(false)
  const [printErrorMessage, setPrintErrorMessage] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await listAdminUsers({
        page,
        per_page: perPage,
        search,
        role: roleFilter,
        status: statusFilter,
        sort,
        direction,
      })
      setUsers(response.data)
      setMeta(response.meta)
      setPage(response.meta.current_page)
    } catch (error) {
      setErrorMessage(getUserRequestErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [direction, page, perPage, roleFilter, search, sort, statusFilter])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  useEffect(() => {
    if (!toast) return undefined

    const timeoutId = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const usersCountLabel = useMemo(() => {
    if (!meta.total) return 'No user records available'

    const from = meta.from ?? 0
    const to = meta.to ?? 0
    return `Showing ${from}-${to} of ${meta.total} user records`
  }, [meta.from, meta.to, meta.total])

  const paginationItems = useMemo(() => getPaginationItems(meta.current_page, meta.last_page), [meta.current_page, meta.last_page])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  const openCreateModal = () => {
    if (!canManageUsers) return

    setFormMode('create')
    setActiveUser(null)
    setFormErrorMessage(null)
    setFormApiErrors(undefined)
    setFormOpen(true)
  }

  const handlePrintUsers = async () => {
    if (!canPrintUsers) return

    setPrintPreviewOpen(true)
    setPrintLoading(true)
    setPrintErrorMessage(null)
    setPrintPdfBlob(null)

    try {
      setPrintPdfBlob(await printAdminUsersPdf())
    } catch (error) {
      setPrintErrorMessage(getUserRequestErrorMessage(error))
    } finally {
      setPrintLoading(false)
    }
  }

  const openEditModal = (user: User) => {
    if (!canManageUsers || isProtectedUser(user)) return

    setFormMode('edit')
    setActiveUser(user)
    setFormErrorMessage(null)
    setFormApiErrors(undefined)
    setFormOpen(true)
  }

  const closeFormModal = () => {
    setFormOpen(false)
    setActiveUser(null)
    setFormErrorMessage(null)
    setFormApiErrors(undefined)
  }

  const handleFormSubmit = async (values: UserModalFormValues) => {
    setFormLoading(true)
    setFormErrorMessage(null)
    setFormApiErrors(undefined)

    const basePayload = {
      first_name: values.firstName,
      middle_name: values.middleName ? values.middleName : null,
      last_name: values.lastName,
      contact_number: values.contactNumber,
      email: values.email,
      role: values.role,
    } as const

    try {
      if (formMode === 'create') {
        await createAdminUser({
          ...basePayload,
          password: values.password,
          password_confirmation: values.confirmPassword,
        })
      } else if (activeUser) {
        await updateAdminUser(activeUser.id, {
          ...basePayload,
          ...(values.password
            ? {
                password: values.password,
                password_confirmation: values.confirmPassword,
              }
            : {}),
        })
      }

      closeFormModal()
      setToast({
        message: formMode === 'create' ? 'User created successfully.' : 'User updated successfully.',
        tone: 'success',
      })

      if (formMode === 'create' && page !== 1) {
        setPage(1)
      } else {
        await loadUsers()
      }
    } catch (error) {
      if (isApiError(error) && (error.status === 400 || error.status === 422)) {
        setFormApiErrors(error.data?.errors ?? {})
      } else {
        setFormErrorMessage(getUserRequestErrorMessage(error))
      }
    } finally {
      setFormLoading(false)
    }
  }

  const closeDeleteModal = () => {
    if (deleteLoading) return
    setDeleteTargetUser(null)
  }

  const closeStatusModal = () => {
    if (statusLoading) return
    setStatusTargetUser(null)
  }

  const closeResetModal = () => {
    if (resetLoading) return
    setResetTargetUser(null)
    setResetErrorMessage(null)
    setResetApiErrors(undefined)
  }

  const closePrintPreview = () => {
    if (printLoading) return
    setPrintPreviewOpen(false)
  }

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return

    setDeleteLoading(true)

    try {
      await deleteAdminUser(deleteTargetUser.id)

      const shouldStepBackOnePage = users.length === 1 && page > 1
      setDeleteTargetUser(null)
      setToast({
        message: `User ${getDisplayName(deleteTargetUser)} deleted successfully.`,
        tone: 'success',
      })

      if (shouldStepBackOnePage) {
        setPage((currentPage) => Math.max(1, currentPage - 1))
      } else {
        await loadUsers()
      }
    } catch (error) {
      setToast({
        message: getUserRequestErrorMessage(error),
        tone: 'error',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!statusTargetUser) return

    const nextStatus = statusTargetUser.status === 'active' ? 'inactive' : 'active'
    setStatusLoading(true)

    try {
      const updatedUser = await patchAdminUserStatus(statusTargetUser.id, nextStatus)
      setStatusTargetUser(null)
      await loadUsers()
      setToast({
        message: `User ${getDisplayName(updatedUser)} ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
        tone: 'success',
      })
    } catch (error) {
      setToast({
        message: getUserRequestErrorMessage(error),
        tone: 'error',
      })
    } finally {
      setStatusLoading(false)
    }
  }

  const handleResetPassword = async (payload: ResetPasswordPayload) => {
    if (!resetTargetUser) return

    setResetLoading(true)
    setResetErrorMessage(null)
    setResetApiErrors(undefined)

    try {
      await resetAdminUserPassword(resetTargetUser.id, payload)
      const targetUser = resetTargetUser
      setResetTargetUser(null)
      setResetErrorMessage(null)
      setResetApiErrors(undefined)
      setToast({
        message: `Password reset successfully for ${getDisplayName(targetUser)}.`,
        tone: 'success',
      })
    } catch (error) {
      if (isApiError(error) && (error.status === 400 || error.status === 422)) {
        setResetApiErrors(error.data?.errors ?? {})
      } else {
        setResetErrorMessage(getUserRequestErrorMessage(error))
      }
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]">Accounts</p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#123524]">User management table</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#506552]">
            Manage account access, roles, status, and password resets for administrative users.
          </p>
          {!canManageUsers ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#7b6542]">
              Your account has read-only access here. Only super administrators can create, edit, or delete users.
            </p>
          ) : null}
        </div>

        {canManageUsers || canPrintUsers ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {canManageUsers ? (
              <button
                type="button"
                onClick={openCreateModal}
                disabled={loading || formLoading}
                className="cursor-pointer border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create New User
              </button>
            ) : null}
            {canPrintUsers ? (
              <button
                type="button"
                onClick={() => void handlePrintUsers()}
                disabled={printLoading}
                className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {printLoading ? <ButtonSpinner tone="dark" /> : <PrintRoundedIcon fontSize="small" />}
                {printLoading ? 'Preparing...' : 'Print'}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <section className="border border-[#d8e1d4] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e7eee3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#123524]">User records</p>
            <p className="mt-1 text-sm text-[#617462]">
              Review account details and manage permitted actions from this table.
            </p>
          </div>
          <p className="text-sm text-[#617462]">{usersCountLabel}</p>
        </div>

        <div className="grid gap-3 border-b border-[#e7eee3] px-5 py-4 md:grid-cols-[minmax(220px,1fr)_repeat(5,minmax(130px,auto))] md:items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Search</span>
            <input
              type="search"
              value={searchInput}
              disabled={loading}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name, email, or contact"
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Role</span>
            <select
              value={roleFilter}
              disabled={loading}
              onChange={(event) => {
                setRoleFilter(event.target.value as UserRole | '')
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value="">All roles</option>
              <option value="admin">Admins</option>
              <option value="user">Users</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Status</span>
            <select
              value={statusFilter}
              disabled={loading}
              onChange={(event) => {
                setStatusFilter(event.target.value as UserStatus | '')
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Sort</span>
            <select
              value={sort}
              disabled={loading}
              onChange={(event) => {
                setSort(event.target.value as NonNullable<UserListQuery['sort']>)
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value="lastName">Last name</option>
              <option value="firstName">First name</option>
              <option value="email">Email</option>
              <option value="createdAt">Created date</option>
              <option value="lastLoginAt">Last login</option>
              <option value="active">Status</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Order</span>
            <select
              value={direction}
              disabled={loading}
              onChange={(event) => {
                setDirection(event.target.value as NonNullable<UserListQuery['direction']>)
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">Rows</span>
            <select
              value={perPage}
              disabled={loading}
              onChange={(event) => {
                setPerPage(Number(event.target.value))
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div aria-busy="true" aria-live="polite">
            <div className="flex items-center gap-3 border-b border-[#e7eee3] px-5 py-3 text-sm text-[#617462]">
              <ButtonSpinner tone="dark" />
              Loading user records...
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] table-auto border-collapse">
                <thead>
                  <tr className="border-b border-[#e7eee3] bg-[#f7faf6] text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">First Name</th>
                    <th className="px-5 py-3">Middle Name</th>
                    <th className="px-5 py-3">Last Name</th>
                    <th className="px-5 py-3">Contact Number</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date Created</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {skeletonRows.map((row) => (
                    <tr key={row} className="border-b border-[#eef2eb] last:border-b-0">
                      {Array.from({ length: 10 }, (_, cell) => (
                        <td key={cell} className="px-5 py-4">
                          <span className="block h-4 w-full max-w-[150px] animate-pulse bg-[#edf3ea]" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="space-y-4 px-5 py-6">
            <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">{errorMessage}</div>
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="cursor-pointer border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5]"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] table-auto border-collapse">
                <thead>
                  <tr className="border-b border-[#e7eee3] bg-[#f7faf6] text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">First Name</th>
                    <th className="px-5 py-3">Middle Name</th>
                    <th className="px-5 py-3">Last Name</th>
                    <th className="px-5 py-3">Contact Number</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date Created</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-12 text-center text-sm text-[#617462]">
                        No user records found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[#eef2eb] text-sm text-[#445846] last:border-b-0 hover:bg-[#fbfdf9]"
                      >
                        <td className="px-5 py-4 font-mono text-xs text-[#5d705e]">{user.id}</td>
                        <td className="px-5 py-4 text-[#123524]">{user.email}</td>
                        <td className="px-5 py-4">{user.first_name}</td>
                        <td className="px-5 py-4">{user.middle_name || '-'}</td>
                        <td className="px-5 py-4">{user.last_name}</td>
                        <td className="px-5 py-4">{user.contact_number || '-'}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex border border-[#d8e1d4] bg-[#f7faf6] px-2.5 py-1 text-xs font-medium text-[#123524]">
                            {formatRole(user)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={[
                              'inline-flex border px-2.5 py-1 text-xs font-medium',
                              user.status === 'active'
                                ? 'border-[#bfd3c0] bg-[#f3f9f2] text-[#1f5d3b]'
                                : 'border-[#d8e1d4] bg-[#f7faf6] text-[#617462]',
                            ].join(' ')}
                          >
                            {user.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">{formatDateTime(user.created_at)}</td>
                        <td className="px-5 py-4">
                          {canManageUsers ? (
                            isProtectedUser(user) ? (
                              <div className="flex justify-end">
                                <span className="inline-flex border border-[#d8e1d4] bg-[#f7faf6] px-3 py-2 text-xs font-medium text-[#617462]">
                                  Protected
                                </span>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  aria-label={`${user.status === 'active' ? 'Deactivate' : 'Activate'} ${getDisplayName(user)}`}
                                  title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                                  disabled={statusLoading || deleteLoading || resetLoading}
                                  onClick={() => setStatusTargetUser(user)}
                                  className={actionButtonClassName}
                                >
                                  {user.status === 'active' ? (
                                    <BlockOutlinedIcon fontSize="small" />
                                  ) : (
                                    <CheckCircleOutlineRoundedIcon fontSize="small" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Edit ${getDisplayName(user)}`}
                                  title="Edit"
                                  disabled={statusLoading || deleteLoading || resetLoading}
                                  onClick={() => openEditModal(user)}
                                  className={actionButtonClassName}
                                >
                                  <EditOutlinedIcon fontSize="small" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Reset password for ${getDisplayName(user)}`}
                                  title="Reset password"
                                  disabled={statusLoading || deleteLoading || resetLoading}
                                  onClick={() => {
                                    setResetTargetUser(user)
                                    setResetErrorMessage(null)
                                    setResetApiErrors(undefined)
                                  }}
                                  className={actionButtonClassName}
                                >
                                  <LockResetRoundedIcon fontSize="small" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Delete ${getDisplayName(user)}`}
                                  title="Delete"
                                  disabled={statusLoading || deleteLoading || resetLoading}
                                  onClick={() => setDeleteTargetUser(user)}
                                  className={destructiveActionButtonClassName}
                                >
                                  <DeleteOutlineRoundedIcon fontSize="small" />
                                </button>
                              </div>
                            )
                          ) : (
                            <div className="flex justify-end">
                              <span className="inline-flex border border-[#d8e1d4] bg-[#f7faf6] px-3 py-2 text-xs font-medium text-[#617462]">
                                Read only
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-[#e7eee3] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-[#617462]">
                Page {meta.current_page} of {meta.last_page}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  className="cursor-pointer border border-[#d8e1d4] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Previous
                </button>

                {paginationItems.map((item, index) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="px-1 text-sm text-[#7e8d7a]">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={[
                        'min-w-10 border px-3 py-2 text-sm font-medium transition-colors',
                        item === meta.current_page
                          ? 'cursor-default border-[#1f5d3b] bg-[#1f5d3b] text-white'
                          : 'cursor-pointer border-[#d8e1d4] text-[#123524] hover:bg-[#f6faf5]',
                      ].join(' ')}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((currentPage) => Math.min(meta.last_page, currentPage + 1))}
                  className="cursor-pointer border border-[#d8e1d4] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <AdminUserFormModal
        key={`${formMode}-${activeUser?.id ?? 'new'}-${formOpen ? 'open' : 'closed'}`}
        open={formOpen}
        mode={formMode}
        user={activeUser}
        loading={formLoading}
        errorMessage={formErrorMessage}
        apiErrors={formApiErrors}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
      />

      <DeleteUserModal
        open={Boolean(deleteTargetUser)}
        user={deleteTargetUser}
        loading={deleteLoading}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteUser}
      />

      <StatusToggleConfirmModal
        open={Boolean(statusTargetUser)}
        user={statusTargetUser}
        loading={statusLoading}
        onClose={closeStatusModal}
        onConfirm={handleStatusToggle}
      />

      <ResetPasswordModal
        key={resetTargetUser ? resetTargetUser.id : 'closed'}
        open={Boolean(resetTargetUser)}
        user={resetTargetUser}
        loading={resetLoading}
        apiErrors={resetApiErrors}
        errorMessage={resetErrorMessage}
        onClose={closeResetModal}
        onSubmit={handleResetPassword}
      />

      <UserPrintPreviewModal
        open={printPreviewOpen}
        pdfBlob={printPdfBlob}
        loading={printLoading}
        errorMessage={printErrorMessage}
        onClose={closePrintPreview}
        onRetry={handlePrintUsers}
      />

      {toast ? (
        <div className="fixed bottom-6 right-6 z-40 max-w-sm border border-[#d8e1d4] bg-white shadow-[0_18px_40px_rgba(18,53,36,0.12)]">
          <div
            className={[
              'border-l-4 px-4 py-3 text-sm',
              toast.tone === 'success'
                ? 'border-[#1f5d3b] text-[#123524]'
                : 'border-[#9f2f2f] text-[#8a2d2d]',
            ].join(' ')}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </div>
  )
}
