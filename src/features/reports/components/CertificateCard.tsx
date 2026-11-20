import { useState } from 'react'
import { generateCertificates } from '../api/reportsApi'
import { deliverGeneratedReport, getReportErrorMessage, todayInManila } from '../lib/deliver'
import { PROGRAM_STATUS_SHORT_LABELS } from '../lib/labels'
import { fieldLabelClassName, helpTextClassName, inputClassName, selectClassName } from '../lib/ui'
import type { CertificateOutput, CertificateRecipients, GeneratedReport, ReportableProgram } from '../types'
import GeneratorCard from './GeneratorCard'

type CertificateCardProps = {
  programs: ReportableProgram[]
  lookupsLoading: boolean
  onGenerated: (report: GeneratedReport) => void
}

/**
 * Spec Module 7 §3. Beneficiary names print exactly as encoded in attendance and shrink to fit
 * rather than overflow; someone who attended several sessions gets one certificate.
 */
export default function CertificateCard({ programs, lookupsLoading, onGenerated }: CertificateCardProps) {
  const [programId, setProgramId] = useState('')
  const [recipients, setRecipients] = useState<CertificateRecipients>('beneficiaries')
  const [output, setOutput] = useState<CertificateOutput>('pdf')
  const [issuedOn, setIssuedOn] = useState(todayInManila)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!programId) {
      setErrorMessage('Choose a program.')
      return
    }
    setLoading(true)
    setErrorMessage(null)
    try {
      const report = await generateCertificates({
        programId,
        recipientType: recipients,
        output,
        issuedOn: issuedOn || undefined,
      })
      onGenerated(report)
      await deliverGeneratedReport(report, 'Certificates')
    } catch (error) {
      setErrorMessage(getReportErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || lookupsLoading
  const noPrograms = !lookupsLoading && programs.length === 0

  return (
    <GeneratorCard
      id="certificates"
      title="Certificates"
      description="One certificate per participant or faculty member, on the campus's default template."
      submitLabel="Generate certificates"
      loadingLabel="Generating..."
      loading={loading}
      disabled={lookupsLoading || noPrograms}
      errorMessage={errorMessage}
      onSubmit={() => void handleSubmit()}
    >
      <div>
        <label htmlFor="certificate-program" className={fieldLabelClassName}>
          Program
        </label>
        <select
          id="certificate-program"
          value={programId}
          disabled={disabled || noPrograms}
          onChange={(event) => {
            setProgramId(event.target.value)
            setErrorMessage(null)
          }}
          className={selectClassName}
        >
          <option value="">{noPrograms ? 'No approved programs yet' : 'Choose a program'}</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.title} ({PROGRAM_STATUS_SHORT_LABELS[program.status]})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="certificate-recipients" className={fieldLabelClassName}>
          Recipients
        </label>
        <select
          id="certificate-recipients"
          value={recipients}
          disabled={disabled}
          onChange={(event) => setRecipients(event.target.value as CertificateRecipients)}
          className={selectClassName}
        >
          <option value="beneficiaries">Beneficiaries (from attendance)</option>
          <option value="faculty">Faculty (lead and co-faculty)</option>
        </select>
      </div>

      <div>
        <label htmlFor="certificate-output" className={fieldLabelClassName}>
          Output
        </label>
        <select
          id="certificate-output"
          value={output}
          disabled={disabled}
          onChange={(event) => setOutput(event.target.value as CertificateOutput)}
          className={selectClassName}
        >
          <option value="pdf">Single PDF, one page each</option>
          <option value="zip">ZIP of individual PDFs</option>
        </select>
      </div>

      <div>
        <label htmlFor="certificate-issued-on" className={fieldLabelClassName}>
          Date of issue
        </label>
        <input
          id="certificate-issued-on"
          type="date"
          value={issuedOn}
          disabled={disabled}
          onChange={(event) => setIssuedOn(event.target.value)}
          className={inputClassName}
        />
        <p className={helpTextClassName}>Printed as "Given on …". Defaults to today.</p>
      </div>
    </GeneratorCard>
  )
}
