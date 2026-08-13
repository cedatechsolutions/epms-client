import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import { ALL_ROLES, ROLE_LABELS, USER_MANAGEMENT_ROLES } from '@/features/auth/types'
import type { ApiValidationErrors } from '@/shared/api/http'
import { isApiError } from '@/shared/api/http'
import { notify } from '@/shared/toast'
import { DataTable, type DataTableColumn } from '@/shared/table'
import {
  createAdminUser,
  deleteAdminUser,
  deleteAdminUserAvatar,
  getUserStats,
  listAdminUsers,
  patchAdminUserStatus,
  printAdminUsersPdf,
  resetAdminUserPassword,
  updateAdminUser,
  uploadAdminUserAvatar,
} from '../api/adminUsersApi'
import type { UserModalFormMode, UserModalFormValues } from '../components/AdminUserFormModal'
import AdminDialog from '../components/AdminDialog'
import AdminUserFormModal from '../components/AdminUserFormModal'
import DeleteUserModal from '../components/DeleteUserModal'
import ResetPasswordModal from '../components/ResetPasswordModal'
import StatusToggleConfirmModal from '../components/StatusToggleConfirmModal'
import UserPrintPreviewModal from '../components/UserPrintPreviewModal'
import { getUserRequestErrorMessage } from '../lib/errorMessages'
import { formatDateTime } from '../lib/formatters'
import type { PaginationMeta, ResetPasswordPayload, User, UserListQuery, UserRole, UserStatus, UserStats } from '../types'

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

const actionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-line text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md'

const destructiveActionButtonClassName =
  'flex h-9 w-9 cursor-pointer items-center justify-center border border-danger-border text-danger transition-colors hover:bg-danger-bg-soft disabled:cursor-not-allowed disabled:opacity-45 rounded-md'

const inputClassName =
  'h-10 border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

const selectClassName =
  'h-10 cursor-pointer border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'

function getDisplayName(user: User): string {
  return user.full_name || [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ')
}

function formatRole(user: User): string {
  return ROLE_LABELS[user.role] ?? user.role
}

// Guard the signed-in admin's own row to prevent self lock-out (deactivate/delete/edit-role of self).
function isProtectedUser(user: User, currentUserId: string | undefined): boolean {
  return Boolean(currentUserId) && user.id === currentUserId
}

function ButtonSpinner({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <span
      className={[
        'h-4 w-4 animate-spin rounded-full border-2',
        tone === 'light' ? 'border-white/35 border-t-white' : 'border-line border-t-primary-accent',
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
  const canManageUsers = hasAnyRole(currentUser, USER_MANAGEMENT_ROLES)
  const canPrintUsers = canManageUsers
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false)

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
    setSelectedIds([])

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
      // Refresh summary counts alongside the list; failures here must not break the table.
      try {
        setStats(await getUserStats())
      } catch {
        setStats(null)
      }
    } catch (error) {
      setErrorMessage(getUserRequestErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [direction, page, perPage, roleFilter, search, sort, statusFilter])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const usersCountLabel = useMemo(() => {
    if (!meta.total) return 'No user records available'

    const from = meta.from ?? 0
    const to = meta.to ?? 0
    return `Showing ${from}-${to} of ${meta.total} user records`
  }, [meta.from, meta.to, meta.total])

  const paginationItems = useMemo(
    () => getPaginationItems(meta.current_page, meta.last_page),
    [meta.current_page, meta.last_page],
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  // Clicking a sortable header toggles direction on the active column, else sorts ascending.
  const handleSortChange = (nextSort: string) => {
    if (sort === nextSort) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(nextSort as NonNullable<UserListQuery['sort']>)
      setDirection('asc')
    }
    setPage(1)
  }

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
    if (!canManageUsers || isProtectedUser(user, currentUser?.id)) return

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

  /** Applies the modal's photo choice to a saved account. Returns false if the photo call failed. */
  const applyAvatarChange = async (userId: string, values: UserModalFormValues): Promise<boolean> => {
    try {
      if (values.avatarFile) {
        await uploadAdminUserAvatar(userId, values.avatarFile)
      } else if (values.avatarRemoved) {
        await deleteAdminUserAvatar(userId)
      }
      return true
    } catch {
      return false
    }
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
      let savedUser: User | null = null

      if (formMode === 'create') {
        savedUser = await createAdminUser({
          ...basePayload,
          password: values.password,
          password_confirmation: values.confirmPassword,
        })
      } else if (activeUser) {
        savedUser = await updateAdminUser(activeUser.id, {
          ...basePayload,
          ...(values.password
            ? {
                password: values.password,
                password_confirmation: values.confirmPassword,
              }
            : {}),
        })
      }

      // The photo is a second call: on create the account has to exist first. A failure here
      // does not undo the save, so it is reported as a warning rather than a form error.
      const photoApplied = savedUser ? await applyAvatarChange(savedUser.id, values) : true

      closeFormModal()
      if (photoApplied) {
        notify.success(formMode === 'create' ? 'User created successfully.' : 'User updated successfully.')
      } else {
        notify.warning(
          formMode === 'create'
            ? 'User created, but the profile photo could not be saved. Try uploading it again from Edit.'
            : 'User updated, but the profile photo could not be saved. Try again.',
        )
      }

      if (formMode === 'create' && page !== 1) {
        setPage(1)
      } else {
        await loadUsers()
      }
    } catch (error) {
      if (isApiError(error) && (error.status === 400 || error.status === 422)) {
        setFormApiErrors(error.fields ?? {})
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
      notify.success(`User ${getDisplayName(deleteTargetUser)} deleted successfully.`)

      if (shouldStepBackOnePage) {
        setPage((currentPage) => Math.max(1, currentPage - 1))
      } else {
        await loadUsers()
      }
    } catch (error) {
      notify.error(getUserRequestErrorMessage(error))
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return

    setBulkDeleteLoading(true)
    try {
      await Promise.all(selectedIds.map((id) => deleteAdminUser(id)))
      const count = selectedIds.length
      setBulkDeleteOpen(false)
      setSelectedIds([])
      notify.success(`${count} user${count === 1 ? '' : 's'} deleted successfully.`)
      await loadUsers()
    } catch (error) {
      notify.error(getUserRequestErrorMessage(error))
    } finally {
      setBulkDeleteLoading(false)
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
      notify.success(
        `User ${getDisplayName(updatedUser)} ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
      )
    } catch (error) {
      notify.error(getUserRequestErrorMessage(error))
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
      notify.success(`Password reset successfully for ${getDisplayName(targetUser)}.`)
    } catch (error) {
      if (isApiError(error) && (error.status === 400 || error.status === 422)) {
        setResetApiErrors(error.fields ?? {})
      } else {
        setResetErrorMessage(getUserRequestErrorMessage(error))
      }
    } finally {
      setResetLoading(false)
    }
  }

  const rowActionsBusy = statusLoading || deleteLoading || resetLoading

  const renderRowActions = (user: User) => {
    if (!canManageUsers) {
      return (
        <div className="flex justify-end">
          <span className="inline-flex rounded-md border border-line bg-surface-tint px-3 py-2 text-xs font-medium text-muted">
            Read only
          </span>
        </div>
      )
    }

    if (isProtectedUser(user, currentUser?.id)) {
      return (
        <div className="flex justify-end">
          <span className="inline-flex rounded-md border border-line bg-surface-tint px-3 py-2 text-xs font-medium text-muted">
            Your account
          </span>
        </div>
      )
    }

    return (
      <div className="flex justify-end gap-2">
        <button
          type="button"
          aria-label={`${user.status === 'active' ? 'Deactivate' : 'Activate'} ${getDisplayName(user)}`}
          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
          disabled={rowActionsBusy}
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
          disabled={rowActionsBusy}
          onClick={() => openEditModal(user)}
          className={actionButtonClassName}
        >
          <EditOutlinedIcon fontSize="small" />
        </button>
        <button
          type="button"
          aria-label={`Reset password for ${getDisplayName(user)}`}
          title="Reset password"
          disabled={rowActionsBusy}
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
          disabled={rowActionsBusy}
          onClick={() => setDeleteTargetUser(user)}
          className={destructiveActionButtonClassName}
        >
          <DeleteOutlineRoundedIcon fontSize="small" />
        </button>
      </div>
    )
  }

  const columns: DataTableColumn<User>[] = [
    { key: 'firstName', header: 'First Name', frozen: true, width: 150, sortKey: 'firstName', cellClassName: 'truncate text-ink', render: (user) => user.first_name },
    { key: 'middleName', header: 'Middle Name', frozen: true, width: 150, sortKey: 'middleName', cellClassName: 'truncate', render: (user) => user.middle_name || '-' },
    { key: 'lastName', header: 'Last Name', frozen: true, width: 160, sortKey: 'lastName', cellClassName: 'truncate text-ink', render: (user) => user.last_name },
    { key: 'email', header: 'Email', width: 230, sortKey: 'email', cellClassName: 'text-ink', render: (user) => user.email },
    { key: 'contactNumber', header: 'Contact Number', width: 160, sortKey: 'contactNumber', render: (user) => user.contact_number || '-' },
    {
      key: 'role',
      header: 'Role',
      width: 180,
      render: (user) => (
        <span className="inline-flex rounded-md border border-line bg-surface-tint px-2.5 py-1 text-xs font-medium text-ink">
          {formatRole(user)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      sortKey: 'active',
      render: (user) => (
        <span
          className={[
            'inline-flex border px-2.5 py-1 text-xs font-medium',
            user.status === 'active'
              ? 'border-success-border bg-success-bg text-primary-accent'
              : 'border-line bg-surface-tint text-muted',
          ].join(' ')}
        >
          {user.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    { key: 'createdAt', header: 'Date Created', width: 180, sortKey: 'createdAt', cellClassName: 'whitespace-nowrap', render: (user) => formatDateTime(user.created_at) },
    { key: 'actions', header: 'Actions', align: 'right', width: 220, render: renderRowActions },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">Accounts</p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">User management table</h4>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-body">
            Manage account access, roles, status, and password resets for administrative users.
          </p>
          {!canManageUsers ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-warning">
              Your account has read-only access here. Only administrators can create, edit, or delete users.
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
                className="cursor-pointer border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
              >
                Create New User
              </button>
            ) : null}
            {canPrintUsers ? (
              <button
                type="button"
                onClick={() => void handlePrintUsers()}
                disabled={printLoading}
                className="inline-flex cursor-pointer items-center justify-center gap-2 border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
              >
                {printLoading ? <ButtonSpinner tone="dark" /> : <PrintRoundedIcon fontSize="small" />}
                {printLoading ? 'Preparing...' : 'Print'}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            { label: 'Total users', value: stats?.total },
            { label: 'Active', value: stats?.active },
            { label: 'Inactive', value: stats?.inactive },
          ] as const
        ).map((card) => (
          <div key={card.label} className="rounded-lg border border-line bg-surface px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">{card.label}</p>
            {card.value === undefined ? (
              <span className="mt-2 block h-8 w-16 animate-pulse bg-skeleton" />
            ) : (
              <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-ink">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      <section className="rounded-lg overflow-hidden border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-ink">User records</p>
            <p className="mt-1 text-sm text-muted">
              Review account details and manage permitted actions from this table.
            </p>
          </div>
          <p className="text-sm text-muted">{usersCountLabel}</p>
        </div>

        <div className="grid gap-3 border-b border-divider px-5 py-4 md:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(130px,auto))] md:items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Search</span>
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
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Role</span>
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
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Status</span>
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
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-label">Rows</span>
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

        {errorMessage ? (
          <div className="space-y-4 px-5 py-6">
            <div className="border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text">{errorMessage}</div>
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="cursor-pointer border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={users}
              rowKey={(user) => user.id}
              loading={loading}
              loadingLabel="Loading user records..."
              emptyMessage="No user records found."
              minWidthClassName="min-w-[1120px]"
              selectable={canManageUsers}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              isRowSelectable={(user) => canManageUsers && !isProtectedUser(user, currentUser?.id)}
              sortKey={sort}
              sortDirection={direction}
              onSortChange={handleSortChange}
              bulkActions={(ids) => (
                <>
                  <button
                    type="button"
                    onClick={() => setBulkDeleteOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-2 border border-danger bg-danger px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-danger-hover rounded-md"
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                    Delete selected ({ids.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="cursor-pointer border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover-tint rounded-md"
                  >
                    Clear
                  </button>
                </>
              )}
            />

            {meta.total > 0 ? (
              <div className="flex flex-col gap-4 border-t border-divider px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm text-muted">
                  Page {meta.current_page} of {meta.last_page}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={meta.current_page <= 1}
                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                    className="cursor-pointer border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                  >
                    Previous
                  </button>

                  {paginationItems.map((item, index) =>
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-faint">
                        ...
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={[
                          'min-w-10 border px-3 py-2 text-sm font-medium transition-colors rounded-md',
                          item === meta.current_page
                            ? 'cursor-default border-primary bg-primary text-white'
                            : 'cursor-pointer border-line text-ink hover:bg-hover-tint',
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
                    className="cursor-pointer border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-45 rounded-md"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
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

      <AdminDialog
        open={bulkDeleteOpen}
        title="Delete selected users"
        description={`This will permanently remove ${selectedIds.length} selected user${selectedIds.length === 1 ? '' : 's'}.`}
        maxWidthClassName="max-w-xl"
        closeDisabled={bulkDeleteLoading}
        onClose={() => {
          if (!bulkDeleteLoading) setBulkDeleteOpen(false)
        }}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(false)}
              disabled={bulkDeleteLoading}
              className="cursor-pointer border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleBulkDelete()}
              disabled={bulkDeleteLoading}
              className="inline-flex cursor-pointer items-center justify-center gap-2 border border-danger bg-danger px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-danger-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
            >
              {bulkDeleteLoading ? <ButtonSpinner /> : null}
              {bulkDeleteLoading ? 'Deleting...' : `Delete ${selectedIds.length} user${selectedIds.length === 1 ? '' : 's'}`}
            </button>
          </div>
        }
      >
        <div className="border border-danger-border-soft bg-danger-bg-soft px-4 py-3 text-sm text-danger-text">
          Deleted users are removed from the list but their historical records are preserved. This action cannot be undone.
        </div>
      </AdminDialog>

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
    </div>
  )
}
