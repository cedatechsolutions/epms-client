import { Link } from 'react-router'
import ProgramStatusChip from '@/features/programs/components/ProgramStatusChip'
import { DataTable, type DataTableColumn } from '@/shared/table'
import { formatCoverage, formatNumber } from '../lib/format'
import type { ProgramCompletionRow } from '../types'

const presentChipClassName =
  'inline-flex rounded-md border border-success-border bg-success-bg px-2.5 py-1 text-xs font-medium text-primary-accent'
const absentChipClassName =
  'inline-flex rounded-md border border-line bg-surface-tint px-2.5 py-1 text-xs font-medium text-muted'

/** Encoded / not encoded, as a chip pair — a blank cell would read as missing data, not as "none". */
function EvaluationChip({ label, present }: { label: string; present: boolean }) {
  return (
    <span className={present ? presentChipClassName : absentChipClassName}>
      {label}
      {present ? ' ✓' : ' —'}
    </span>
  )
}

/**
 * The program completion table (spec Module 6 §4). Every row links to the program it names, so a
 * figure on this screen is always one click from the record that produced it.
 *
 * The payload caps at 200 rows while `completionTotal` reports the true count; when the two differ
 * the caller says so beneath the table rather than letting the page imply it is showing everything.
 */
export default function CompletionTable({
  rows,
  loading,
}: {
  rows: ProgramCompletionRow[]
  loading: boolean
}) {
  const columns: DataTableColumn<ProgramCompletionRow>[] = [
    {
      key: 'title',
      header: 'Program',
      frozen: true,
      width: 260,
      cellClassName: 'text-ink',
      render: (row) => (
        <Link
          to={`/admin/programs/${row.programId}`}
          className="block truncate rounded-md font-medium text-primary-accent hover:underline"
          title={row.title}
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'community',
      header: 'Community',
      width: 170,
      render: (row) => row.communityName ?? '-',
    },
    {
      key: 'programType',
      header: 'Program Type',
      width: 170,
      render: (row) => row.programTypeName ?? '-',
    },
    {
      key: 'status',
      header: 'Status',
      width: 180,
      render: (row) => <ProgramStatusChip status={row.status} />,
    },
    {
      key: 'target',
      header: 'Target',
      width: 110,
      cellClassName: 'tabular-nums',
      render: (row) => (row.targetBeneficiaries === null ? '-' : formatNumber(row.targetBeneficiaries)),
    },
    {
      key: 'reached',
      header: 'Reached (F / M)',
      width: 190,
      cellClassName: 'tabular-nums whitespace-nowrap',
      render: (row) => (
        <>
          {formatNumber(row.actualTotal)}{' '}
          <span className="text-muted-alt">
            ({formatNumber(row.actualFemale)} / {formatNumber(row.actualMale)})
          </span>
        </>
      ),
    },
    {
      key: 'coverage',
      header: 'Coverage',
      width: 120,
      cellClassName: 'tabular-nums',
      render: (row) => formatCoverage(row.actualTotal, row.targetBeneficiaries),
    },
    {
      key: 'evaluations',
      header: 'Evaluations',
      width: 200,
      render: (row) => (
        <span className="flex flex-wrap gap-2">
          <EvaluationChip label="Pre" present={row.hasPreEvaluation} />
          <EvaluationChip label="Post" present={row.hasPostEvaluation} />
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.programId}
      loading={loading}
      loadingLabel="Loading program completion..."
      emptyMessage="No programs fall in this period yet."
      minWidthClassName="min-w-[1400px]"
    />
  )
}
