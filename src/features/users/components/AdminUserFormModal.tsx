import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { UserAvatar } from '@/features/auth'
import { ALL_ROLES, ROLE_LABELS } from '@/features/auth/types'
import type { ApiValidationErrors } from '@/shared/api/http'
import { getAdminUserAvatarBlob } from '../api/adminUsersApi'
import type { User, UserRole } from '../types'
import AdminDialog from './AdminDialog'

export type UserModalFormMode = 'create' | 'edit'

export type UserModalFormValues = {
  firstName: string
  middleName: string
  lastName: string
  contactNumber: string
  email: string
  role: UserRole
  password: string
  confirmPassword: string
  /** A newly chosen photo, applied by the caller after the account is created/saved. */
  avatarFile: File | null
  /** True when the existing photo should be cleared on save (edit mode only). */
  avatarRemoved: boolean
}

/** Mirrors the server-side avatar rule so a bad file never leaves the browser. */
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png']

type UserModalFieldErrors = Partial<Record<keyof UserModalFormValues, string>>

type AdminUserFormModalProps = {
  mode: UserModalFormMode
  open: boolean
  user?: User | null
  loading?: boolean
  errorMessage?: string | null
  apiErrors?: ApiValidationErrors
  onClose: () => void
  onSubmit: (values: UserModalFormValues) => void | Promise<void>
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const emptyValues: UserModalFormValues = {
  firstName: '',
  middleName: '',
  lastName: '',
  contactNumber: '',
  email: '',
  role: 'faculty',
  password: '',
  confirmPassword: '',
  avatarFile: null,
  avatarRemoved: false,
}

function buildInitialValues(user?: User | null): UserModalFormValues {
  if (!user) return emptyValues

  return {
    firstName: user.first_name,
    middleName: user.middle_name ?? '',
    lastName: user.last_name,
    contactNumber: user.contact_number ?? '',
    email: user.email,
    role: user.role,
    password: '',
    confirmPassword: '',
    avatarFile: null,
    avatarRemoved: false,
  }
}

function buildInitials(firstName: string, lastName: string, email: string): string {
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((part) => part.trim().charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)

  return initials || email.slice(0, 2).toUpperCase() || 'NEW'
}

function ButtonSpinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
}

export default function AdminUserFormModal({
  mode,
  open,
  user,
  loading = false,
  errorMessage,
  apiErrors,
  onClose,
  onSubmit,
}: AdminUserFormModalProps) {
  const [values, setValues] = useState<UserModalFormValues>(() => buildInitialValues(mode === 'edit' ? user : null))
  const [fieldErrors, setFieldErrors] = useState<UserModalFieldErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Photo already on the account (edit mode), and the preview of a newly picked file. The picked
  // file wins while it is set; removing falls back to initials.
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null)
  const [pickedAvatarUrl, setPickedAvatarUrl] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const existingAvatarKey = mode === 'edit' ? user?.avatar_updated_at ?? null : null
  const userId = user?.id ?? null

  useEffect(() => {
    if (!open || !userId || !existingAvatarKey) {
      return undefined
    }

    let objectUrl: string | null = null
    let cancelled = false

    void (async () => {
      try {
        const blob = await getAdminUserAvatarBlob(userId)
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setExistingAvatarUrl(objectUrl)
      } catch {
        // A missing photo is not a form error — the initials stand in for it.
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
      setExistingAvatarUrl(null)
    }
  }, [open, userId, existingAvatarKey])

  // Release the picked-file preview when it is replaced or the modal unmounts.
  useEffect(() => {
    return () => {
      if (pickedAvatarUrl) {
        URL.revokeObjectURL(pickedAvatarUrl)
      }
    }
  }, [pickedAvatarUrl])

  const previewAvatarUrl = pickedAvatarUrl ?? (values.avatarRemoved ? null : existingAvatarUrl)
  const hasAvatar = Boolean(pickedAvatarUrl) || (!values.avatarRemoved && Boolean(existingAvatarKey))

  const handleAvatarSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset immediately so re-picking the same file still fires a change event.
    event.target.value = ''
    if (!file) return

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Profile photo must be a JPG or PNG image.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Profile photo exceeds the 2 MB maximum.')
      return
    }

    setAvatarError(null)
    setPickedAvatarUrl(URL.createObjectURL(file))
    setValues((current) => ({ ...current, avatarFile: file, avatarRemoved: false }))
  }

  const handleAvatarRemove = () => {
    setAvatarError(null)
    setPickedAvatarUrl(null)
    setValues((current) => ({
      ...current,
      avatarFile: null,
      // Only the saved photo needs clearing on the server; discarding a pick is local.
      avatarRemoved: Boolean(existingAvatarKey),
    }))
  }

  const mergedErrors = useMemo<UserModalFieldErrors>(() => {
    return {
      firstName: fieldErrors.firstName || apiErrors?.first_name?.[0],
      middleName: fieldErrors.middleName || apiErrors?.middle_name?.[0],
      lastName: fieldErrors.lastName || apiErrors?.last_name?.[0],
      contactNumber: fieldErrors.contactNumber || apiErrors?.contact_number?.[0],
      email: fieldErrors.email || apiErrors?.email?.[0],
      role: fieldErrors.role || apiErrors?.role?.[0],
      password: fieldErrors.password || apiErrors?.password?.[0],
      confirmPassword: fieldErrors.confirmPassword || apiErrors?.password_confirmation?.[0],
    }
  }, [apiErrors, fieldErrors])

  const validate = (): UserModalFieldErrors => {
    const errors: UserModalFieldErrors = {}

    if (!values.firstName.trim()) {
      errors.firstName = 'First name is required.'
    } else if (values.firstName.trim().length > 255) {
      errors.firstName = 'First name must not exceed 255 characters.'
    }

    // Middle name is optional — not every account has one.
    if (values.middleName.trim().length > 255) {
      errors.middleName = 'Middle name must not exceed 255 characters.'
    }

    if (!values.lastName.trim()) {
      errors.lastName = 'Last name is required.'
    } else if (values.lastName.trim().length > 255) {
      errors.lastName = 'Last name must not exceed 255 characters.'
    }

    // Contact number is optional — it is not always known when the account is created.
    if (values.contactNumber.trim().length > 20) {
      errors.contactNumber = 'Contact number must not exceed 20 characters.'
    }

    if (!values.email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!emailRegex.test(values.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }

    if (!(ALL_ROLES as readonly string[]).includes(values.role)) {
      errors.role = 'Select a valid role.'
    }

    // Password is optional on create (blank → the system emails a temporary one).
    if (values.password && values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }

    if ((values.password || values.confirmPassword) && values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Confirm password must match password.'
    }

    return errors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) return

    await onSubmit({
      firstName: values.firstName.trim(),
      middleName: values.middleName.trim(),
      lastName: values.lastName.trim(),
      contactNumber: values.contactNumber.trim(),
      email: values.email.trim(),
      role: values.role,
      password: values.password,
      confirmPassword: values.confirmPassword,
      avatarFile: values.avatarFile,
      avatarRemoved: values.avatarRemoved,
    })
  }

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="cursor-pointer border border-[#d8e1d4] bg-white px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="admin-user-form"
        disabled={loading}
        className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
      >
        {loading ? <ButtonSpinner /> : null}
        {loading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
      </button>
    </div>
  )

  return (
    <AdminDialog
      open={open}
      title={mode === 'create' ? 'Create New User' : 'Edit User'}
      description={
        mode === 'create'
          ? 'Add a new account and assign its access level.'
          : 'Update the selected account details.'
      }
      footer={footer}
      maxWidthClassName="max-w-4xl"
      closeDisabled={loading}
      onClose={onClose}
    >
      <form id="admin-user-form" className="space-y-5" aria-busy={loading} onSubmit={handleSubmit}>
        {errorMessage ? (
          <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">{errorMessage}</div>
        ) : null}

        <div className="space-y-3 border border-[#e7eee3] bg-[#fbfdf9] px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <UserAvatar
              initials={buildInitials(values.firstName, values.lastName, values.email)}
              imageUrl={previewAvatarUrl}
              name={[values.firstName, values.lastName].filter(Boolean).join(' ') || 'New user'}
              size="lg"
            />

            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-[#123524]">Profile Photo (optional)</p>
                <p className="text-xs text-[#73856f]">
                  JPG or PNG, up to 2 MB. Without one, the account shows its initials.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* The file input is visually hidden; its label is the control (guidelines §6.13). */}
                <input
                  id="admin-user-avatar"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  disabled={loading}
                  onChange={handleAvatarSelected}
                />
                <label
                  htmlFor="admin-user-avatar"
                  aria-disabled={loading}
                  className={[
                    'inline-flex cursor-pointer items-center justify-center gap-2 border border-[#d8e1d4] bg-white px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] rounded-md',
                    loading ? 'pointer-events-none opacity-60' : '',
                  ].join(' ')}
                >
                  <PhotoCameraOutlinedIcon fontSize="small" />
                  {hasAvatar ? 'Change photo' : 'Upload photo'}
                </label>

                {hasAvatar ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleAvatarRemove}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#e3c9c9] px-4 py-2.5 text-sm font-medium text-[#9f2f2f] transition-colors hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-60 rounded-md"
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                    Remove photo
                  </button>
                ) : null}
              </div>

              {avatarError ? <p className="text-xs text-[#b93838]">{avatarError}</p> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm text-[#445846]">
            <span className="font-medium text-[#123524]">First Name</span>
            <input
              autoFocus
              type="text"
              value={values.firstName}
              disabled={loading}
              onChange={(event) => setValues((current) => ({ ...current, firstName: event.target.value }))}
              className="w-full border border-[#d8e1d4] px-3 py-2.5 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c] rounded-md"
              placeholder="Enter first name"
            />
            {mergedErrors.firstName ? <p className="text-xs text-[#b93838]">{mergedErrors.firstName}</p> : null}
          </label>

          <label className="space-y-2 text-sm text-[#445846]">
            <span className="font-medium text-[#123524]">Middle Name (optional)</span>
            <input
              type="text"
              value={values.middleName}
              disabled={loading}
              onChange={(event) => setValues((current) => ({ ...current, middleName: event.target.value }))}
              className="w-full border border-[#d8e1d4] px-3 py-2.5 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c] rounded-md"
              placeholder="Enter middle name"
            />
            {mergedErrors.middleName ? <p className="text-xs text-[#b93838]">{mergedErrors.middleName}</p> : null}
          </label>

          <label className="space-y-2 text-sm text-[#445846]">
            <span className="font-medium text-[#123524]">Last Name</span>
            <input
              type="text"
              value={values.lastName}
              disabled={loading}
              onChange={(event) => setValues((current) => ({ ...current, lastName: event.target.value }))}
              className="w-full border border-[#d8e1d4] px-3 py-2.5 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c] rounded-md"
              placeholder="Enter last name"
            />
            {mergedErrors.lastName ? <p className="text-xs text-[#b93838]">{mergedErrors.lastName}</p> : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm text-[#445846]">
            <span className="font-medium text-[#123524]">Contact Number (optional)</span>
            <input
              type="tel"
              value={values.contactNumber}
              disabled={loading}
              onChange={(event) => setValues((current) => ({ ...current, contactNumber: event.target.value }))}
              className="w-full border border-[#d8e1d4] px-3 py-2.5 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c] rounded-md"
              placeholder="Enter contact number"
            />
            {mergedErrors.contactNumber ? <p className="text-xs text-[#b93838]">{mergedErrors.contactNumber}</p> : null}
          </label>

          <label className="space-y-2 text-sm text-[#445846]">
            <span className="font-medium text-[#123524]">Email Address</span>
            <input
              type="email"
              value={values.email}
              disabled={loading}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
              className="w-full border border-[#d8e1d4] px-3 py-2.5 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c] rounded-md"
              placeholder="Enter email address"
            />
            {mergedErrors.email ? <p className="text-xs text-[#b93838]">{mergedErrors.email}</p> : null}
          </label>

          <label className="space-y-2 text-sm text-[#445846]">
            <span className="font-medium text-[#123524]">Role</span>
            <select
              value={values.role}
              disabled={loading}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  role: event.target.value as UserRole,
                }))
              }
              className="w-full cursor-pointer border border-[#d8e1d4] bg-white px-3 py-2.5 text-sm text-[#123524] outline-none transition-colors focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c] rounded-md"
            >
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            {mergedErrors.role ? <p className="text-xs text-[#b93838]">{mergedErrors.role}</p> : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-[#445846]">
            <span className="font-medium text-[#123524]">Password (optional)</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                disabled={loading}
                onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
                className="w-full border border-[#d8e1d4] px-3 py-2.5 pr-12 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c] rounded-md"
                placeholder={mode === 'create' ? 'Leave blank to email a temporary password' : 'Leave blank to keep current password'}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={loading}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-[#60755f] transition-colors hover:text-[#123524] disabled:cursor-not-allowed disabled:opacity-45 rounded-r-md"
              >
                {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
              </button>
            </div>
            {mergedErrors.password ? (
              <p className="text-xs text-[#b93838]">{mergedErrors.password}</p>
            ) : (
              <p className="text-xs text-[#73856f]">
                {mode === 'create'
                  ? 'Leave blank to email a temporary password the user must change on first login.'
                  : 'Only fill this in if the password should change.'}
              </p>
            )}
          </label>

          <label className="space-y-2 text-sm text-[#445846]">
            <span className="font-medium text-[#123524]">Confirm Password</span>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={values.confirmPassword}
                disabled={loading}
                onChange={(event) => setValues((current) => ({ ...current, confirmPassword: event.target.value }))}
                className="w-full border border-[#d8e1d4] px-3 py-2.5 pr-12 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c] rounded-md"
                placeholder={mode === 'create' ? 'Confirm password' : 'Confirm new password'}
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                aria-pressed={showConfirmPassword}
                disabled={loading}
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-[#60755f] transition-colors hover:text-[#123524] disabled:cursor-not-allowed disabled:opacity-45 rounded-r-md"
              >
                {showConfirmPassword ? (
                  <VisibilityOffRoundedIcon fontSize="small" />
                ) : (
                  <VisibilityRoundedIcon fontSize="small" />
                )}
              </button>
            </div>
            {mergedErrors.confirmPassword ? (
              <p className="text-xs text-[#b93838]">{mergedErrors.confirmPassword}</p>
            ) : (
              <p className="text-xs text-[#73856f]">
                {mode === 'create'
                  ? 'Password confirmation must match the password.'
                  : 'Only required when a new password is provided.'}
              </p>
            )}
          </label>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#617462]" role="status" aria-live="polite">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d8e1d4] border-t-[#1f5d3b]" />
            Saving user details...
          </div>
        ) : null}
      </form>
    </AdminDialog>
  )
}
