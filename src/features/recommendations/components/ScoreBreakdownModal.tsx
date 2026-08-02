import AdminDialog from '@/features/users/components/AdminDialog'
import PriorityBadge from '@/features/surveys/components/PriorityBadge'
import { DataTable, type DataTableColumn } from '@/shared/table'
import { formatDecimal, recomputeMatchScore, reconcilesWithStoredScore, sumContributions } from '../lib/format'
import type { CategoryContribution, Recommendation } from '../types'

type ScoreBreakdownModalProps = {
  open: boolean
  recommendation: Recommendation | null
  onClose: () => void
}

function SummaryRow({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string
  value: string
  hint?: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div>
        <p className={emphasis ? 'text-sm font-medium text-[#123524]' : 'text-sm text-[#445846]'}>{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-[#6a7f6d]">{hint}</p> : null}
      </div>
      <p
        className={[
          'shrink-0 tabular-nums',
          emphasis ? 'text-base font-semibold text-[#123524]' : 'text-sm font-medium text-[#123524]',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * "Why was this recommended?" — renders the stored `score_breakdown` as the arithmetic that produced
 * the match score. Module 4 requires every displayed score to be reproducible from this object, so
 * the dialog recomputes the total from the rows shown rather than echoing the stored value.
 */
export default function ScoreBreakdownModal({ open, recommendation, onClose }: ScoreBreakdownModalProps) {
  const breakdown = recommendation?.breakdown ?? null

  const columns: DataTableColumn<CategoryContribution>[] = [
    {
      key: 'category',
      header: 'Need category',
      frozen: true,
      width: 190,
      cellClassName: 'truncate text-[#123524]',
      render: (row) => row.needCategoryName,
    },
    {
      key: 'avg',
      header: 'Avg score',
      width: 110,
      align: 'right',
      render: (row) => formatDecimal(row.avgScore),
    },
    {
      key: 'priority',
      header: 'Priority',
      width: 130,
      render: (row) => <PriorityBadge priority={row.priority} />,
    },
    {
      key: 'multiplier',
      header: 'Multiplier',
      width: 110,
      align: 'right',
      render: (row) => `x${formatDecimal(row.multiplier)}`,
    },
    {
      key: 'weight',
      header: 'Matrix weight',
      width: 130,
      align: 'right',
      render: (row) => `x${formatDecimal(row.weight)}`,
    },
    {
      key: 'contribution',
      header: 'Contribution',
      width: 130,
      align: 'right',
      cellClassName: 'font-medium text-[#123524]',
      render: (row) => formatDecimal(row.contribution),
    },
  ]

  return (
    <AdminDialog
      open={open}
      title="Why this program was recommended"
      description={
        recommendation
          ? `${recommendation.programTypeName} — every figure below comes from the stored breakdown this recommendation was generated with.`
          : undefined
      }
      maxWidthClassName="max-w-3xl"
      onClose={onClose}
    >
      {!breakdown ? (
        <p className="py-6 text-center text-sm text-[#617462]">
          No score breakdown was stored for this recommendation.
        </p>
      ) : (
        <div className="space-y-5">
          <p className="text-sm leading-6 text-[#506552]">
            Each need category the survey measured contributes its average score multiplied by the
            priority multiplier and this program type&apos;s matrix weight. The total is normalised
            against the highest score this program type could have reached on the same categories.
          </p>

          <DataTable
            columns={columns}
            rows={breakdown.categories}
            rowKey={(row) => row.needCategoryId}
            emptyMessage="This program type is not weighted against any need category the survey measured, so it scored 0."
            minWidthClassName="min-w-[800px]"
          />

          <div className="border border-[#d8e1d4] bg-white px-4 py-2">
            <div className="divide-y divide-[#eef2eb]">
              <SummaryRow
                label="Raw score"
                hint="Sum of the contributions above"
                value={formatDecimal(sumContributions(breakdown))}
              />
              <SummaryRow
                label="Sector bonus"
                hint={
                  breakdown.sectorBonusApplied
                    ? `+10% — this program type targets ${breakdown.matchedSectors.join(', ')}`
                    : 'Not applied — no overlap with the community’s target sectors'
                }
                value={`+${formatDecimal(breakdown.sectorBonus)}`}
              />
              <SummaryRow
                label="Maximum possible"
                hint="A perfect 5.00, critical-priority result on these same categories"
                value={formatDecimal(breakdown.maxTheoretical)}
              />
              <SummaryRow
                label="Match score"
                hint="(raw + bonus) / maximum x 100, capped at 100"
                value={`${formatDecimal(recomputeMatchScore(breakdown))} / 100`}
                emphasis
              />
            </div>
          </div>

          {reconcilesWithStoredScore(breakdown) ? (
            <p className="text-xs text-[#6a7f6d]">
              Recomputed from the figures above, this matches the stored score of{' '}
              {formatDecimal(breakdown.matchScore)}.
            </p>
          ) : (
            <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">
              The stored score ({formatDecimal(breakdown.matchScore)}) does not match the figures above.
              Regenerate the recommendations for this assessment and report this if it persists.
            </div>
          )}

          <p className="text-xs text-[#6a7f6d]">
            Editing the scoring matrix does not rescore recommendations that already exist — this
            breakdown is the one this recommendation was generated with.
          </p>
        </div>
      )}
    </AdminDialog>
  )
}
