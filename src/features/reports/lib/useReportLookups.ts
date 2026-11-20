import { useCallback, useEffect, useState } from 'react'
import { listCommunities } from '@/features/communities/api/communitiesApi'
import { listAcademicPeriods, type AcademicPeriod } from '@/features/dashboard'
import { listPrograms } from '@/features/programs/api/programsApi'
import type { CommunityOption, ReportableProgram } from '../types'
import { getReportErrorMessage } from './deliver'

const REPORTABLE_STATUSES = ['approved', 'ongoing', 'completed'] as const

type ReportLookups = {
  periods: AcademicPeriod[]
  communities: CommunityOption[]
  programs: ReportableProgram[]
  loading: boolean
  errorMessage: string | null
  reload: () => void
}

/**
 * The options every generator draws from, fetched once for the page: the academic calendar, the
 * communities, and the programs past final approval.
 *
 * Programs come from the ordinary programs list, so a faculty member's options are already scoped to
 * what they lead or are assigned to — the same rule the server applies to the report itself. Each
 * reportable status is fetched separately because the list filters one status at a time.
 */
export function useReportLookups(): ReportLookups {
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [communities, setCommunities] = useState<CommunityOption[]>([])
  const [programs, setPrograms] = useState<ReportableProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErrorMessage(null)

    void (async () => {
      try {
        const [periodList, communityPage, ...programPages] = await Promise.all([
          listAcademicPeriods(),
          listCommunities({ per_page: 100, sort: 'name', direction: 'asc' }),
          ...REPORTABLE_STATUSES.map((status) =>
            listPrograms({ status, per_page: 100, sort: 'title', direction: 'asc' }),
          ),
        ])
        if (cancelled) return

        setPeriods(periodList)
        setCommunities(communityPage.data.map((community) => ({ id: community.id, name: community.name })))
        setPrograms(
          programPages
            .flatMap((page) => page.data)
            .map((program) => ({
              id: program.id,
              title: program.title,
              status: program.status as ReportableProgram['status'],
              communityName: program.communityName,
            }))
            .sort((left, right) => left.title.localeCompare(right.title)),
        )
      } catch (error) {
        if (!cancelled) setErrorMessage(getReportErrorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => setAttempt((value) => value + 1), [])

  return { periods, communities, programs, loading, errorMessage, reload }
}
