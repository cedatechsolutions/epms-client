import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import type { ProposalDraftContent } from '../types'

/**
 * The "this is AI-made" label (UI guidelines §6.17). Always shown next to AI-written text, in the
 * informational tone so it never reads as an approval or a status.
 */
export function AiDraftBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-info-border bg-info-bg px-2.5 py-1 text-xs font-medium text-info-text">
      <AutoAwesomeOutlinedIcon sx={{ fontSize: 14 }} aria-hidden="true" />
      AI-generated draft — review before submitting
    </span>
  )
}

const headingClassName = 'text-xs font-semibold uppercase tracking-[0.12em] text-label'
const chipClassName =
  'inline-flex rounded-md border border-line bg-surface-tint px-2.5 py-1 text-xs font-medium text-ink'

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={headingClassName}>{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function Paragraph({ text }: { text: string | null }) {
  return text ? (
    <p className="whitespace-pre-line text-sm leading-6 text-body">{text}</p>
  ) : (
    <p className="text-sm text-muted">-</p>
  )
}

function Bullets({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  if (items.length === 0) return <p className="text-sm text-muted">-</p>
  const List = ordered ? 'ol' : 'ul'
  return (
    <List className={['space-y-1 pl-5 text-sm leading-6 text-body', ordered ? 'list-decimal' : 'list-disc'].join(' ')}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </List>
  )
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-muted">-</p>
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className={chipClassName}>
          {item}
        </li>
      ))}
    </ul>
  )
}

/**
 * Every field of an AI draft, read-only. Shared by the recommendation card's expanded preview and
 * the program page's "AI draft (reference)" panel, so the two never drift.
 */
export default function AiDraftDetails({ content }: { content: ProposalDraftContent }) {
  return (
    <div className="space-y-5">
      <Block title="Rationale">
        <Paragraph text={content.rationale} />
      </Block>
      <Block title="Objectives">
        <Bullets items={content.objectives} ordered />
      </Block>
      <Block title="Target beneficiaries">
        <Paragraph text={content.targetBeneficiaries} />
        {content.estimatedBeneficiaries !== null ? (
          <p className="mt-1 text-xs text-muted-alt">
            Estimated reach: {content.estimatedBeneficiaries.toLocaleString('en-US')} people
          </p>
        ) : null}
      </Block>
      <Block title="Gender and development (GAD) considerations">
        <Paragraph text={content.gadConsiderations} />
      </Block>
      <Block title="Suggested activities">
        {content.activities.length === 0 ? (
          <p className="text-sm text-muted">-</p>
        ) : (
          <ol className="space-y-2 pl-5 text-sm leading-6 text-body list-decimal">
            {content.activities.map((activity) => (
              <li key={activity.name}>
                <span className="font-medium text-ink">{activity.name}</span>
                {activity.description ? <span> — {activity.description}</span> : null}
              </li>
            ))}
          </ol>
        )}
      </Block>
      <Block title="Expected outputs and outcomes">
        <Bullets items={content.expectedOutputs} />
      </Block>
      <div className="grid gap-5 sm:grid-cols-3">
        <Block title="Suggested duration">
          <Paragraph text={content.suggestedDuration} />
        </Block>
        <Block title="Partner departments">
          <Chips items={content.partnerDepartments} />
        </Block>
        <Block title="Needs addressed">
          <Chips items={content.needsAddressed} />
        </Block>
      </div>
    </div>
  )
}
