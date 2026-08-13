import { CAMPUS_CONTACT } from '@/shared/config/campusContact'
import PublicShell from '../components/PublicShell'

const sectionClassName = 'rounded-lg border border-line bg-surface px-5 py-5'
const headingClassName = 'text-lg font-semibold tracking-[-0.02em] text-ink'
const bodyClassName = 'mt-2 text-sm leading-7 text-body'

/**
 * Standalone privacy notice (RA 10173 — spec §5.3). The survey form carries a short
 * inline version above its consent checkbox; this is the long form it links to, and the
 * page the login screen exposes to the public.
 */
export default function PrivacyNoticePage() {
  return (
    <PublicShell subtitle="Privacy Notice" backTo="/login" backLabel="Back to sign in">
      <section className={sectionClassName}>
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-ink">Privacy notice</h1>
        <p className={bodyClassName}>
          This notice explains how {CAMPUS_CONTACT.campusName} handles the information you give us
          through the Community Needs Assessment survey. Your data is processed under the Data Privacy
          Act of 2012 (RA 10173).
        </p>
      </section>

      <section className={sectionClassName}>
        <h2 className={headingClassName}>What we collect</h2>
        <p className={bodyClassName}>
          Your answers to the survey questions, and a small amount of background information used to
          check that programs reach everyone fairly: your sex (required), and optionally your age group
          and the sector you belong to.
        </p>
        <p className={bodyClassName}>
          <strong className="font-medium text-ink">We do not collect your name or contact details.</strong>{' '}
          The survey does not ask for them and does not accept file uploads.
        </p>
      </section>

      <section className={sectionClassName}>
        <h2 className={headingClassName}>How we use it</h2>
        <p className={bodyClassName}>
          Your answers are used solely to plan community extension programs — identifying which needs are
          most pressing in your community and which programs to prioritize. Results are reported only as
          anonymous, aggregated statistics. No report identifies an individual respondent.
        </p>
      </section>

      <section className={sectionClassName}>
        <h2 className={headingClassName}>Who can see it</h2>
        <p className={bodyClassName}>
          Only authorised extension staff of {CAMPUS_CONTACT.campusName} can access survey results,
          through accounts protected by sign-in. Aggregated findings may be included in official
          university extension reports.
        </p>
      </section>

      <section className={sectionClassName}>
        <h2 className={headingClassName}>Your rights</h2>
        <p className={bodyClassName}>
          Under RA 10173 you have the right to be informed about how your data is processed, to access it,
          to object to its processing, to have inaccurate data corrected, to have your data erased or
          blocked in the cases the law provides, and to lodge a complaint with the National Privacy
          Commission.
        </p>
        <p className={bodyClassName}>
          Because responses are collected without your name, we may be unable to locate your individual
          response after you submit it. If you want to raise a concern, contact the office below.
        </p>
      </section>

      <section className={sectionClassName}>
        <h2 className={headingClassName}>Contact us</h2>
        <p className={bodyClassName}>
          {CAMPUS_CONTACT.officeName}
          <br />
          {CAMPUS_CONTACT.campusName}
          <br />
          {CAMPUS_CONTACT.address}
        </p>
        <p className="mt-2 text-sm leading-7 text-body">
          <a
            href={`mailto:${CAMPUS_CONTACT.email}`}
            className="font-medium text-primary-accent transition-colors hover:text-primary-hover"
          >
            {CAMPUS_CONTACT.email}
          </a>
          <br />
          {CAMPUS_CONTACT.phone}
        </p>
      </section>
    </PublicShell>
  )
}
