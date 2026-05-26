import PrintRoundedIcon from '@mui/icons-material/PrintRounded'
import { useEffect, useMemo, useRef, useState } from 'react'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import AdminDialog from './AdminDialog'

type UserPrintPreviewModalProps = {
  open: boolean
  pdfBlob: Blob | null
  loading: boolean
  errorMessage?: string | null
  onClose: () => void
  onRetry: () => void
}

const PDF_FILENAME = 'cems-users.pdf'

export default function UserPrintPreviewModal({
  open,
  pdfBlob,
  loading,
  errorMessage,
  onClose,
  onRetry,
}: UserPrintPreviewModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const [rendering, setRendering] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageCount, setPageCount] = useState(1)

  const pdfUrl = useMemo(() => (pdfBlob ? URL.createObjectURL(pdfBlob) : null), [pdfBlob])

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  useEffect(() => {
    if (open && pdfBlob) {
      setPageNumber(1)
      setPageCount(1)
    }
  }, [open, pdfBlob])

  useEffect(() => {
    if (!open || !pdfBlob || loading || errorMessage) {
      return undefined
    }

    let cancelled = false
    let loadingTask: { promise: Promise<unknown>; destroy: () => Promise<void> } | null = null
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | null = null
    let pdfDocument: {
      numPages: number
      destroy: () => Promise<void>
      getPage: (pageNumber: number) => Promise<{
        getViewport: (parameters: { scale: number }) => { width: number; height: number }
        render: (parameters: unknown) => { cancel: () => void; promise: Promise<unknown> }
      }>
    } | null = null

    async function renderPreview() {
      const canvas = canvasRef.current
      const container = previewContainerRef.current
      if (!canvas || !container || !pdfBlob) return

      setRendering(true)
      setRenderError(null)

      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

        const data = new Uint8Array(await pdfBlob.arrayBuffer())
        const task = pdfjsLib.getDocument({ data }) as NonNullable<typeof loadingTask>
        loadingTask = task
        const pdf = await task.promise as NonNullable<typeof pdfDocument>
        pdfDocument = pdf

        if (cancelled) return

        setPageCount(pdf.numPages)
        const previewPageNumber = Math.min(pageNumber, pdf.numPages)
        if (previewPageNumber !== pageNumber) {
          setPageNumber(previewPageNumber)
          return
        }

        const page = await pdf.getPage(previewPageNumber)
        const baseViewport = page.getViewport({ scale: 1 })
        const availableWidth = Math.max(320, container.clientWidth - 2)
        const scale = Math.min(1.4, Math.max(0.65, availableWidth / baseViewport.width))
        const viewport = page.getViewport({ scale })
        const devicePixelRatio = window.devicePixelRatio || 1
        const context = canvas.getContext('2d')

        if (!context) {
          throw new Error('Unable to prepare the PDF preview.')
        }

        canvas.width = Math.floor(viewport.width * devicePixelRatio)
        canvas.height = Math.floor(viewport.height * devicePixelRatio)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`
        context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
        context.clearRect(0, 0, viewport.width, viewport.height)

        renderTask = page.render({ canvasContext: context, viewport })
        await renderTask?.promise
      } catch (error) {
        if (!cancelled) {
          setRenderError(error instanceof Error ? error.message : 'Unable to render the PDF preview.')
        }
      } finally {
        if (!cancelled) {
          setRendering(false)
        }
      }
    }

    void renderPreview()

    return () => {
      cancelled = true
      renderTask?.cancel()
      void loadingTask?.destroy()
      void pdfDocument?.destroy()
    }
  }, [errorMessage, loading, open, pageNumber, pdfBlob])

  const handlePrintPdf = () => {
    if (!pdfUrl) return

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.src = pdfUrl

    iframe.onload = () => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      window.setTimeout(() => iframe.remove(), 1000)
    }

    document.body.appendChild(iframe)
  }

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="cursor-pointer border border-[#d8e1d4] bg-white px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Close
      </button>
      {errorMessage ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="cursor-pointer border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Retry
        </button>
      ) : (
        <>
          <a
            href={pdfUrl ?? undefined}
            download={PDF_FILENAME}
            aria-disabled={!pdfUrl || loading}
            className={[
              'border border-[#d8e1d4] px-4 py-2.5 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5]',
              !pdfUrl || loading ? 'pointer-events-none cursor-not-allowed opacity-60' : 'cursor-pointer',
            ].join(' ')}
          >
            Download PDF
          </a>
          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={!pdfUrl || loading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18492e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PrintRoundedIcon fontSize="small" />
            Print PDF
          </button>
        </>
      )}
    </div>
  )

  return (
    <AdminDialog
      open={open}
      title="Print User List"
      description="Preview the generated user list PDF before printing."
      footer={footer}
      maxWidthClassName="max-w-6xl"
      closeDisabled={loading}
      onClose={onClose}
    >
      {loading ? (
        <div className="flex items-center justify-center px-5 py-16">
          <div className="flex items-center gap-3 text-sm text-[#617462]">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#d8e1d4] border-t-[#1f5d3b]" />
            Preparing PDF preview...
          </div>
        </div>
      ) : errorMessage ? (
        <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">
          {errorMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {pdfBlob ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#617462]">
                Page {pageNumber} of {pageCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pageNumber <= 1 || rendering}
                  onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
                  className="cursor-pointer border border-[#d8e1d4] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pageNumber >= pageCount || rendering}
                  onClick={() => setPageNumber((current) => Math.min(pageCount, current + 1))}
                  className="cursor-pointer border border-[#d8e1d4] px-3 py-2 text-sm font-medium text-[#123524] transition-colors hover:bg-[#f6faf5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {rendering ? (
            <div className="flex items-center gap-3 text-sm text-[#617462]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d8e1d4] border-t-[#1f5d3b]" />
              Rendering preview...
            </div>
          ) : null}

          {renderError ? (
            <div className="border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]">
              {renderError}
            </div>
          ) : null}

          <div ref={previewContainerRef} className="overflow-auto border border-[#d8e1d4] bg-[#f4f7f1] p-4">
            <canvas ref={canvasRef} className="mx-auto block bg-white shadow-[0_12px_30px_rgba(18,53,36,0.10)]" />
          </div>
        </div>
      )}
    </AdminDialog>
  )
}
