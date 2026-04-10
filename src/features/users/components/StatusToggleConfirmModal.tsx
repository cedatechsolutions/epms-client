import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material'
import type { User } from '../types'

type StatusToggleConfirmModalProps = {
  open: boolean
  user: User | null
  loading?: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function StatusToggleConfirmModal({
  open,
  user,
  loading = false,
  onClose,
  onConfirm,
}: StatusToggleConfirmModalProps) {
  const willDeactivate = user?.status === 'active'

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{willDeactivate ? 'Deactivate User' : 'Activate User'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {willDeactivate
            ? 'This user will no longer be able to access the system.'
            : 'This user will regain access to the system.'}
        </DialogContentText>
        {user ? (
          <Typography variant="body2" sx={{ mt: 1.5 }} color="text.secondary">
            User: {user.full_name} ({user.email})
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color={willDeactivate ? 'error' : 'primary'} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : willDeactivate ? 'Deactivate' : 'Activate'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
