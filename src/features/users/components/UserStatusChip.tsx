import Chip from '@mui/material/Chip'
import type { UserStatus } from '../types'

type UserStatusChipProps = {
  status: UserStatus
}

export default function UserStatusChip({ status }: UserStatusChipProps) {
  const isActive = status === 'active'

  return (
    <Chip
      size="small"
      label={isActive ? 'Active' : 'Inactive'}
      color={isActive ? 'success' : 'default'}
      variant={isActive ? 'filled' : 'outlined'}
    />
  )
}
