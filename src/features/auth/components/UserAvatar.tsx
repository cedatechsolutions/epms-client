const sizeClassNames = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-2xl',
} as const

export type UserAvatarSize = keyof typeof sizeClassNames

type UserAvatarProps = {
  /** Fallback shown when the user has no photo (or it failed to load). */
  initials: string
  /** Object URL of the fetched photo, or null. */
  imageUrl: string | null
  /** Used for the image's alt text. */
  name: string
  size?: UserAvatarSize
}

/**
 * The one way a user is pictured in the app: their photo when they have one, their initials on the
 * primary green otherwise. Circular is the single deliberate exception to the square-corner rule
 * (UI guidelines §2), and it applies to the image and the initials alike so the two are
 * interchangeable in any slot.
 */
export default function UserAvatar({ initials, imageUrl, name, size = 'sm' }: UserAvatarProps) {
  return (
    <span
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-white',
        sizeClassNames[size],
      ].join(' ')}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={`${name} profile photo`} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  )
}
