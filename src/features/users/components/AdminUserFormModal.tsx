import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { useMemo, useState, type FormEvent } from 'react'
import type { ApiValidationErrors } from '@/shared/api/http'
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
}

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
  role: 'user',
  password: '',
  confirmPassword: '',
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
  }
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

    if (!values.middleName.trim()) {
      errors.middleName = 'Middle name is required.'
    } else if (values.middleName.trim().length > 255) {
      errors.middleName = 'Middle name must not exceed 255 characters.'
    }

    if (!values.lastName.trim()) {
      errors.lastName = 'Last name is required.'
    } else if (values.lastName.trim().length > 255) {
      errors.lastName = 'Last name must not exceed 255 characters.'
    }

    if (!values.contactNumber.trim()) {
      errors.contactNumber = 'Contact number is required.'
    } else if (values.contactNumber.trim().length > 20) {
      errors.contactNumber = 'Contact number must not exceed 20 characters.'
    }

    if (!values.email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!emailRegex.test(values.email.trim())) {
      errors.email = 'Enter a valid email address.'
    }

    if (!['admin', 'user'].includes(values.role)) {
      errors.role = 'Select a valid role.'
    }

    if (mode === 'create' && !values.password) {
      errors.password = 'Password is required.'
    } else if (values.password && values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }

    if (mode === 'create' && !values.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required.'
    } else if ((values.password || values.confirmPassword) && values.password !== values.confirmPassword) {
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
    })
  }

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="cursor-pointer border border-[#d8e1d4] bg-white px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="admin-user-form"
        disabled={loading}
        className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60"
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

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm text-[#445846]">
            <span className="font-medium text-[#123524]">First Name</span>
            <input
              autoFocus
              type="text"
              value={values.firstName}
              disabled={loading}
              onChange={(event) => setValues((current) => ({ ...current, firstName: event.target.value }))}
              className="w-full border border-[#d8e1d4] px-3 py-2.5 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]"
              placeholder="Enter first name"
            />
            {mergedErrors.firstName ? <p className="text-xs text-[#b93838]">{mergedErrors.firstName}</p> : null}
          </label>

          <label className="space-y-2 text-sm text-[#445846]">
            <span className="font-medium text-[#123524]">Middle Name</span>
            <input
              type="text"
              value={values.middleName}
              disabled={loading}
              onChange={(event) => setValues((current) => ({ ...current, middleName: event.target.value }))}
              className="w-full border border-[#d8e1d4] px-3 py-2.5 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]"
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
              className="w-full border border-[#d8e1d4] px-3 py-2.5 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]"
              placeholder="Enter last name"
            />
            {mergedErrors.lastName ? <p className="text-xs text-[#b93838]">{mergedErrors.lastName}</p> : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm text-[#445846]">
            <span className="font-medium text-[#123524]">Contact Number</span>
            <input
              type="tel"
              value={values.contactNumber}
              disabled={loading}
              onChange={(event) => setValues((current) => ({ ...current, contactNumber: event.target.value }))}
              className="w-full border border-[#d8e1d4] px-3 py-2.5 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]"
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
              className="w-full border border-[#d8e1d4] px-3 py-2.5 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]"
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
              className="w-full cursor-pointer border border-[#d8e1d4] bg-white px-3 py-2.5 text-sm text-[#123524] outline-none transition-colors focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {mergedErrors.role ? <p className="text-xs text-[#b93838]">{mergedErrors.role}</p> : null}
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-[#445846]">
            <span className="font-medium text-[#123524]">
              {mode === 'create' ? 'Password' : 'Password (optional)'}
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                disabled={loading}
                onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
                className="w-full border border-[#d8e1d4] px-3 py-2.5 pr-12 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]"
                placeholder={mode === 'create' ? 'Create password' : 'Leave blank to keep current password'}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={loading}
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-[#60755f] transition-colors hover:text-[#123524] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
              </button>
            </div>
            {mergedErrors.password ? (
              <p className="text-xs text-[#b93838]">{mergedErrors.password}</p>
            ) : (
              <p className="text-xs text-[#73856f]">
                {mode === 'create' ? 'Use at least 8 characters.' : 'Only fill this in if the password should change.'}
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
                className="w-full border border-[#d8e1d4] px-3 py-2.5 pr-12 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#91a091] focus:border-[#1f5d3b] focus:bg-[#fbfdf9] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]"
                placeholder={mode === 'create' ? 'Confirm password' : 'Confirm new password'}
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                aria-pressed={showConfirmPassword}
                disabled={loading}
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-[#60755f] transition-colors hover:text-[#123524] disabled:cursor-not-allowed disabled:opacity-45"
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
