import { useEffect, useState } from 'react'
import { hasAnyRole } from '@/features/auth/lib/access'
import { useAuthStore } from '@/features/auth/store/authStore'
import { CAMPUS_WIDE_ROLES, type Department } from '@/features/auth/types'
import { listDepartments } from '../api/departmentsApi'

/**
 * Department picker/filter options for the current user.
 *
 * Only campus-wide roles get options: a departmental user's lists are already their department's
 * (Phase C), so a department filter or column would only ever show one value. A failed lookup
 * leaves the list empty — the filter is an aid, it must never block the page it sits on.
 */
export function useDepartmentOptions(): { isCampusWide: boolean; departments: Department[] } {
  const currentUser = useAuthStore((state) => state.user)
  const isCampusWide = hasAnyRole(currentUser, CAMPUS_WIDE_ROLES)
  const [departments, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    if (!isCampusWide) return
    let cancelled = false
    listDepartments()
      .then((rows) => {
        if (!cancelled) setDepartments(rows)
      })
      .catch(() => {
        if (!cancelled) setDepartments([])
      })
    return () => {
      cancelled = true
    }
  }, [isCampusWide])

  return { isCampusWide, departments: isCampusWide ? departments : [] }
}
