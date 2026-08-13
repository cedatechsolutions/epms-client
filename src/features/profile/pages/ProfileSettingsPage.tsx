import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  changePassword,
  deleteAvatar,
  getPrimaryRoleLabel,
  getUserDisplayName,
  getUserInitials,
  updateProfile,
  uploadAvatar,
  useAuthStore,
  UserAvatar,
} from '@/features/auth'
import { isApiError } from '@/shared/api/http'
import { notify } from '@/shared/toast'

const inputClassName =
  'w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong rounded-md'
const labelClassName = 'mb-2 block text-sm font-medium text-ink'
const primaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const secondaryButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const destructiveButtonClassName =
  'inline-flex cursor-pointer items-center justify-center gap-2 border border-danger-border px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-bg-soft disabled:cursor-not-allowed disabled:opacity-60 rounded-md'
const sectionClassName = 'rounded-lg overflow-hidden border border-line bg-surface'
const sectionHeaderClassName = 'border-b border-divider px-5 py-4'
const sectionTitleClassName = 'text-lg font-semibold tracking-[-0.02em] text-ink'
const alertClassName = 'border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text'
const darkSpinnerClassName = 'h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white'

/** Mirrors the server-side avatar rule so an oversized or wrong-typed file never leaves the browser. */
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png']

function getErrorMessage(error: unknown, fallback: string): string {
  return isApiError(error) ? error.message : fallback
}

export default function ProfileSettingsPage() {
  const user = useAuthStore((state) => state.user)
  const avatarUrl = useAuthStore((state) => state.avatarUrl)
  const setUser = useAuthStore((state) => state.setUser)

  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: '',
  })

  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirmation: '',
  })

  // Seed the form from the session user, and re-seed if those values change underneath us.
  // Deliberately not keyed on `user` itself: an avatar upload replaces the object, and that must
  // not wipe out edits the user is part-way through typing here.
  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName ?? '',
      middleName: user?.middleName ?? '',
      lastName: user?.lastName ?? '',
      contactNumber: user?.contactNumber ?? '',
    })
  }, [user?.firstName, user?.middleName, user?.lastName, user?.contactNumber])

  if (!user) {
    return null
  }

  const displayName = getUserDisplayName(user)
  const initials = getUserInitials(user)
  const roleLabel = getPrimaryRoleLabel(user)

  const handleAvatarSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset immediately so re-picking the same file still fires a change event.
    event.target.value = ''
    if (!file) {
      return
    }

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Profile photo must be a JPG or PNG image.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Profile photo exceeds the 2 MB maximum.')
      return
    }

    setAvatarError(null)
    setAvatarSaving(true)
    try {
      setUser(await uploadAvatar(file))
      notify.success('Profile photo updated.')
    } catch (error) {
      setAvatarError(getErrorMessage(error, 'Unable to upload your profile photo. Please try again.'))
    } finally {
      setAvatarSaving(false)
    }
  }

  const handleAvatarRemove = async () => {
    setAvatarError(null)
    setAvatarSaving(true)
    try {
      setUser(await deleteAvatar())
      notify.success('Profile photo removed.')
    } catch (error) {
      setAvatarError(getErrorMessage(error, 'Unable to remove your profile photo. Please try again.'))
    } finally {
      setAvatarSaving(false)
    }
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileError(null)
    setProfileSaving(true)

    try {
      setUser(
        await updateProfile({
          firstName: profileForm.firstName.trim(),
          lastName: profileForm.lastName.trim(),
          middleName: profileForm.middleName.trim(),
          contactNumber: profileForm.contactNumber.trim(),
        }),
      )
      notify.success('Personal information updated.')
    } catch (error) {
      setProfileError(getErrorMessage(error, 'Unable to save your personal information. Please try again.'))
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError(null)

    if (passwordForm.newPassword !== passwordForm.newPasswordConfirmation) {
      setPasswordError('Password confirmation must match the new password.')
      return
    }

    setPasswordSaving(true)
    try {
      await changePassword(passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '', newPasswordConfirmation: '' })
      notify.success('Password updated.')
    } catch (error) {
      setPasswordError(getErrorMessage(error, 'Unable to change your password. Please try again.'))
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow">
            Settings
          </p>
          <h4 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">
            Profile Settings
          </h4>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-body">
            Update the photo, personal information and password for your own account. Your email
            address, role and account status are managed by an administrator.
          </p>
        </div>
      </div>

      {/* --- profile photo --- */}
      <section className={sectionClassName}>
        <div className={sectionHeaderClassName}>
          <h5 className={sectionTitleClassName}>Profile photo</h5>
          <p className="mt-1 text-sm text-muted">
            Shown beside your name in the header. JPG or PNG, up to 2 MB.
          </p>
        </div>

        <div className="space-y-4 px-5 py-5">
          {avatarError ? <div className={alertClassName}>{avatarError}</div> : null}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative" aria-busy={avatarSaving}>
              <UserAvatar initials={initials} imageUrl={avatarUrl} name={displayName} size="lg" />
              {avatarSaving ? (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-[#123524]/45">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                </span>
              ) : null}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-ink">{displayName}</p>
                <p className="text-xs text-muted-alt">{roleLabel}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* The file input itself is visually hidden; the label is the control. */}
                <input
                  id="avatar-file"
                  type="file"
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  disabled={avatarSaving}
                  onChange={(event) => void handleAvatarSelected(event)}
                />
                <label
                  htmlFor="avatar-file"
                  aria-disabled={avatarSaving}
                  className={[
                    secondaryButtonClassName,
                    avatarSaving ? 'pointer-events-none opacity-60' : '',
                  ].join(' ')}
                >
                  <PhotoCameraOutlinedIcon fontSize="small" />
                  {user.avatarUpdatedAt ? 'Change photo' : 'Upload photo'}
                </label>

                {user.avatarUpdatedAt ? (
                  <button
                    type="button"
                    disabled={avatarSaving}
                    onClick={() => void handleAvatarRemove()}
                    className={destructiveButtonClassName}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                    Remove photo
                  </button>
                ) : null}
              </div>

              <p className="text-xs text-muted-alt">
                Without a photo, your initials are shown instead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- personal information --- */}
      <section className={sectionClassName}>
        <div className={sectionHeaderClassName}>
          <h5 className={sectionTitleClassName}>Personal information</h5>
          <p className="mt-1 text-sm text-muted">
            Your name and contact number as they appear across the system.
          </p>
        </div>

        <form onSubmit={(event) => void handleProfileSubmit(event)}>
          <div className="space-y-5 px-5 py-5">
            {profileError ? <div className={alertClassName}>{profileError}</div> : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={labelClassName}>
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  maxLength={255}
                  disabled={profileSaving}
                  value={profileForm.firstName}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="middleName" className={labelClassName}>
                  Middle name
                </label>
                <input
                  id="middleName"
                  name="middleName"
                  type="text"
                  maxLength={255}
                  disabled={profileSaving}
                  value={profileForm.middleName}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, middleName: event.target.value }))
                  }
                  placeholder="Optional"
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="lastName" className={labelClassName}>
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  maxLength={255}
                  disabled={profileSaving}
                  value={profileForm.lastName}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="contactNumber" className={labelClassName}>
                  Contact number
                </label>
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  maxLength={255}
                  disabled={profileSaving}
                  value={profileForm.contactNumber}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, contactNumber: event.target.value }))
                  }
                  placeholder="09XXXXXXXXX"
                  className={inputClassName}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="email" className={labelClassName}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={user.email}
                  disabled
                  readOnly
                  className={inputClassName}
                />
                <p className="mt-2 text-xs text-warning">
                  Your email is your sign-in identity — only an administrator can change it.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-divider bg-row-hover px-5 py-4">
            <button type="submit" disabled={profileSaving} className={primaryButtonClassName}>
              {profileSaving ? <span className={darkSpinnerClassName} /> : null}
              {profileSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      {/* --- password --- */}
      <section className={sectionClassName}>
        <div className={sectionHeaderClassName}>
          <h5 className={sectionTitleClassName}>Password</h5>
          <p className="mt-1 text-sm text-muted">
            Enter your current password to confirm, then choose a new one of at least 8 characters.
          </p>
        </div>

        <form onSubmit={(event) => void handlePasswordSubmit(event)}>
          <div className="space-y-5 px-5 py-5">
            {passwordError ? <div className={alertClassName}>{passwordError}</div> : null}

            <div className="max-w-xl">
              <label htmlFor="currentPassword" className={labelClassName}>
                Current password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={passwordSaving}
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                  }
                  className={`${inputClassName} pr-12 rounded-md`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  disabled={passwordSaving}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-icon-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 rounded-r-md"
                >
                  {showPassword ? (
                    <VisibilityOffRoundedIcon fontSize="small" />
                  ) : (
                    <VisibilityRoundedIcon fontSize="small" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="newPassword" className={labelClassName}>
                  New password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={passwordSaving}
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                  }
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="newPasswordConfirmation" className={labelClassName}>
                  Confirm new password
                </label>
                <input
                  id="newPasswordConfirmation"
                  name="newPasswordConfirmation"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={passwordSaving}
                  value={passwordForm.newPasswordConfirmation}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      newPasswordConfirmation: event.target.value,
                    }))
                  }
                  className={inputClassName}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-divider bg-row-hover px-5 py-4">
            <button type="submit" disabled={passwordSaving} className={primaryButtonClassName}>
              {passwordSaving ? <span className={darkSpinnerClassName} /> : null}
              {passwordSaving ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
